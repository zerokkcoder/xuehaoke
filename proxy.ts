import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads).*)'],
}

export default async function middleware(req: NextRequest) {
  // 1. 强制 HTTPS 和 www 重定向 (仅生产环境)
  if (process.env.NODE_ENV === 'production') {
    const url = req.nextUrl.clone()
    const hostHeader = req.headers.get('host') || ''
    const hostname = hostHeader.split(':')[0] // 去除端口号
    const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '')
    
    // 检查是否需要重定向：非 www 或非 HTTPS
    const isWww = hostname.startsWith('www.')
    const isHttps = proto === 'https'
    
    // 如果是 localhost 或 IP 地址，不重定向
    if (hostname && !hostname.includes('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      if (!isWww || !isHttps) {
        const newHost = isWww ? hostname : `www.${hostname}`
        // 使用字符串拼接构建绝对路径，避免 NextURL 对象处理 host 的潜在问题
        const newUrl = `https://${newHost}${url.pathname}${url.search}`
        return NextResponse.redirect(newUrl, 301)
      }
    }
  }

  // 2. CSP 安全头处理
  // 说明：这里不再使用 per-request nonce。nonce 会强制 Next 对每个请求重新渲染 HTML
  // （nonce 必须与 HTML 内联脚本一致，无法缓存），导致全站 Cache-Control: no-store、
  // TTFB 偏高、爬虫抓取效率下降。改用 'unsafe-inline' 后页面可以走 ISR / 全量缓存。
  // AdSense 需要显式放行 googlesyndication 系列域名（script/frame），
  // 这里按 Google 官方 CSP 说明放行具体域名，而不是放开 https: 通配。
  const csp = [
    "default-src 'self'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https: data:",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "https://pagead2.googlesyndication.com",
      "https://partner.googleadservices.com",
      "https://www.googletagservices.com",
      "https://tpc.googlesyndication.com",
      "https://securepubads.g.doubleclick.net",
      "https://adservice.google.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://ep1.adtrafficquality.google",
      "https://ep2.adtrafficquality.google",
    ].join(' '),
    "style-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    [
      "frame-src 'self'",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://ep2.adtrafficquality.google",
    ].join(' '),
    "frame-ancestors 'self'",
    "base-uri 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

  const res = NextResponse.next()

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'no-referrer-when-downgrade')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  
  return res
}
