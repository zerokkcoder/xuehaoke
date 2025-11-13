import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  const origin = `${proto}://${host}`
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: ${origin}/sitemap.xml`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}