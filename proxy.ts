export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

import { NextResponse } from 'next/server'

export default async function proxy(req: Request) {
  const nonce = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '')

  const reqHeaders = new Headers(req.headers)
  reqHeaders.set('x-nonce', nonce)
  const csp = [
    "default-src 'self'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https: data:",
    `script-src 'self' 'nonce-${nonce}' https:`,
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

  // Provide CSP in request so Next can extract nonce during SSR
  reqHeaders.set('Content-Security-Policy', csp)
  const res = NextResponse.next({ request: { headers: reqHeaders } })

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  return res
}
