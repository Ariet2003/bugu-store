import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все категории
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Добавляем счетчики
    const categoriesWithStats = categories.map(category => ({
      ...category,
      productsCount: category.products.length,
      childrenCount: category.children.length
    }));

    return NextResponse.json(categoriesWithStats);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения категорий' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - создать новую категорию
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parentId } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      );
    }

    // Проверяем, что родительская категория существует
    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId }
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Родительская категория не найдена' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true,
        products: {
          select: {
            id: true
          }
        }
      }
    });

    return NextResponse.json({
      ...category,
      productsCount: category.products.length,
      childrenCount: category.children.length
    });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Ошибка создания категории' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
