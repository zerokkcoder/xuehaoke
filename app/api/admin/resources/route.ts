import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import pinyin from 'tiny-pinyin'
import jwt from 'jsonwebtoken'

function verifyAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(/admin_token=([^;]+)/)
  const token = match ? match[1] : ''
  if (!token) return null
  try {
    const secret = process.env.ADMIN_JWT_SECRET || 'dev_secret_change_me'
    return jwt.verify(token, secret) as any
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const size = Math.max(1, Math.min(100, Number(url.searchParams.get('size')) || 10))
  const skip = (page - 1) * size
  const q = String(url.searchParams.get('q') || '').trim()
  const where = q ? {
    OR: [
      { title: { contains: q } },
      { content: { contains: q } },
      { downloads: { some: { url: { contains: q } } } },
      { tags: { some: { tag: { name: { contains: q } } } } },
    ],
  } : undefined
  const [total, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
        downloads: true,
      },
      skip,
      take: size,
    }),
  ])
  const data = resources.map((r: any) => ({
    id: r.id,
    cover: r.cover,
    title: r.title,
    content: r.content,
    price: r.price,
    downloadCount: r.downloadCount,
    viewCount: r.viewCount,
    hotScore: r.hotScore,
    category: r.category,
    subcategory: r.subcategory,
    tags: r.tags.map((t: any) => ({ id: t.tagId, name: t.tag.name })),
    downloads: r.downloads.map((d: any) => ({ id: d.id, url: d.url, code: d.code })),
  }))
  return NextResponse.json({ success: true, data, pagination: { page, size, total } })
}

export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const {
    cover, title, content,
    downloadCount = 0, viewCount = 0, hotScore = 0,
    categoryId, subcategoryId,
    tags = [],
    download,
    price,
  } = body
  if (!title || !content || !categoryId) {
    return NextResponse.json({ success: false, message: '缺少必填字段' }, { status: 400 })
  }
  try {
    // ensure tags exist
    const tagIds: number[] = []
    function makeLatinSlug(input: string) {
      const raw = String(input).trim()
      const hasHan = /[\u4e00-\u9fa5]/.test(raw)
      let latin = raw
      try {
        latin = hasHan ? pinyin.convertToPinyin(raw, '-', true) : raw
      } catch {
        latin = raw
      }
      latin = latin.toLowerCase()
      latin = latin.replace(/\s+/g, '-')
      latin = latin.replace(/[^a-z0-9\-]/g, '')
      latin = latin.replace(/-+/g, '-').replace(/^-+|-+$/g, '')
      return latin || 'tag'
    }
    for (const name of (tags as string[])) {
      const nm = String(name).trim()
      if (!nm) continue
      const existing = await prisma.tag.findUnique({ where: { name: nm } })
      if (existing) {
        const currentSlug = String(existing.slug || '').trim()
        const bad = currentSlug === '' || /[^a-z0-9\-]/i.test(currentSlug) || /^\d+$/.test(currentSlug)
        if (bad) {
          let s = makeLatinSlug(nm)
          const dup = await prisma.tag.findFirst({ where: { slug: s, NOT: { id: existing.id } } })
          if (dup) s = `${s}-${existing.id}`
          await prisma.tag.update({ where: { id: existing.id }, data: { slug: s } })
        }
        tagIds.push(existing.id)
      }
      else {
        const created = await prisma.tag.create({ data: { name: nm, slug: makeLatinSlug(nm) } })
        tagIds.push(created.id)
      }
    }
    const created = await prisma.resource.create({
      data: {
        cover: cover ?? null,
        title: String(title),
        content: String(content),
        price: Number.isFinite(Number(price)) ? Number(price) : 0,
        downloadCount: Number(downloadCount) || 0,
        viewCount: Number(viewCount) || 0,
        hotScore: Number(hotScore) || 0,
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
        tags: { create: tagIds.map(id => ({ tagId: id })) },
        downloads: download && download.url ? { create: { url: String(download.url), code: download.code ? String(download.code) : null } } : undefined,
      },
      include: { category: true, subcategory: true, tags: { include: { tag: true } }, downloads: true },
    })
    return NextResponse.json({ success: true, data: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '创建失败' }, { status: 500 })
  }
}
