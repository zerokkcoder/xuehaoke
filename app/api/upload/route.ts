import { NextResponse } from 'next/server'
import { writeFile, mkdir, stat, unlink } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, message: '缺少文件字段 file' }, { status: 400 })
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, message: '仅支持 png/jpg/webp 图片' }, { status: 400 })
    }
    if ((file as any).size && (file as any).size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: '图片大小不能超过 2MB' }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await stat(uploadsDir)
    } catch {
      await mkdir(uploadsDir, { recursive: true })
    }
    const ext = path.extname(file.name) || '.png'
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`
    const filepath = path.join(uploadsDir, filename)
    await writeFile(filepath, buffer)
    const url = `/uploads/${filename}`
    return NextResponse.json({ success: true, url })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '上传失败' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    // 支持 query 参数或 JSON body 传入 url
    const urlObj = new URL(req.url)
    let url = urlObj.searchParams.get('url') || ''
    if (!url) {
      try {
        const { url: bodyUrl } = await req.json()
        url = bodyUrl || ''
      } catch {}
    }
    if (!url || !url.startsWith('/uploads/')) {
      return NextResponse.json({ success: false, message: '无效的文件地址' }, { status: 400 })
    }
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const target = path.join(uploadsDir, path.basename(url))
    try {
      await unlink(target)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        // 文件不存在，视为删除成功（幂等处理）
        return NextResponse.json({ success: true })
      }
      throw err
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '删除失败' }, { status: 500 })
  }
}