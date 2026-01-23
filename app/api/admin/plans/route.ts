import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { invalidatePlansCache } from '@/lib/cache'

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

export async function GET(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const size = Math.max(1, Math.min(100, Number(url.searchParams.get('size')) || 10))
  const skip = (page - 1) * size
  const q = (url.searchParams.get('q') || '').trim()
  const where = q ? { OR: [{ name: { contains: q } }] } : undefined
  const [total, rows] = await Promise.all([
    prisma.membershipPlan.count({ where }),
    prisma.membershipPlan.findMany({ where, orderBy: [{ id: 'desc' }], skip, take: size })
  ])
  return NextResponse.json({ success: true, data: rows, pagination: { page, size, total } })
}

export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim()
  const price = Number(body?.price ?? 0)
  const durationDays = Number(body?.durationDays ?? 0)
  const dailyDownloads = Number(body?.dailyDownloads ?? 0)
  const isPopular = !!body?.isPopular
  const features = Array.isArray(body?.features) ? body.features : []
  if (!name) return NextResponse.json({ success: false, message: '计划名称不能为空' }, { status: 400 })
  if (price < 0) return NextResponse.json({ success: false, message: '价格必须为非负' }, { status: 400 })
  // 允许 0 表示永久会员
  if (durationDays < 0) return NextResponse.json({ success: false, message: '有效期天数不能为负（0表示永久）' }, { status: 400 })
  if (dailyDownloads < 0) return NextResponse.json({ success: false, message: '每日下载次数必须为非负' }, { status: 400 })
  const dup = await prisma.membershipPlan.findUnique({ where: { name } })
  if (dup) return NextResponse.json({ success: false, message: '计划名称已存在' }, { status: 400 })
  const created = await prisma.membershipPlan.create({ data: { name, price, durationDays, dailyDownloads, isPopular, features } })
  await invalidatePlansCache()
  return NextResponse.json({ success: true, data: created })
}