import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function POST(req: Request) {
  try {
    // 只认站点登录 Cookie，忽略请求体中的 username
    const userId = getSiteUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { vipPlan: true } })
    if (!user) return NextResponse.json({ success: false, message: '用户不存在' }, { status: 401 })

    let avatarUrl: string | null = null
    try {
      const rows: any[] = await prisma.$queryRawUnsafe('SELECT avatar_url FROM users WHERE id = ? LIMIT 1', user.id)
      avatarUrl = rows?.[0]?.avatar_url ?? null
    } catch {}

    // Check if VIP is expired
    const now = new Date()
    const isExpired = user.vipExpireAt && new Date(user.vipExpireAt) < now
    const isVip = !!user.isVip && !isExpired
    const data = {
      id: user.id,
      username: user.username,
      email: user.email,
      isVip,
      vipExpireAt: isExpired ? null : user.vipExpireAt,
      vipPlanId: isExpired ? null : user.vipPlanId,
      vipPlanName: isExpired ? null : (user.vipPlan?.name || null),
      vipDailyLimit: isExpired ? null : (user.vipPlan?.dailyDownloads ?? null),
      avatarUrl,
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '查询失败' }, { status: 500 })
  }
}
