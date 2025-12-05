import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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
  const where = q ? { OR: [{ title: { contains: q } }, { url: { contains: q } }] } : undefined
  const [total, rows] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({ where, orderBy: [{ id: 'desc' }], skip, take: size, select: { id: true, title: true, url: true, enabled: true, createdAt: true } })
  ])
  return NextResponse.json({ success: true, data: rows, pagination: { page, size, total } })
}

export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const title = String(body?.title || '').trim()
  const urlStr = String(body?.url || '').trim()
  const enabled = body?.enabled === false ? false : true
  if (!title || !urlStr) return NextResponse.json({ success: false, message: '标题和链接不能为空' }, { status: 400 })
  try {
    const created = await prisma.favorite.create({ data: { title, url: urlStr, enabled } })
    return NextResponse.json({ success: true, data: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '创建失败' }, { status: 500 })
  }
}
