import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function POST(req: Request) {
  try {
    // 只认站点登录 Cookie：用户只能修改自己的头像
    const userId = getSiteUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: '请先登录' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const avatarUrl = String(body?.avatarUrl || '').trim()
    if (!avatarUrl) {
      return NextResponse.json({ success: false, message: '缺少头像地址' }, { status: 400 })
    }

    await prisma.$executeRawUnsafe('UPDATE users SET avatar_url = ? WHERE id = ?', avatarUrl, userId)
    return NextResponse.json({ success: true, data: { avatarUrl } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '更新头像失败' }, { status: 500 })
  }
}
