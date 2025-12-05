export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

export default async function proxy(req: Request) {
  const nonce = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '')

  const reqHeaders = new Headers(req.headers)
  reqHeaders.set('x-nonce', nonce)
  const nextReq = new Request(req, { headers: reqHeaders })

  const upstreamRes = await fetch(nextReq)
  const resHeaders = new Headers(upstreamRes.headers)

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

  resHeaders.set('Content-Security-Policy', csp)

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders,
  })
}
