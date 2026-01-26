import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const resourceId = Number(body?.resourceId || 0)
    const username = String(body?.username || '').trim()
    if (!resourceId || !username) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ success: true, data: { hasAccess: false, isVip: false } })
    }
    const now = new Date()
    const effectiveVip = !!user.isVip && (!!user.vipExpireAt ? (new Date(user.vipExpireAt) > now) : true)
    const access = await prisma.userResourceAccess.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId } }
    })
    
    // 如果有权限，获取下载链接
    let downloadInfo = {}
    if (effectiveVip || !!access) {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: { downloads: true }
      })
      const download = resource?.downloads?.[0]
      if (download) {
        downloadInfo = {
          downloadUrl: download.url,
          downloadCode: download.code
        }
      }
    }

    return NextResponse.json({ success: true, data: { hasAccess: effectiveVip || !!access, isVip: effectiveVip, ...downloadInfo } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '查询失败' }, { status: 500 })
  }
}