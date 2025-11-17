import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const hdrs = (req as any).headers
  const proto = hdrs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || new URL((req as any).url).host
  const origin = String(hdrs.get('origin') || '')
  const expected = `${proto}://${host}`
  if (origin && !origin.toLowerCase().startsWith(expected.toLowerCase())) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }
  const isHttps = String(proto).toLowerCase() === 'https'
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_token', '', { httpOnly: true, secure: isHttps, sameSite: 'lax', path: '/', maxAge: 0 })
  res.headers.set('Cache-Control', 'no-store')
  return res
}