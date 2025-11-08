import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 使用 Prisma ORM 查询分类与子分类

export async function GET() {
  // Prisma 不允许在同一查询同时使用 include 和 select。这里使用 include 并在返回时挑选需要的字段。
  const rows = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    include: {
      subcategories: {
        orderBy: [{ sort: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, sort: true },
      },
    },
  })
  const data = rows.map((c) => ({ id: c.id, name: c.name, sort: c.sort, subcategories: c.subcategories }))
  return NextResponse.json({ success: true, data })
}