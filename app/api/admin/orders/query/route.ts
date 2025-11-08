import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAlipay } from '@/lib/alipay'
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

export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const outTradeNo = String(body?.outTradeNo || '')
  if (!outTradeNo) return NextResponse.json({ success: false, message: '缺少订单号' }, { status: 400 })
  const alipay = await getAlipay()
  try {
    const res: any = await alipay.exec('alipay.trade.query', {
      biz_content: { out_trade_no: outTradeNo }
    }, { validateSign: true })
    console.log('alipay.trade.query', res)
    const tradeStatus = res?.tradeStatus || 'UNKNOWN'
    const tradeNo = res?.tradeNo || ''
    const statusMap: Record<string, string> = {
      'TRADE_SUCCESS': 'success',
      'TRADE_FINISHED': 'success',
      'WAIT_BUYER_PAY': 'pending',
      'TRADE_CLOSED': 'closed',
    }
    const newStatus = statusMap[tradeStatus] || 'pending'
    let updated
    try {
      updated = await prisma.order.update({ where: { outTradeNo }, data: { status: newStatus, tradeNo, paidAt: newStatus === 'success' ? new Date() : undefined } })
    } catch {}
    return NextResponse.json({ success: true, data: { status: tradeStatus, raw: res, updated } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '查询失败' }, { status: 500 })
  }
}