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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number(id)
  if (!Number.isFinite(idNum) || idNum <= 0) return NextResponse.json({ success: false, message: '无效计划ID' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string') data.name = String(body.name).trim()
  if (body.price != null) data.price = Number(body.price)
  if (body.durationDays != null) data.durationDays = Number(body.durationDays)
  if (body.dailyDownloads != null) data.dailyDownloads = Number(body.dailyDownloads)
  if (body.isPopular != null) data.isPopular = !!body.isPopular
  if (Array.isArray(body.features)) data.features = body.features
  try {
    const updated = await prisma.membershipPlan.update({ where: { id: idNum }, data })
    await invalidatePlansCache()
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '更新失败' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number(id)
  if (!Number.isFinite(idNum) || idNum <= 0) return NextResponse.json({ success: false, message: '无效计划ID' }, { status: 400 })
  try {
    await prisma.membershipPlan.delete({ where: { id: idNum } })
    await invalidatePlansCache()
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '删除失败' }, { status: 500 })
  }
}