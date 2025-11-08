import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const s = await prisma.siteSetting.findFirst()
    if (!s) return NextResponse.json({ success: true, data: null })
    const data = {
      siteName: s.siteName || null,
      siteLogo: s.siteLogo || null,
      siteSlogan: s.siteSlogan || null,
      siteKeywords: s.siteKeywords || null,
      siteDescription: s.siteDescription || null,
      heroImage: s.heroImage || null,
      footerText: s.footerText || null,
    }
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取站点设置失败' }, { status: 500 })
  }
}