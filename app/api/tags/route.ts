import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: [{ id: 'asc' }],
      select: { id: true, name: true, slug: true },
    })

    // normalize slugs: ensure non-empty, non-numeric-only, unique
    const isBadSlug = (s: any) => {
      const v = (s == null ? '' : String(s)).trim()
      return v === '' || /^\d+$/.test(v)
    }
    const makeSlug = (input: string) => {
      const base = String(input).trim().toLowerCase()
      const s = base
        .replace(/\s+/g, '-')
        .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
      return s || base || 'tag'
    }

    const existing = new Set<string>(
      (tags as any[])
        .map((t: any) => String(t.slug || '').trim())
        .filter((v: any) => v && !/^\d+$/.test(v))
    )

    const updates: Promise<any>[] = []
    for (const t of (tags as any[])) {
      const current = (t.slug == null ? '' : String(t.slug)).trim()
      if (isBadSlug(current)) {
        let candidate = makeSlug(t.name)
        // avoid purely numeric after transform
        if (/^\d+$/.test(candidate)) candidate = `tag-${candidate}`
        // ensure unique
        if (existing.has(candidate)) candidate = `${candidate}-${t.id}`
        existing.add(candidate)
        updates.push((prisma.tag.update({ where: { id: t.id }, data: { slug: candidate } })) as any)
      }
    }
    if (updates.length) {
      try { await Promise.all(updates) } catch {}
    }

    const finalList = updates.length
      ? await prisma.tag.findMany({ orderBy: [{ id: 'asc' }], select: { id: true, name: true, slug: true } })
      : tags

    return NextResponse.json({ success: true, data: finalList })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '获取标签失败', data: [] }, { status: 500 })
  }
}
