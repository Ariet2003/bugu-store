import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET - получить товар по ID с вариантами
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        variants: {
          include: {
            images: {
              orderBy: {
                isMain: 'desc'
              }
            },
            attributes: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Преобразуем данные для фронтенда
    const transformedVariants = product.variants.map(variant => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku || '',
      quantity: variant.quantity,
      price: Number(variant.price),
      discountPrice: variant.discountPrice ? Number(variant.discountPrice) : undefined,
      attributes: variant.attributes.map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      images: variant.images.map(img => img.imageUrl)
    }));

    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      category: product.category,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      variants: transformedVariants
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - обновить товар с вариантами
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Проверяем, что товар существует
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            images: true,
            attributes: true
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
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

    const result = await prisma.$transaction(async (tx) => {
      // Обновляем основные данные товара
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          categoryId,
          isActive
        }
      });

      // Удаляем старые варианты со всеми связанными данными
      await tx.productImage.deleteMany({
        where: {
          productVariant: {
            productId: id
          }
        }
      });

      await tx.productAttribute.deleteMany({
        where: {
          productVariant: {
            productId: id
          }
        }
      });

      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // Создаем новые варианты
      for (const variant of variants) {
        const { size, color, sku, quantity, price, discountPrice, attributes = [], images = [] } = variant;

        if (!size?.trim() || !color?.trim() || !price || quantity < 0) {
          throw new Error('Все поля варианта (размер, цвет, цена, количество) обязательны');
        }

        const createdVariant = await tx.productVariant.create({
          data: {
            productId: id,
            size: size.trim(),
            color: color.trim(),
            sku: sku?.trim() || null,
            quantity: parseInt(quantity.toString()),
            price: parseFloat(price.toString()),
            discountPrice: discountPrice ? parseFloat(discountPrice.toString()) : null
          }
        });

        // Создаем атрибуты варианта
        if (attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: attributes.map((attr: any) => ({
              productVariantId: createdVariant.id,
              name: attr.name.trim(),
              value: attr.value.trim()
            }))
          });
        }

        // Создаем изображения варианта
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((imageUrl: string, index: number) => ({
              productVariantId: createdVariant.id,
              imageUrl: imageUrl.trim(),
              isMain: index === 0 // Первое изображение - главное
            }))
          });
        }
      }

      // Возвращаем обновленный товар с полными данными
      return await tx.product.findUnique({
        where: { id },
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
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - удалить товар
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Проверяем, что товар существует
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Удаляем изображения
      await tx.productImage.deleteMany({
        where: {
          productVariant: {
            productId: id
          }
        }
      });

      // Удаляем атрибуты
      await tx.productAttribute.deleteMany({
        where: {
          productVariant: {
            productId: id
          }
        }
      });

      // Удаляем варианты
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // Удаляем товар
      await tx.product.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления товара', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
