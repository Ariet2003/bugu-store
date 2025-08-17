import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить товар по ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения товара' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - обновить товар
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, categoryId, isActive } = body;
    const { id } = params;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      );
    }

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

    // Проверяем, что категория существует (если передана)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Категория не найдена' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || existingProduct.description,
        categoryId: categoryId || existingProduct.categoryId,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        variants: true
      }
    });

    // Вычисляем статистику
    const totalQuantity = product.variants.reduce((sum, variant) => sum + variant.quantity, 0);
    const minPrice = product.variants.length > 0 
      ? Math.min(...product.variants.map(v => Number(v.discountPrice || v.price)))
      : 0;
    const maxPrice = product.variants.length > 0 
      ? Math.max(...product.variants.map(v => Number(v.discountPrice || v.price)))
      : 0;
    // Пока без изображений
    const mainImage = null;

    return NextResponse.json({
      ...product,
      variantsCount: product.variants.length,
      totalQuantity,
      minPrice,
      maxPrice,
      mainImage
    });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления товара' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - удалить товар
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Проверяем, что товар существует
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            orderItems: true
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

    // Проверяем, есть ли заказы с этим товаром
    const hasOrders = existingProduct.variants.some(variant => variant.orderItems.length > 0);
    if (hasOrders) {
      return NextResponse.json(
        { error: 'Нельзя удалить товар, который есть в заказах' },
        { status: 400 }
      );
    }

    // Удаляем товар (варианты и изображения удалятся каскадно)
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления товара' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
