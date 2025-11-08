import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email } = body || {}
    if (!email) return NextResponse.json({ success: false, message: '请输入邮箱' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ success: true, message: '如果该邮箱已注册，我们已发送验证码' })

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await prisma.emailVerification.create({ data: { email, code, expiresAt, used: false } })

    // 发送邮件的集成留空，这里仅输出到服务器日志，实际环境请接入邮件服务
    console.log(`[PASSWORD RESET] email=${email} code=${code} expiresAt=${expiresAt.toISOString()}`) // eslint-disable-line no-console

    const payload: any = { success: true, message: '验证码已发送至邮箱（15分钟内有效）' }
    if (process.env.NODE_ENV !== 'production') payload.debugCode = code
    return NextResponse.json(payload)
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '请求失败' }, { status: 500 })
  }
}