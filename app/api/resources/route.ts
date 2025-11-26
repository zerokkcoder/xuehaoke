import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const size = Math.max(1, Math.min(50, Number(url.searchParams.get('size')) || 6))
    const skip = (page - 1) * size
    const q = (url.searchParams.get('q') || '').trim()
    const categoryIdParam = url.searchParams.get('categoryId')
    const subcategoryIdParam = url.searchParams.get('subcategoryId')
    const tagIdParam = url.searchParams.get('tagId')
    const sortParam = (url.searchParams.get('sort') || 'latest').trim()
    const categoryId = categoryIdParam ? Number(categoryIdParam) : undefined
    const subcategoryId = subcategoryIdParam ? Number(subcategoryIdParam) : undefined
    const tagId = tagIdParam ? Number(tagIdParam) : undefined
    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            // { content: { contains: q } },
          ],
        }
      : undefined

    // 合并分类/子分类过滤条件
    const finalWhere: any = { ...(where || {}) }
    if (Number.isFinite(categoryId)) finalWhere.categoryId = Number(categoryId)
    if (Number.isFinite(subcategoryId)) finalWhere.subcategoryId = Number(subcategoryId)
    if (Number.isFinite(tagId)) finalWhere.tags = { some: { tagId: Number(tagId) } }

    // 排序：latest(默认) / downloads / views / comments
    const orderBy =
      sortParam === 'downloads'
        ? [{ downloadCount: 'desc' as const }]
        : sortParam === 'views'
        ? [{ viewCount: 'desc' as const }]
        : sortParam === 'comments'
        ? [{ hotScore: 'desc' as const }]
        : [{ id: 'desc' as const }]

    // Debug log: observe incoming requests and parameters during development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[API /resources] page=${page} size=${size} q="${q}" categoryId=${categoryId ?? ''} subcategoryId=${subcategoryId ?? ''} tagId=${tagId ?? ''} sort=${sortParam}`)
    }

    const [total, rows] = await Promise.all([
      prisma.resource.count({ where: finalWhere }),
      prisma.resource.findMany({
        orderBy,
        where: finalWhere,
        select: {
          id: true,
          categoryId: true,
          subcategoryId: true,
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
      subcategoryName: r.subcategory?.name || '',
      categoryId: r.categoryId,
      subcategoryId: r.subcategoryId,
    }))

    return NextResponse.json({ success: true, data, pagination: { page, size, total } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取资源失败', data: [], pagination: { page: 1, size: 0, total: 0 } }, { status: 500 })
  }
}
