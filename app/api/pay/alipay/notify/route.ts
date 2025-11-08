import { NextResponse } from 'next/server'
import { getAlipay } from '@/lib/alipay'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  // Alipay sends form-urlencoded; parse raw text
  const text = await req.text()
  const params = Object.fromEntries(new URLSearchParams(text))
  console.log('alipay notify params:', params)
  console.log('执行回调了')
  const alipay = await getAlipay()
  const ok = alipay.checkNotifySign(params)
  if (!ok) return new Response('fail', { status: 400 })

  const outTradeNo = params.out_trade_no || ''
  const tradeNo = params.trade_no || ''
  const tradeStatus = params.trade_status || ''
  const statusMap: Record<string, string> = {
    'TRADE_SUCCESS': 'success',
    'TRADE_FINISHED': 'success',
    'WAIT_BUYER_PAY': 'pending',
    'TRADE_CLOSED': 'closed',
  }
  const newStatus = statusMap[tradeStatus] || 'pending'
  try {
    const order = await prisma.order.update({
      where: { outTradeNo },
      data: {
        tradeNo,
        status: newStatus,
        paidAt: newStatus === 'success' ? new Date() : undefined,
        notifyRaw: params,
      },
    })

    // 若订单支付成功，按类型发放权益
    if (newStatus === 'success') {
      if (order.orderType === 'member' && order.userId) {
        // 会员开通：根据计划时长设置到期时间，durationDays=0 为永久
        const plan = await prisma.membershipPlan.findUnique({ where: { id: order.productId } })
        if (plan) {
          let expire: Date | null = null
          if (plan.durationDays > 0) {
            expire = new Date()
            expire.setDate(expire.getDate() + plan.durationDays)
          }
          await prisma.user.update({
            where: { id: order.userId },
            data: {
              isVip: true,
              vipPlanId: plan.id,
              vipExpireAt: expire || null,
            }
          })
        }
      } else if (order.orderType === 'course' && order.userId) {
        // 课程购买：记录用户资源访问授权
        await prisma.userResourceAccess.upsert({
          where: { userId_resourceId: { userId: order.userId, resourceId: order.productId } },
          update: {},
          create: { userId: order.userId, resourceId: order.productId }
        })
      }
    }
  } catch (e) {
    console.warn('update order failed', e)
  }
  return new Response('success')
}