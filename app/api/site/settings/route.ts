import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 强制此接口动态执行，返回不缓存，保证前端拿到最新设置
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 使用原生查询，避免 Prisma Client 未生成新字段导致读取不到的情况
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT site_name, site_logo, site_slogan, site_keywords, site_description, hero_image, footer_text, site_subtitle FROM site_settings LIMIT 1')
    const r = rows?.[0]
    if (!r) return NextResponse.json({ success: true, data: null }, { headers: { 'Cache-Control': 'no-store' } })
    const data = {
      siteName: r.site_name ?? null,
      siteLogo: r.site_logo ?? null,
      siteSlogan: r.site_slogan ?? null,
      siteKeywords: r.site_keywords ?? null,
      siteDescription: r.site_description ?? null,
      heroImage: r.hero_image ?? null,
      footerText: r.footer_text ?? null,
      siteSubtitle: r.site_subtitle ?? null,
    }
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ success: true, data: null }, { headers: { 'Cache-Control': 'no-store' } })
  }
}