import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 使用 Prisma ORM 查询分类与子分类

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    include: { subcategories: { orderBy: [{ sort: 'asc' }, { id: 'asc' }], select: { id: true, name: true, sort: true } } },
    select: { id: true, name: true, sort: true, subcategories: true },
  })
  return NextResponse.json({ success: true, data: categories })
}