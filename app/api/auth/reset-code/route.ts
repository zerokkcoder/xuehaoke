import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'

function generateCode(len = 6) {
  let s = ''
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10)
  return s
}

function canSendEmail() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    (process.env.SMTP_USER || process.env.SMTP_FROM) &&
    (process.env.SMTP_PASS || process.env.SMTP_SECURE === 'false')
  )
}

async function sendResetEmail(to: string, code: string) {
  const host = process.env.SMTP_HOST as string
  const port = Number(process.env.SMTP_PORT ?? 587)
  const secure = (process.env.SMTP_SECURE ?? 'false') === 'true' || port === 465
  const user = (process.env.SMTP_USER as string | undefined)
  const pass = (process.env.SMTP_PASS as string | undefined) ?? (process.env.SMTP_PASSWORD as string | undefined)
  const from = (process.env.SMTP_FROM as string | undefined) ?? user ?? 'no-reply@example.com'

  const transporter = nodemailer.createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined })
  const subject = '密码重置验证码'
  const html = `
    <p>您好！</p>
    <p>您的密码重置验证码为：<strong>${code}</strong></p>
    <p>该验证码在 5 分钟内有效，请尽快完成重置。</p>
    <p>如非本人操作，请忽略此邮件。</p>
  `
  await transporter.sendMail({ from, to, subject, html, text: `您的密码重置验证码为：${code}（5分钟内有效）` })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email: string = (body?.email || '').trim()
    if (!email) return NextResponse.json({ success: false, message: '邮箱不能为空' }, { status: 400 })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (!exists) return NextResponse.json({ success: true, message: '如果该邮箱已注册，我们已发送验证码' })

    const code = generateCode(6)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    await prisma.emailVerification.create({ data: { email, code, expiresAt, used: false } })

    const sendRealEmail = process.env.SEND_REAL_EMAIL
    if (sendRealEmail && canSendEmail()) {
      try {
        await sendResetEmail(email, code)
        return NextResponse.json({ success: true, data: { email, expiresAt } })
      } catch (e: any) {
        return NextResponse.json({ success: false, message: e?.message || '邮件发送失败，请稍后再试' }, { status: 500 })
      }
    }

    console.log(`[reset-code] email=${email} code=${code}`) // eslint-disable-line no-console
    return NextResponse.json({ success: true, data: { email, code, expiresAt } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '发送验证码失败' }, { status: 500 })
  }
}