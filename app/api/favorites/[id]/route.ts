import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idNum = Number.parseInt(id, 10)
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, message: '无效的收藏ID' }, { status: 400 })
  }
  try {
    await (prisma as any).favorite.update({ where: { id: idNum }, data: { enabled: false } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    try {
      await prisma.$executeRawUnsafe(`UPDATE favorites SET enabled=0 WHERE id=${idNum}`)
      return NextResponse.json({ success: true })
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e?.message || '更新失败' }, { status: 500 })
    }
  }
}