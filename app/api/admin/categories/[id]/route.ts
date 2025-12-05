import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

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

function makeSlug(input: string) {
  const base = String(input).trim().toLowerCase()
  const s = base.replace(/\s+/g, '-').replace(/[^\w\-\u4e00-\u9fa5]/g, '')
  return s || base
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { name, sort, slug } = await req.json()
  if (!name || String(name).trim() === '') {
    return NextResponse.json({ success: false, message: '名称不能为空' }, { status: 400 })
  }
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, message: '无效的分类ID' }, { status: 400 })
  }
  try {
    const data: any = { name: String(name).trim() }
    if (Number.isFinite(Number(sort))) data.sort = Number(sort)
    if (slug != null) {
      const finalSlug = String(slug).trim() ? makeSlug(String(slug)) : makeSlug(String(name))
      const dup = await prisma.category.findFirst({ where: { slug: finalSlug, NOT: { id: idNum } } })
      if (dup) return NextResponse.json({ success: false, message: 'Slug 已存在' }, { status: 400 })
      data.slug = finalSlug
    }
    const updated = await prisma.category.update({ where: { id: idNum }, data })
    return NextResponse.json({ success: true, data: updated })
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
    return NextResponse.json({ success: false, message: '无效的分类ID' }, { status: 400 })
  }
  try {
    // 禁止删除：若有资源使用该分类或其任一子分类
    const usageCount = await prisma.resource.count({
      where: {
        OR: [
          { categoryId: idNum },
          { subcategory: { categoryId: idNum } },
        ],
      },
    })
    if (usageCount > 0) {
      return NextResponse.json({ success: false, message: '该分类或其子分类存在关联资源，禁止删除' }, { status: 400 })
    }
    // 若仍有子分类存在，提前阻止，避免外键约束错误
    const subCount = await prisma.subcategory.count({ where: { categoryId: idNum } })
    if (subCount > 0) {
      return NextResponse.json({ success: false, message: '该分类下仍有子分类，禁止删除。请先删除子分类。' }, { status: 400 })
    }
    await prisma.category.delete({ where: { id: idNum } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '删除失败' }, { status: 500 })
  }
}
