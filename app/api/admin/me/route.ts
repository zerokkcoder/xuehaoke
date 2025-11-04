import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(req: Request) {
  const token = (req as any).cookies?.get?.('admin_token')?.value
  // For Next 16 Request doesn't expose cookies; use headers
  const cookieHeader = (req as any).headers.get('cookie') || ''
  const match = cookieHeader.match(/admin_token=([^;]+)/)
  const tok = token || (match ? match[1] : '')
  if (!tok) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  try {
    const secret = process.env.ADMIN_JWT_SECRET || 'dev_secret_change_me'
    const payload = jwt.verify(tok, secret) as any
    return NextResponse.json({ authenticated: true, user: { id: payload.uid, username: payload.username, role: payload.role } })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}