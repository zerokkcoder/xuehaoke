import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const hdrs = (req as any).headers
    const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const { username, password, remember } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '缺少用户名或密码' }, { status: 400 })
    }

    // Ensure default admin exists
    const exists = await prisma.adminUser.findUnique({ where: { username: 'admin' }, select: { id: true } })
    if (!exists) {
      const hash = await bcrypt.hash('123456', 10)
      await prisma.adminUser.create({ data: { username: 'admin', passwordHash: hash, role: 'superadmin', status: 'active' } })
    }

    // Verify provided credentials
    const user = await prisma.adminUser.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ success: false, message: '账号不存在' }, { status: 401 })
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      await prisma.adminUser.update({ where: { id: user.id }, data: { failedAttempts: user.failedAttempts + 1 } })
      return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 })
    }
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedAttempts: 0 } })

    // Issue JWT and set HttpOnly cookie
    const secret = process.env.ADMIN_JWT_SECRET || 'dev_secret_change_me'
    const token = jwt.sign({ uid: user.id, username: user.username, role: user.role }, secret, { expiresIn: remember ? '30d' : '2h' })
    const isHttps = String(proto).toLowerCase() === 'https'
    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 30 * 24 * 60 * 60 : 2 * 60 * 60,
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '服务器错误' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
