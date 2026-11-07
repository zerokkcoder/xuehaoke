import jwt from 'jsonwebtoken'

/**
 * 从站点登录 Cookie（site_token）解析当前用户 ID。
 * 所有前台用户态接口的鉴权都必须以此为准，绝不信任请求体中的 username。
 * 未登录或令牌无效时返回 null。
 */
export function getSiteUserId(req: Request): number | null {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/site_token=([^;]+)/)
    const token = match ? match[1] : ''
    if (!token) return null
    const secret = process.env.SITE_JWT_SECRET || 'site_dev_secret_change_me'
    const payload = jwt.verify(token, secret) as any
    return Number(payload?.uid) || null
  } catch {
    return null
  }
}
