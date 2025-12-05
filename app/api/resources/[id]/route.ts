import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
        category: { select: { id: true, name: true, slug: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
        downloads: true,
      },
    })
    if (!r) return NextResponse.json({ success: false, message: '资源不存在' }, { status: 404 })

    // 解析站点用户 Cookie，判断下载权限
    let userId: number | null = null
    try {
      const cookieHeader = (req as any).headers.get('cookie') || ''
      const match = cookieHeader.match(/site_token=([^;]+)/)
      const token = match ? match[1] : ''
      if (token) {
        const secret = process.env.SITE_JWT_SECRET || 'site_dev_secret_change_me'
        const payload = jwt.verify(token, secret) as any
        userId = Number(payload?.uid) || null
      }
    } catch {}

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
    const data = {
      id: r.id,
      title: r.title,
      cover: r.cover || null,
      content: r.content,
      price: r.price,
      category: r.category ? { id: r.category.id, name: r.category.name, slug: (r.category as any).slug || null } : null,
      subcategory: r.subcategory ? { id: r.subcategory.id, name: r.subcategory.name, slug: (r.subcategory as any).slug || null } : null,
      tags: r.tags.map((t: any) => ({ id: t.tagId, name: t.tag.name, slug: (t.tag as any).slug || null })),
      downloads: authorized ? r.downloads.map((d: any) => ({ id: d.id, url: d.url, code: d.code })) : [],
      authorized,
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取资源失败' }, { status: 500 })
  }
}
