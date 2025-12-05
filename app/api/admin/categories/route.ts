import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import pinyin from 'tiny-pinyin'

// 使用 Prisma 管理分类

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
  const rows = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    select: { id: true, name: true, slug: true, sort: true, createdAt: true },
  })
  return NextResponse.json({ success: true, data: rows })
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
  return latin || 'category'
}

export async function POST(req: Request) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  const { name, sort } = await req.json()
  if (!name || String(name).trim() === '') {
    return NextResponse.json({ success: false, message: '名称不能为空' }, { status: 400 })
  }
  try {
    const sortNum = Number.isFinite(Number(sort)) ? Number(sort) : 0
    const finalSlug = makeLatinSlug(String(name))
    const dup = await prisma.category.findFirst({ where: { slug: finalSlug } })
    if (dup) return NextResponse.json({ success: false, message: 'Slug 已存在' }, { status: 400 })
    const created = await prisma.category.create({ data: { name: String(name).trim(), slug: finalSlug, sort: sortNum } })
    return NextResponse.json({ success: true, data: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '创建失败' }, { status: 500 })
  }
}
