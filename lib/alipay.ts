import { AlipaySdk } from 'alipay-sdk'
import prisma from '@/lib/prisma'

export async function getAlipay() {
  // Prefer database settings; fallback to env
  const setting = await prisma.siteSetting.findFirst().catch(() => null)
  const appId = setting?.alipayAppId || process.env.ALIPAY_APP_ID
  const privateKey = setting?.alipayPrivateKey || process.env.ALIPAY_PRIVATE_KEY
  const alipayPublicKey = setting?.alipayPublicKey || process.env.ALIPAY_PUBLIC_KEY
  const gateway = setting?.alipayGateway || process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error('Alipay config missing: ALIPAY_APP_ID / PRIVATE_KEY / PUBLIC_KEY')
  }
  return new AlipaySdk({
    appId,
    privateKey,
    alipayPublicKey,
    gateway,
    signType: 'RSA2',
    keyType: 'PKCS8',
    camelcase: true,
    timeout: 5000,
  })
}

export async function getNotifyUrl() {
  const setting = await prisma.siteSetting.findFirst().catch(() => null)
  return setting?.alipayNotifyUrl || process.env.ALIPAY_NOTIFY_URL || ''
}