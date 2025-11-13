import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  const base = `${proto}://${host}`
  const urls: string[] = []
  urls.push(`${base}/`)
  const [cats, tags, resources] = await Promise.all([
    prisma.category.findMany({ select: { id: true } }),
    prisma.tag.findMany({ select: { id: true } }),
    prisma.resource.findMany({ select: { id: true } }),
  ])
  for (const c of cats) urls.push(`${base}/category/${c.id}`)
  for (const t of tags) urls.push(`${base}/tag/${t.id}`)
  for (const r of resources) urls.push(`${base}/resource/${r.id}`)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>`
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}