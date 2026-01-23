import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { invalidateSiteSettingsCache } from '@/lib/cache'

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
  const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM site_settings LIMIT 1')
  const r = rows?.[0]
  if (!r) return NextResponse.json({ success: true, data: null })
  const data = {
    id: r.id ?? null,
    // Alipay configs (camelCase for UI)
    alipayAppId: r.alipay_app_id ?? null,
    alipayPrivateKey: r.alipay_private_key ?? null,
    alipayPublicKey: r.alipay_public_key ?? null,
    alipayGateway: r.alipay_gateway ?? null,
    alipayNotifyUrl: r.alipay_notify_url ?? null,
    // Site display configs
    siteName: r.site_name ?? null,
    siteLogo: r.site_logo ?? null,
    siteSlogan: r.site_slogan ?? null,
    siteKeywords: r.site_keywords ?? null,
    siteDescription: r.site_description ?? null,
    heroImage: r.hero_image ?? null,
    footerText: r.footer_text ?? null,
    siteSubtitle: r.site_subtitle ?? null,
  }
  return NextResponse.json({ success: true, data })
}

export async function PUT(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  // Only accept known fields
  if (body.alipayAppId != null) data.alipayAppId = String(body.alipayAppId)
  if (body.alipayPrivateKey != null) data.alipayPrivateKey = String(body.alipayPrivateKey)
  if (body.alipayPublicKey != null) data.alipayPublicKey = String(body.alipayPublicKey)
  if (body.alipayGateway != null) data.alipayGateway = String(body.alipayGateway)
  if (body.alipayNotifyUrl != null) data.alipayNotifyUrl = String(body.alipayNotifyUrl)
  // site display configs
  const displayData: Record<string, string> = {}
  if (body.siteName != null) displayData.site_name = String(body.siteName)
  if (body.siteLogo != null) displayData.site_logo = String(body.siteLogo)
  if (body.siteSlogan != null) displayData.site_slogan = String(body.siteSlogan)
  if (body.siteKeywords != null) displayData.site_keywords = String(body.siteKeywords)
  if (body.siteDescription != null) displayData.site_description = String(body.siteDescription)
  if (body.heroImage != null) displayData.hero_image = String(body.heroImage)
  if (body.footerText != null) displayData.footer_text = String(body.footerText)
  if (body.siteSubtitle != null) displayData.site_subtitle = String(body.siteSubtitle)

  try {
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT id, alipay_public_key FROM site_settings LIMIT 1')
    const existing = rows?.[0]
    // 仅当尝试更新/设置 Alipay 关键字段时才强制要求公钥；若已有公钥并未改动，可允许保存站点展示配置
    const incomingPub = (data.alipayPublicKey ?? '').trim()
    const effectivePub = incomingPub || (existing?.alipay_public_key || '').trim()
    const incomingAlipayKeyChange = (
      data.alipayAppId != null ||
      data.alipayPrivateKey != null
    )
    if (!effectivePub && incomingAlipayKeyChange) {
      return NextResponse.json({ success: false, message: '请填写支付宝公钥' }, { status: 400 })
    }
    let saved
    if (existing?.id) {
      // UPDATE all provided fields via raw SQL
      const combined: Record<string, string> = {
        ...(data.alipayAppId != null ? { alipay_app_id: String(data.alipayAppId) } : {}),
        ...(data.alipayPrivateKey != null ? { alipay_private_key: String(data.alipayPrivateKey) } : {}),
        ...(data.alipayPublicKey != null ? { alipay_public_key: String(data.alipayPublicKey) } : {}),
        ...(data.alipayGateway != null ? { alipay_gateway: String(data.alipayGateway) } : {}),
        ...(data.alipayNotifyUrl != null ? { alipay_notify_url: String(data.alipayNotifyUrl) } : {}),
        ...displayData,
      }
      if (Object.keys(combined).length) {
        const sets = Object.keys(combined).map(k => `${k} = ?`).join(', ')
        const values = Object.values(combined)
        await prisma.$executeRawUnsafe(`UPDATE site_settings SET ${sets} WHERE id = ?`, ...values, existing.id)
      }
    } else {
      // INSERT new row with provided fields
      const combined: Record<string, string> = {
        ...(data.alipayAppId != null ? { alipay_app_id: String(data.alipayAppId) } : {}),
        ...(data.alipayPrivateKey != null ? { alipay_private_key: String(data.alipayPrivateKey) } : {}),
        ...(data.alipayPublicKey != null ? { alipay_public_key: String(data.alipayPublicKey) } : {}),
        ...(data.alipayGateway != null ? { alipay_gateway: String(data.alipayGateway) } : {}),
        ...(data.alipayNotifyUrl != null ? { alipay_notify_url: String(data.alipayNotifyUrl) } : {}),
        ...displayData,
      }
      if (Object.keys(combined).length) {
        const cols = Object.keys(combined).join(', ')
        const placeholders = Object.keys(combined).map(() => '?').join(', ')
        const values = Object.values(combined)
        await prisma.$executeRawUnsafe(`INSERT INTO site_settings (${cols}) VALUES (${placeholders})`, ...values)
      } else {
        await prisma.$executeRawUnsafe(`INSERT INTO site_settings () VALUES ()`)
      }
    }
    await invalidateSiteSettingsCache()
    // 统一返回最新数据
    const latestRows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM site_settings LIMIT 1')
    const latest = latestRows?.[0] || null
    return NextResponse.json({ success: true, data: latest })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '保存失败' }, { status: 500 })
  }
}