import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ success: false, message: '无效的资源ID' }, { status: 400 })
    }

    // 登录态只以站点 Cookie 为准
    const userId = getSiteUserId(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 })
    }

    const [r, user, access] = await Promise.all([
      prisma.resource.findUnique({
        where: { id: idNum },
        select: { price: true, viewCount: true, downloadCount: true, downloads: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          isVip: true,
          vipExpireAt: true,
          dailyDownloadCount: true,
          dailyDownloadDate: true,
          vipPlan: { select: { dailyDownloads: true } },
        },
      }),
      prisma.userResourceAccess.findUnique({
        where: { userId_resourceId: { userId, resourceId: idNum } },
      }),
    ])

    if (!r) return NextResponse.json({ success: false, message: '资源不存在' }, { status: 404 })
    if (!user) return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 })

    const now = new Date()
    const isVip = !!user.isVip && (!!user.vipExpireAt ? (new Date(user.vipExpireAt) > now) : true)
    const purchased = !!access
    const isFree = Number(r.price) <= 0

    // 免费资源、已购买、或 VIP 才可下载
    if (!isFree && !purchased && !isVip) {
      return NextResponse.json({ success: false, message: '暂无下载权限，请先购买或升级 VIP' }, { status: 403 })
    }

    const download = r.downloads[0]
    if (!download) {
      return NextResponse.json({ success: false, message: '下载链接暂不可用' }, { status: 404 })
    }

    // VIP 每日下载额度：仅对「依赖 VIP 权限」的下载计数（单独购买过的资源不占用额度）
    const countAgainstQuota = isVip && !purchased && !isFree
    const limit = user.vipPlan?.dailyDownloads ?? 0
    const todayStart = startOfToday()
    const sameDay = !!user.dailyDownloadDate
      && new Date(user.dailyDownloadDate).toDateString() === todayStart.toDateString()
    const used = sameDay ? (user.dailyDownloadCount || 0) : 0

    if (countAgainstQuota && limit > 0 && used >= limit) {
      return NextResponse.json(
        { success: false, message: `今日下载次数已用完（${limit} 次/天），明天再来吧`, data: { limit, used } },
        { status: 429 },
      )
    }

    const nextDownload = (r.downloadCount || 0) + 1
    const nextHot = (r.viewCount || 0) + nextDownload * 3

    await prisma.$transaction([
      prisma.resource.update({
        where: { id: idNum },
        data: { downloadCount: nextDownload, hotScore: nextHot },
      }),
      ...(countAgainstQuota
        ? [prisma.user.update({
            where: { id: userId },
            data: { dailyDownloadCount: used + 1, dailyDownloadDate: todayStart },
          })]
        : []),
    ])

    return NextResponse.json({
      success: true,
      message: '下载开始',
      data: {
        downloadUrl: download.url,
        downloadCode: download.code,
        downloadCount: nextDownload,
        remaining: countAgainstQuota && limit > 0 ? Math.max(0, limit - (used + 1)) : null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '下载失败' }, { status: 500 })
  }
}
