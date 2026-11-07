import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ success: false, message: '无效的资源ID' }, { status: 400 })
    }
    const r = await prisma.resource.findUnique({
      where: { id: idNum },
      include: {
        category: true,
        subcategory: true,
        tags: { include: { tag: true } },
        downloads: true,
      },
    })
    if (!r) return NextResponse.json({ success: false, message: '资源不存在' }, { status: 404 })

    // 从站点登录 Cookie 解析用户，判断下载权限
    const userId = getSiteUserId(req)

    let hasAccess = false
    let isVip = false
    if (userId) {
      const [access, user] = await Promise.all([
        prisma.userResourceAccess.findUnique({ where: { userId_resourceId: { userId, resourceId: idNum } } }),
        prisma.user.findUnique({ where: { id: userId }, select: { isVip: true, vipExpireAt: true } }),
      ])
      hasAccess = !!access
      const now = new Date()
      isVip = !!user?.isVip && (!!user?.vipExpireAt ? (new Date(user.vipExpireAt) > now) : true)
    }
    // 授权：已购买或 VIP 用户均可下载
    const authorized = !!userId && (hasAccess || isVip)
    const download = r.downloads[0] // Assuming single download link for now
    const data = {
      id: r.id,
      title: r.title,
      cover: r.cover || null,
      content: r.content,
      price: r.price,
      category: r.category ? { id: r.category.id, name: r.category.name, slug: (r.category as any).slug || null } : null,
      subcategory: r.subcategory ? { id: r.subcategory.id, name: r.subcategory.name, slug: (r.subcategory as any).slug || null } : null,
      tags: r.tags.map((t: any) => ({ id: t.tagId, name: t.tag.name, slug: (t.tag as any).slug || null })),
      // Return downloadUrl if authorized
      downloadUrl: authorized && download ? download.url : null,
      downloadCode: authorized && download ? download.code : null,
      authorized,
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取资源失败' }, { status: 500 })
  }
}
