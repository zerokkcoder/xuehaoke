import { NextResponse } from 'next/server'
import { stat } from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: parts } = await params
    const rel = Array.isArray(parts) ? parts.join('/') : ''
    if (!rel) return NextResponse.json({ success: false, message: 'Not Found' }, { status: 404 })
    const baseDir = path.join(process.cwd(), 'storage', 'uploads')
    const abs = path.join(baseDir, rel)
    const resolvedBase = path.resolve(baseDir)
    const resolvedAbs = path.resolve(abs)
    if (!resolvedAbs.startsWith(resolvedBase)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    const st = await stat(abs)
    const ifNoneMatch = (req as any).headers.get('if-none-match') || ''
    const ifModifiedSince = (req as any).headers.get('if-modified-since') || ''
    const etag = `"${st.size}-${st.mtimeMs}"`
    const lastModified = new Date(st.mtime).toUTCString()
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers: { 'ETag': etag, 'Last-Modified': lastModified, 'Cache-Control': 'public, max-age=31536000, immutable' } })
    }
    if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= new Date(st.mtime).getTime()) {
      return new NextResponse(null, { status: 304, headers: { 'ETag': etag, 'Last-Modified': lastModified, 'Cache-Control': 'public, max-age=31536000, immutable' } })
    }
    const ext = path.extname(abs).toLowerCase()
    let ct = 'application/octet-stream'
    if (ext === '.png') ct = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') ct = 'image/jpeg'
    else if (ext === '.webp') ct = 'image/webp'
    const fileStream = createReadStream(abs)
    const signal = (req as any).signal
    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', () => {
        try { fileStream.destroy() } catch {}
      })
    }
    const rs = new ReadableStream<Uint8Array>({
      start(controller) {
        fileStream.on('data', (chunk: Buffer | string) => {
          if (typeof chunk === 'string') {
            const te = new TextEncoder()
            controller.enqueue(te.encode(chunk))
          } else {
            controller.enqueue(new Uint8Array(chunk))
          }
        })
        fileStream.on('end', () => controller.close())
        fileStream.on('error', (err) => controller.error(err))
      }
    })
    return new NextResponse(rs, { headers: { 'Content-Type': ct, 'ETag': etag, 'Last-Modified': lastModified, 'Cache-Control': 'public, max-age=31536000, immutable' } })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Not Found' }, { status: 404 })
  }
}
