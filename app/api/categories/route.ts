import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
      include: {
        subcategories: {
          orderBy: [{ sort: 'asc' }, { id: 'asc' }],
          select: { id: true, name: true, slug: true, sort: true },
        },
      },
    })
    const data = rows.map((c) => ({ id: c.id, name: c.name, slug: (c as any).slug || null, sort: c.sort, subcategories: c.subcategories }))
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err: any) {
    return NextResponse.json({ success: true, data: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
