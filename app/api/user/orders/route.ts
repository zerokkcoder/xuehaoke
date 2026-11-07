import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSiteUserId } from '@/lib/site-auth'

export async function POST(req: Request) {
  try {
    // 只认站点登录 Cookie，忽略请求体中的 username
    const userId = getSiteUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: '请先登录', data: [] }, { status: 401 })

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        outTradeNo: true,
        tradeNo: true,
        orderType: true,
        productId: true,
        productName: true,
        amount: true,
        status: true,
        payChannel: true,
        qrCode: true,
        createdAt: true,
        paidAt: true,
      }
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取订单失败', data: [] }, { status: 500 })
  }
}
