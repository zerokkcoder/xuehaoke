import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function POST(req: Request) {
  try {
    // 只认站点登录 Cookie，忽略请求体中的 username
    const userId = getSiteUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: '请先登录', data: [] }, { status: 401 })

    const accesses = await prisma.userResourceAccess.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        resource: { include: { category: true, subcategory: true } }
      }
    })

    const data = accesses.map((a: any) => ({
      resourceId: a.resourceId,
      accessedAt: a.createdAt,
      title: a.resource?.title || '',
      cover: a.resource?.cover || null,
      categorySlug: (a.resource as any)?.category?.slug || null,
      subcategorySlug: (a.resource as any)?.subcategory?.slug || null,
      categoryName: a.resource?.category?.name || '',
      subcategoryName: a.resource?.subcategory?.name || '',
    }))

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取下载记录失败', data: [] }, { status: 500 })
  }
}
