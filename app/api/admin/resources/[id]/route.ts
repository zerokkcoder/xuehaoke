import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import pinyin from 'tiny-pinyin'
import jwt from 'jsonwebtoken'
import { invalidateResourceCache } from '@/lib/cache'

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, message: '无效的资源ID' }, { status: 400 })
  }
  const body = await req.json()
  const {
    cover, title, content,
    downloadCount, viewCount, hotScore,
    categoryId, subcategoryId,
    tags,
    download,
    price,
  } = body
  try {
    const current = await prisma.resource.findUnique({ where: { id: idNum }, select: { categoryId: true } })
    const nextCategoryId = categoryId !== undefined ? Number(categoryId) : (current?.categoryId ?? undefined)

    let nextSubcategoryId: number | null | undefined = undefined
    if (subcategoryId === null) {
      nextSubcategoryId = null
    } else if (subcategoryId !== undefined) {
      const subIdNum = Number(subcategoryId)
      if (!Number.isFinite(subIdNum) || subIdNum <= 0) {
        nextSubcategoryId = null
      } else {
        const sub = await prisma.subcategory.findUnique({ where: { id: subIdNum }, select: { id: true, categoryId: true } })
        nextSubcategoryId = (sub && nextCategoryId && sub.categoryId === Number(nextCategoryId)) ? subIdNum : null
      }
    } else if (categoryId !== undefined) {
      nextSubcategoryId = null
    }
    // tags
    let tagIds: number[] | undefined
    if (Array.isArray(tags)) {
      tagIds = []
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
    }
    // update resource
    const updated = await prisma.resource.update({
      where: { id: idNum },
      data: {
        cover: cover ?? undefined,
        title: title !== undefined ? String(title) : undefined,
        content: content !== undefined ? String(content) : undefined,
        price: price !== undefined && Number.isFinite(Number(price)) ? Number(price) : undefined,
        downloadCount: downloadCount !== undefined ? Number(downloadCount) : undefined,
        viewCount: viewCount !== undefined ? Number(viewCount) : undefined,
        hotScore: hotScore !== undefined ? Number(hotScore) : undefined,
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
        subcategoryId: nextSubcategoryId,
        // set tags via upsert by replacing join table
        ...(tagIds ? { tags: { deleteMany: {}, create: tagIds.map(id => ({ tagId: id })) } } : {}),
        // downloads: maintain single record; update or create
      },
      include: { category: true, subcategory: true, tags: { include: { tag: true } }, downloads: true },
    })

    if (download && (download.url || download.code !== undefined)) {
      const existingDl = await prisma.resourceDownload.findFirst({ where: { resourceId: idNum } })
      if (existingDl) {
        await prisma.resourceDownload.update({ where: { id: existingDl.id }, data: { url: download.url ?? existingDl.url, code: download.code ?? existingDl.code ?? null } })
      } else if (download.url) {
        await prisma.resourceDownload.create({ data: { resourceId: idNum, url: String(download.url), code: download.code ? String(download.code) : null } })
      }
    }

    const final = await prisma.resource.findUnique({ where: { id: idNum }, include: { category: true, subcategory: true, tags: { include: { tag: true } }, downloads: true } })
    await invalidateResourceCache()
    return NextResponse.json({ success: true, data: final })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '更新失败' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, message: '无效的资源ID' }, { status: 400 })
  }
  try {
    await prisma.resourceTag.deleteMany({ where: { resourceId: idNum } })
    await prisma.resourceDownload.deleteMany({ where: { resourceId: idNum } })
    await prisma.resource.delete({ where: { id: idNum } })
    await invalidateResourceCache()
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '删除失败' }, { status: 500 })
  }
}
