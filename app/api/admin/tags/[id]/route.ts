import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import pinyin from 'tiny-pinyin'

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, message: '无效的标签ID' }, { status: 400 })
  }
  const { name, slug } = await req.json()
  if (!name || String(name).trim() === '') {
    return NextResponse.json({ success: false, message: '名称不能为空' }, { status: 400 })
  }
  try {
    const data: any = { name: String(name).trim() }
    if (slug != null) {
      const finalSlug = String(slug).trim() ? makeLatinSlug(String(slug)) : makeLatinSlug(String(name))
      const dup = await prisma.tag.findFirst({ where: { slug: finalSlug, NOT: { id: idNum } } })
      if (dup) return NextResponse.json({ success: false, message: 'Slug 已存在' }, { status: 400 })
      data.slug = finalSlug
    }
    const updated = await prisma.tag.update({ where: { id: idNum }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    // 唯一约束冲突等
    return NextResponse.json({ success: false, message: err?.message || '更新失败' }, { status: 500 })
  }
}
