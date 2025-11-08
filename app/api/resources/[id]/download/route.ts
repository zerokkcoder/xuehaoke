import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)
    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json({ success: false, message: '无效的资源ID' }, { status: 400 })
    }
    const r = await prisma.resource.findUnique({ where: { id: idNum }, select: { viewCount: true, downloadCount: true } })
    if (!r) return NextResponse.json({ success: false, message: '资源不存在' }, { status: 404 })
    const nextDownload = (r.downloadCount || 0) + 1
    const nextHot = (r.viewCount || 0) + nextDownload * 3
    await prisma.resource.update({ where: { id: idNum }, data: { downloadCount: nextDownload, hotScore: nextHot } })
    return NextResponse.json({ success: true, data: { downloadCount: nextDownload, hotScore: nextHot } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '更新下载量失败' }, { status: 500 })
  }
}