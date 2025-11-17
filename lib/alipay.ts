import { AlipaySdk } from 'alipay-sdk'
import prisma from '@/lib/prisma'

export async function getAlipay() {
  // Prefer database settings; fallback to env (use raw SQL to avoid schema generation issues)
  type SiteSettingsRow = {
    alipay_app_id?: string | null
    alipay_private_key?: string | null
    alipay_public_key?: string | null
    alipay_gateway?: string | null
  }
  let setting: SiteSettingsRow | null = null
  try {
    const rows: SiteSettingsRow[] = await prisma.$queryRawUnsafe('SELECT alipay_app_id, alipay_private_key, alipay_public_key, alipay_gateway FROM site_settings LIMIT 1')
    setting = rows?.[0] || null
  } catch {}
  const appId = setting?.alipay_app_id || process.env.ALIPAY_APP_ID
  const privateKey = setting?.alipay_private_key || process.env.ALIPAY_PRIVATE_KEY
  const alipayPublicKey = setting?.alipay_public_key || process.env.ALIPAY_PUBLIC_KEY
  const gateway = setting?.alipay_gateway || process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'

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
  try {
    const rows: { alipay_notify_url?: string | null }[] = await prisma.$queryRawUnsafe('SELECT alipay_notify_url FROM site_settings LIMIT 1')
    const r: { alipay_notify_url?: string | null } | undefined = rows?.[0]
    return r?.alipay_notify_url || process.env.ALIPAY_NOTIFY_URL || ''
  } catch {
    return process.env.ALIPAY_NOTIFY_URL || ''
  }
}