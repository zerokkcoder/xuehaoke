import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body?.username || '').trim()
    if (!username) return NextResponse.json({ success: false, message: '缺少用户名' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 })

    const accesses = await prisma.userResourceAccess.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            cover: true,
            category: { select: { name: true, slug: true } },
            subcategory: { select: { name: true, slug: true } },
          }
        }
      }
    })

    const data = accesses.map(a => ({
      resourceId: a.resourceId,
      accessedAt: a.createdAt,
      title: a.resource?.title || '',
      cover: a.resource?.cover || null,
      categorySlug: (a.resource?.category as any)?.slug || null,
      subcategorySlug: (a.resource?.subcategory as any)?.slug || null,
      categoryName: a.resource?.category?.name || '',
      subcategoryName: a.resource?.subcategory?.name || '',
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取下载记录失败', data: [] }, { status: 500 })
  }
}
