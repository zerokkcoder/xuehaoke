import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hashed = crypto.scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hashed.toString('hex')}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, code, password } = body || {}
    if (!email || !code || !password) return NextResponse.json({ success: false, message: '请输入邮箱、验证码和新密码' }, { status: 400 })
    if (String(password).length < 6) return NextResponse.json({ success: false, message: '新密码至少6位' }, { status: 400 })

    const ev = await prisma.emailVerification.findFirst({ where: { email, code, used: false }, orderBy: { id: 'desc' } })
    if (!ev) return NextResponse.json({ success: false, message: '验证码无效' }, { status: 400 })
    if (ev.expiresAt.getTime() < Date.now()) return NextResponse.json({ success: false, message: '验证码已过期' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 })

    const passwordHash = hashPassword(password)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    await prisma.emailVerification.update({ where: { id: ev.id }, data: { used: true } })

    return NextResponse.json({ success: true, message: '密码已重置，请使用新密码登录' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '重置失败' }, { status: 500 })
  }
}