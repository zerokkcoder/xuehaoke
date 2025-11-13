import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const size = Math.max(1, Math.min(100, Number(url.searchParams.get('size')) || 50))
  const skip = (page - 1) * size
  const q = (url.searchParams.get('q') || '').trim()
  try {
    const where = q
      ? { OR: [{ title: { contains: q } }, { url: { contains: q } }] }
      : undefined
    const [total, items] = await Promise.all([
      (prisma as any).favorite.count({ where }),
      (prisma as any).favorite.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: size,
        select: { id: true, title: true, url: true, enabled: true },
      }),
    ])
    const data = (items as Array<{ id: number; title: string; url: string; enabled: boolean }>).map((it) => ({ id: it.id, title: it.title, url: it.url, enabled: !!it.enabled }))
    return NextResponse.json({ success: true, data, pagination: { page, size, total } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    try {
      let totalRows: any[]
      let total: number
      if (q) {
        totalRows = await prisma.$queryRawUnsafe('SELECT COUNT(1) AS c FROM favorites WHERE (title LIKE ? OR url LIKE ?)', `%${q}%`, `%${q}%`)
        total = Number(totalRows?.[0]?.c || 0)
      } else {
        totalRows = await prisma.$queryRawUnsafe('SELECT COUNT(1) AS c FROM favorites')
        total = Number(totalRows?.[0]?.c || 0)
      }
      let rows: any[]
      if (q) {
        rows = await prisma.$queryRawUnsafe('SELECT id, title, url, enabled FROM favorites WHERE (title LIKE ? OR url LIKE ?) ORDER BY id DESC LIMIT ? OFFSET ?', `%${q}%`, `%${q}%`, size, skip)
      } else {
        rows = await prisma.$queryRawUnsafe('SELECT id, title, url, enabled FROM favorites ORDER BY id DESC LIMIT ? OFFSET ?', size, skip)
      }
      const data = rows.map(r => ({ id: Number(r.id), title: String(r.title), url: String(r.url), enabled: Number(r.enabled) === 1 }))
      return NextResponse.json({ success: true, data, pagination: { page, size, total } }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return NextResponse.json({ success: true, data: [], pagination: { page, size, total: 0 } }, { headers: { 'Cache-Control': 'no-store' } })
    }
  }
}