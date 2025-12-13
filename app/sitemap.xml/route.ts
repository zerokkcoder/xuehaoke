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

  const [cats, tags] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, createdAt: true } }),
    prisma.tag.findMany({ select: { slug: true, createdAt: true } }),
  ])

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(`<?xml version="1.0" encoding="UTF-8"?>\n`))
      controller.enqueue(encoder.encode(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`))
      controller.enqueue(encoder.encode(`<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${fmtDate(new Date())}</lastmod></url>\n`))

      for (const c of cats) {
        controller.enqueue(encoder.encode(`<url><loc>${base}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority><lastmod>${fmtDate(c.createdAt)}</lastmod></url>\n`))
      }

      for (const t of tags) {
        controller.enqueue(encoder.encode(`<url><loc>${base}/tag/${t.slug}</loc><changefreq>weekly</changefreq><priority>0.5</priority><lastmod>${fmtDate(t.createdAt)}</lastmod></url>\n`))
      }

      const pageSize = 1000
      let lastId = 0
      while (true) {
        const batch = await prisma.resource.findMany({
          select: { id: true, updatedAt: true },
          orderBy: { id: 'asc' },
          where: lastId ? { id: { gt: lastId } } : undefined,
          take: pageSize,
        })
        if (!batch.length) break
        for (const r of batch) {
          controller.enqueue(encoder.encode(`<url><loc>${base}/resource/${r.id}</loc><changefreq>daily</changefreq><priority>0.8</priority><lastmod>${fmtDate(r.updatedAt)}</lastmod></url>\n`))
        }
        lastId = batch[batch.length - 1].id
      }

      controller.enqueue(encoder.encode(`</urlset>`))
      controller.close()
    }
  })

  return new NextResponse(stream, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'max-age=300, s-maxage=300' } })
}
