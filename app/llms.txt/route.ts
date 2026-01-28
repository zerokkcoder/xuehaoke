import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(req: Request) {
  // 1. Determine Base URL (Reuse logic from sitemap)
  const envBaseRaw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''
  const isLocalHost = (h: string) => /^(localhost|127\.0\.0\.1)(:|$)/i.test(h)
  let base = ''
  
  if (envBaseRaw) {
    try {
      const u = new URL(envBaseRaw)
      if (!isLocalHost(u.host)) {
        base = `${u.protocol}//${u.host}`
      }
    } catch {}
  }

  if (!base) {
    const rawProto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim()
    const rawHost = (req.headers.get('x-forwarded-host') || '').split(',')[0].trim()
    let proto = rawProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    let host = rawHost || req.headers.get('host') || new URL(req.url).host
    
    // Vercel / Production fix
    if (typeof host === 'string' && /^(localhost|127\.0\.0\.1)/i.test(host)) {
      const vercel = process.env.VERCEL_URL || ''
      if (vercel) {
        try {
          const u = new URL(`https://${vercel}`)
          host = u.host
          proto = u.protocol.replace(':', '')
        } catch {}
      }
    }
    
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production' && typeof host === 'string' && !isLocalHost(host) && proto === 'http') {
      proto = 'https'
    }
    if (typeof host === 'string' && host.endsWith(':443') && proto !== 'https') proto = 'https'
    
    base = `${proto}://${host}`
  }

  // Final HTTPS enforcement for production
  if (process.env.NODE_ENV === 'production' && !isLocalHost(base.split('://')[1] || '') && base.startsWith('http://')) {
    base = base.replace('http://', 'https://')
  }

  // 2. Fetch Data
  const [siteSettingsRaw, cats, tags, latestResources] = await Promise.all([
    prisma.$queryRawUnsafe('SELECT site_name, site_description FROM site_settings LIMIT 1'),
    prisma.category.findMany({ 
      select: { name: true, slug: true, subcategories: { select: { name: true, slug: true } } },
      orderBy: { id: 'asc' }
    }),
    prisma.tag.findMany({ 
      select: { name: true, slug: true },
      take: 50,
      orderBy: { resources: { _count: 'desc' } } // Top 50 popular tags
    }),
    prisma.resource.findMany({
      select: { id: true, title: true, content: true, updatedAt: true },
      orderBy: { id: 'desc' },
      take: 50 // Latest 50 resources
    })
  ])

  const siteSettings = (siteSettingsRaw as any[])?.[0] || {}
  const siteName = siteSettings.site_name || '学好课'
  const siteDesc = siteSettings.site_description || '提供高质量的学习资料、开发工具、设计素材等资源下载服务。'

  // 3. Generate Markdown
  let md = `# ${siteName}\n\n`
  md += `> ${siteDesc}\n\n`

  md += `## 核心分类 (Categories)\n\n`
  for (const c of cats) {
    const cUrl = `${base}/category/${c.slug || ''}`
    md += `- [${c.name}](${cUrl})\n`
    if (c.subcategories.length > 0) {
      for (const s of c.subcategories) {
        const sUrl = `${base}/category/${c.slug || ''}/${s.slug || ''}`
        md += `  - [${s.name}](${sUrl})\n`
      }
    }
  }
  md += `\n`

  md += `## 热门标签 (Popular Tags)\n\n`
  const tagLinks = tags.map(t => `[${t.name}](${base}/tag/${t.slug})`).join(' · ')
  md += `${tagLinks}\n\n`

  md += `## 最新资源 (Latest Resources)\n\n`
  for (const r of latestResources) {
    const rUrl = `${base}/resource/${r.id}`
    const summary = (r.content || '').replace(/\s+/g, ' ').slice(0, 100).replace(/[#*`\[\]]/g, '')
    md += `- [${r.title}](${rUrl}): ${summary}...\n`
  }

  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
