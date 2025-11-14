import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = String(body?.message || '')
    const stack = String(body?.stack || '')
    const source = String(body?.source || '')
    const path = String(body?.path || '')
    const ua = String(body?.ua || '')
    const time = Number(body?.time || Date.now())
    console.warn('[admin_error]', { message, stack, source, path, ua, time })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}