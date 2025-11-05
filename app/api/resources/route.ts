import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const size = Math.max(1, Math.min(50, Number(url.searchParams.get('size')) || 6))
    const skip = (page - 1) * size

    const [total, rows] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.findMany({
        orderBy: [{ id: 'desc' }],
        select: {
          id: true,
          title: true,
          cover: true,
          category: { select: { name: true } },
          subcategory: { select: { name: true } },
        },
        skip,
        take: size,
      })
    ])

    const data = rows.map(r => ({
      id: r.id,
      title: r.title,
      cover: r.cover || null,
      categoryName: r.category?.name || '',
      subcategoryName: r.subcategory?.name || ''
    }))

    return NextResponse.json({ success: true, data, pagination: { page, size, total } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取资源失败', data: [], pagination: { page: 1, size: 0, total: 0 } }, { status: 500 })
  }
}