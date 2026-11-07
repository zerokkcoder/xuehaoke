import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const resourceId = Number(body?.resourceId || 0)
    if (!resourceId) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }

    // 登录态只以站点 Cookie 为准，绝不信任前端传入的 username
    const userId = getSiteUserId(req)
    if (!userId) {
      return NextResponse.json({ success: true, data: { hasAccess: false, isVip: false } })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isVip: true, vipExpireAt: true },
    })
    if (!user) {
      return NextResponse.json({ success: true, data: { hasAccess: false, isVip: false } })
    }

    const now = new Date()
    const effectiveVip = !!user.isVip && (!!user.vipExpireAt ? (new Date(user.vipExpireAt) > now) : true)
    const access = await prisma.userResourceAccess.findUnique({
      where: { userId_resourceId: { userId, resourceId } }
    })

    // 如果有权限，获取下载链接
    let downloadInfo = {}
    if (effectiveVip || !!access) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: { downloads: true }
      })
      const download = resource?.downloads?.[0]
      if (download) {
        downloadInfo = {
          downloadUrl: download.url,
          downloadCode: download.code
        }
      }
    }

    return NextResponse.json({ success: true, data: { hasAccess: effectiveVip || !!access, isVip: effectiveVip, ...downloadInfo } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '查询失败' }, { status: 500 })
  }
}
