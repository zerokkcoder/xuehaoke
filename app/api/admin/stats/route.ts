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
  try {
    const [totalUsers, vipUsers, totalResources, totalOrders, pendingOrders, successOrders, revenueAgg, totalDownloads] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVip: true } }),
      prisma.resource.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'success' } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),
      prisma.resourceDownload.count(),
    ])

    const latestOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { outTradeNo: true, status: true, amount: true, productName: true, createdAt: true }
    })

    const latestResources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, price: true, createdAt: true }
    })

    const data = {
      totalUsers,
      vipUsers,
      totalResources,
      totalOrders,
      pendingOrders,
      successOrders,
      revenue: Number(revenueAgg._sum.amount || 0),
      totalDownloads,
      latestOrders,
      latestResources,
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '统计失败' }, { status: 500 })
  }
}