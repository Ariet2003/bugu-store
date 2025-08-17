import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - получить все товары с вариантами
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        variants: {
          include: {
            images: true,
            attributes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Преобразуем данные для фронтенда
    const transformedProducts = products.map(product => {
      const variants = product.variants || [];
      const prices = variants.map(v => v.price);
      const quantities = variants.map(v => v.quantity);
      
      // Находим главное изображение
      let mainImage = null;
      for (const variant of variants) {
        const mainImg = variant.images?.find(img => img.isMain);
        if (mainImg) {
          mainImage = mainImg.imageUrl;
          break;
        }
        if (!mainImage && variant.images?.length > 0) {
          mainImage = variant.images[0].imageUrl;
        }
      }

      return {
        ...product,
        variantsCount: variants.length,
        totalQuantity: quantities.reduce((sum, q) => sum + q, 0),
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        mainImage,
        variants: variants.length,
        images: variants.reduce((total, v) => total + (v.images?.length || 0), 0)
      };
    });
    
    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения товаров', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - создать новый товар с вариантами
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, categoryId, isActive = true, variants = [] } = body;
    


    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Категория товара обязательна' },
        { status: 400 }
      );
    }

    if (variants.length === 0) {
      return NextResponse.json(
        { error: 'Должен быть хотя бы один вариант товара' },
        { status: 400 }
      );
    }

    // Проверяем, что категория существует
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 400 }
      );
    }

    // Создаем товар с вариантами в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем товар
      const product = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          categoryId,
          isActive
        }
      });

      // Создаем варианты
      for (const variant of variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku || null,
            quantity: variant.quantity,
            price: variant.price,
            discountPrice: variant.discountPrice || null
          }
        });

        // Создаем атрибуты варианта
        if (variant.attributes && variant.attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: variant.attributes.map((attr: any) => ({
              productVariantId: createdVariant.id,
              name: attr.name,
              value: attr.value
            }))
          });
        }

        // Создаем изображения варианта
        if (variant.images && variant.images.length > 0) {
          await tx.productImage.createMany({
            data: variant.images.map((imageUrl: string, index: number) => ({
              productVariantId: createdVariant.id,
              imageUrl,
              isMain: index === 0 // Первое изображение делаем главным
            }))
          });
        }
      }

      // Возвращаем созданный товар с полными данными
      return await tx.product.findUnique({
        where: { id: product.id },
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          variants: {
            include: {
              images: true,
              attributes: true
            }
          }
        }
      });
    });

    // Преобразуем данные для ответа
    const productVariants = result?.variants || [];
    const prices = productVariants.map(v => Number(v.price));
    const quantities = productVariants.map(v => v.quantity);
    
    let mainImage = null;
    for (const variant of productVariants) {
      const mainImg = variant.images?.find(img => img.isMain);
      if (mainImg) {
        mainImage = mainImg.imageUrl;
        break;
      }
      if (!mainImage && variant.images?.length > 0) {
        mainImage = variant.images[0].imageUrl;
      }
    }

    return NextResponse.json({
      ...result,
      variantsCount: productVariants.length,
      totalQuantity: quantities.reduce((sum, q) => sum + q, 0),
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      mainImage,
      variants: productVariants.length,
      images: productVariants.reduce((total, v) => total + (v.images?.length || 0), 0)
    });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания товара', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
