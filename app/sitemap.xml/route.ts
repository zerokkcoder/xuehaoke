import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | string | null | undefined): string {
  const date = d ? new Date(d) : null
  return date ? date.toISOString() : new Date().toISOString()
}

export async function GET(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host
  const base = `${proto}://${host}`

  const [cats, tags, resources] = await Promise.all([
    prisma.category.findMany({ select: { id: true, createdAt: true } }),
    prisma.tag.findMany({ select: { id: true, createdAt: true } }),
    prisma.resource.findMany({ select: { id: true, updatedAt: true } }),
  ])

  const entries: string[] = []
  entries.push(
    `<url>`+
      `<loc>${base}/</loc>`+
      `<changefreq>daily</changefreq>`+
      `<priority>1.0</priority>`+
      `<lastmod>${fmtDate(new Date())}</lastmod>`+
    `</url>`
  )

  for (const c of cats) {
    entries.push(
      `<url>`+
        `<loc>${base}/category/${c.id}</loc>`+
        `<changefreq>weekly</changefreq>`+
        `<priority>0.6</priority>`+
        `<lastmod>${fmtDate(c.createdAt)}</lastmod>`+
      `</url>`
    )
  }

  for (const t of tags) {
    entries.push(
      `<url>`+
        `<loc>${base}/tag/${t.id}</loc>`+
        `<changefreq>weekly</changefreq>`+
        `<priority>0.5</priority>`+
        `<lastmod>${fmtDate(t.createdAt)}</lastmod>`+
      `</url>`
    )
  }

  for (const r of resources) {
    entries.push(
      `<url>`+
        `<loc>${base}/resource/${r.id}</loc>`+
        `<changefreq>daily</changefreq>`+
        `<priority>0.8</priority>`+
        `<lastmod>${fmtDate(r.updatedAt)}</lastmod>`+
      `</url>`
    )
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
    `${entries.join('\n')}\n`+
    `</urlset>`

  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
