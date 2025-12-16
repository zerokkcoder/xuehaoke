import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

function verifyAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/admin_token=([^;]+)/)
  const token = match ? match[1] : ''
  if (!token) return null
  try {
    const secret = process.env.ADMIN_JWT_SECRET || 'dev_secret_change_me'
    return jwt.verify(token, secret) as any
  } catch {
    return null
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hashed = crypto.scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hashed.toString('hex')}`
}

// GET /api/admin/users?page=&size=&q=
export async function GET(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const size = Math.max(1, Math.min(100, Number(url.searchParams.get('size')) || 10))
  const skip = (page - 1) * size
  const q = (url.searchParams.get('q') || '').trim()
  const where = q
    ? { OR: [{ username: { contains: q } }, { email: { contains: q } }] }
    : undefined
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      skip,
      take: size,
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        isVip: true,
        vipExpireAt: true,
        vipPlan: { select: { name: true } },
      },
    }),
  ])
  const data = rows.map((u: any) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    isVip: !!u.isVip,
    vipExpireAt: u.vipExpireAt ?? null,
    vipPlanName: (u.vipPlan?.name ?? null),
  }))
  return NextResponse.json({ success: true, data, pagination: { page, size, total } })
}

// POST /api/admin/users
export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const username = String(body?.username || '').trim()
  const email = String(body?.email || '').trim()
  const password = String(body?.password || '')
  const emailVerified = !!body?.emailVerified
  if (!username) return NextResponse.json({ success: false, message: '用户名不能为空' }, { status: 400 })
  if (!email) return NextResponse.json({ success: false, message: '邮箱不能为空' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ success: false, message: '密码至少6位' }, { status: 400 })
  const dup = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } })
  if (dup) return NextResponse.json({ success: false, message: '用户名或邮箱已存在' }, { status: 400 })
  const passwordHash = hashPassword(password)
  const created = await prisma.user.create({ data: { username, email, passwordHash, emailVerified } })
  return NextResponse.json({ success: true, data: { id: created.id, username: created.username, email: created.email, emailVerified: created.emailVerified, createdAt: created.createdAt } })
}
