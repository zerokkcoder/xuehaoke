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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) return NextResponse.json({ success: false, message: '无效的收藏ID' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.title === 'string') data.title = String(body.title).trim()
  if (typeof body.url === 'string') data.url = String(body.url).trim()
  if (typeof body.enabled === 'boolean') data.enabled = body.enabled
  if (Object.keys(data).length === 0) return NextResponse.json({ success: false, message: '未提供可更新的字段' }, { status: 400 })
  try {
    const updated = await prisma.favorite.update({ where: { id: idNum }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '更新失败' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) return NextResponse.json({ success: false, message: '无效的收藏ID' }, { status: 400 })
  try {
    await prisma.favorite.delete({ where: { id: idNum } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '删除失败' }, { status: 500 })
  }
}
