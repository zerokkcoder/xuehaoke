import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const size = Math.max(1, Math.min(50, Number(url.searchParams.get('size')) || 6))

    const total = await prisma.resource.count()
    if (!total) {
      return NextResponse.json({ success: true, data: [] })
    }

    const maxSkip = Math.max(0, total - size)
    const skip = maxSkip > 0 ? Math.floor(Math.random() * (maxSkip + 1)) : 0

    const rows = await prisma.resource.findMany({
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

    const data = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      cover: r.cover || null,
      categoryName: r.category?.name || '',
      subcategoryName: r.subcategory?.name || '',
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取随机资源失败', data: [] }, { status: 500 })
  }
}
