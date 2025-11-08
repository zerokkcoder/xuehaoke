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
  const setting = await prisma.siteSetting.findFirst()
  return NextResponse.json({ success: true, data: setting || null })
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

  try {
    const existing = await prisma.siteSetting.findFirst()
    // 仅当尝试更新/设置 Alipay 关键字段时才强制要求公钥；若已有公钥并未改动，可允许保存站点展示配置
    const incomingPub = (data.alipayPublicKey ?? '').trim()
    const effectivePub = incomingPub || (existing?.alipayPublicKey || '').trim()
    const incomingAlipayKeyChange = (
      data.alipayAppId != null ||
      data.alipayPrivateKey != null
    )
    if (!effectivePub && incomingAlipayKeyChange) {
      return NextResponse.json({ success: false, message: '请填写支付宝公钥' }, { status: 400 })
    }
    let saved
    if (existing) {
      // First update known fields via Prisma Client
      saved = await prisma.siteSetting.update({ where: { id: existing.id }, data })
      // Then update display fields via raw SQL to avoid Prisma Client schema lag
      if (Object.keys(displayData).length) {
        const sets = Object.keys(displayData).map(k => `${k} = ?`).join(', ')
        const values = Object.values(displayData)
        await prisma.$executeRawUnsafe(`UPDATE site_settings SET ${sets} WHERE id = ?`, ...values, existing.id)
      }
    } else {
      // Create row with known fields
      const created = await prisma.siteSetting.create({ data })
      saved = created
      // Set display fields afterwards
      if (Object.keys(displayData).length) {
        const cols = Object.keys(displayData).join(', ')
        const placeholders = Object.keys(displayData).map(() => '?').join(', ')
        const values = Object.values(displayData)
        await prisma.$executeRawUnsafe(`UPDATE site_settings SET ${cols.split(', ').map(c => `${c} = ?`).join(', ')} WHERE id = ?`, ...values, created.id)
      }
    }
    // 统一返回最新数据
    const latest = await prisma.siteSetting.findFirst()
    return NextResponse.json({ success: true, data: latest })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '保存失败' }, { status: 500 })
  }
}