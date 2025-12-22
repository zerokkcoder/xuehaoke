import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const envBaseRaw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || ''
  const isLocalHost = (h: string) => /^(localhost|127\\.0\\.0\\.1)(:|$)/i.test(h)
  let origin = ''
  if (envBaseRaw) {
    try {
      const u = new URL(envBaseRaw)
      if (!isLocalHost(u.host)) {
        origin = `${u.protocol}//${u.host}`
      }
    } catch {}
  }
  if (!origin) {
    const rawProto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim()
    const rawHost = (req.headers.get('x-forwarded-host') || '').split(',')[0].trim()
    let proto = rawProto || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    let host = rawHost || req.headers.get('host') || new URL(req.url).host
    if (typeof host === 'string' && /^(localhost|127\\.0\\.0\\.1)/i.test(host)) {
      const vercel = process.env.VERCEL_URL || ''
      if (vercel) {
        try {
          const u = new URL(`https://${vercel}`)
          host = u.host
          proto = u.protocol.replace(':', '')
        } catch {}
      }
    }
    // Force HTTPS in production if not localhost
    if (process.env.NODE_ENV === 'production' && typeof host === 'string' && !isLocalHost(host) && proto === 'http') {
      proto = 'https'
    }
    if (typeof host === 'string' && host.endsWith(':443') && proto !== 'https') proto = 'https'
    origin = `${proto}://${host}`
  }
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: ${origin}/sitemap.xml`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'max-age=300, s-maxage=300' } })
}
