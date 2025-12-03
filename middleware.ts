import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const nonce = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '')
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const csp = [
    "default-src 'self'",
    "img-src 'self' https: data:",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
