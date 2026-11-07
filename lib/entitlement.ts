import type { Order, Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

/**
 * 按订单类型发放权益（会员开通 / 单资源授权）。
 * 幂等：对同一订单重复调用不会叠加时长或产生重复授权。
 */
export async function grantOrderEntitlement(tx: Tx, order: Order): Promise<void> {
  if (!order.userId) return

  if (order.orderType === 'member') {
    // 会员开通：根据计划时长设置到期时间，durationDays = 0 表示永久
    const plan = await tx.membershipPlan.findUnique({ where: { id: order.productId } })
    if (!plan) return

    let expire: Date | null = null
    if (plan.durationDays > 0) {
      expire = new Date()
      expire.setDate(expire.getDate() + plan.durationDays)
    }

    await tx.user.update({
      where: { id: order.userId },
      data: { isVip: true, vipPlanId: plan.id, vipExpireAt: expire },
    })
  } else if (order.orderType === 'course') {
    // 课程/资源购买：记录用户资源访问授权
    await tx.userResourceAccess.upsert({
      where: { userId_resourceId: { userId: order.userId, resourceId: order.productId } },
      update: {},
      create: { userId: order.userId, resourceId: order.productId },
    })
  }
}
