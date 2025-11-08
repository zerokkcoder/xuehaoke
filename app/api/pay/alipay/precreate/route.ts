import { NextResponse } from 'next/server'
import { getAlipay, getNotifyUrl } from '@/lib/alipay'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { amount, subject, orderId } = body || {}
    const out_trade_no = String(orderId || `ORD-${Date.now()}`)
    const total_amount = Number(amount)
    // 校验金额与标题
    if (!Number.isFinite(total_amount) || total_amount < 0.01) {
      return NextResponse.json({ success: false, message: '金额必须≥0.01元' }, { status: 400 })
    }
    const safeSubject = String(subject || '').replace(/[\/=&]/g, ' ').slice(0, 256).trim()
    if (!safeSubject) {
      return NextResponse.json({ success: false, message: '订单标题不能为空' }, { status: 400 })
    }

    const alipay = await getAlipay()
    const res: any = await alipay.exec(
      'alipay.trade.precreate',
      {
        notify_url: await getNotifyUrl(),
        biz_content: {
          out_trade_no,
          total_amount: total_amount.toFixed(2),
          subject: safeSubject,
          product_code: 'FACE_TO_FACE_PAYMENT',
        }
      },
      { validateSign: true }
    )

    // 根据文档，返回 code=10000 且包含 qrCode 为成功
    if (res?.code !== '10000' || !res?.qrCode) {
      const msg = res?.sub_msg || res?.msg || '预下单失败'
      return NextResponse.json({ success: false, message: msg, data: res }, { status: 500 })
    }
    const qrCode = res.qrCode

    // 从站点用户 Cookie 获取 userId
    let siteUserId: number | null = null
    try {
      const cookieHeader = (req as any).headers.get('cookie') || ''
      const match = cookieHeader.match(/site_token=([^;]+)/)
      const token = match ? match[1] : ''
      if (token) {
        const secret = process.env.SITE_JWT_SECRET || 'site_dev_secret_change_me'
        const payload = jwt.verify(token, secret) as any
        siteUserId = Number(payload?.uid) || null
      }
    } catch {}

    // 未登录直接拒绝下单（避免产生无法发放权益的订单）
    if (!siteUserId) {
      return NextResponse.json({ success: false, message: '请先登录后再支付' }, { status: 401 })
    }

    // 二维码生成成功后再创建订单（pending）
    await prisma.order.create({
      data: {
        userId: siteUserId,
        outTradeNo: out_trade_no,
        orderType: String(body?.orderType || 'course'),
        productId: body?.productId ? Number(body.productId) : 0,
        productName: safeSubject,
        amount: total_amount,
        status: 'pending',
        payChannel: 'alipay',
      },
    })
    return NextResponse.json({ success: true, data: { qrCode: qrCode, outTradeNo: out_trade_no } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '下单失败' }, { status: 500 })
  }
}