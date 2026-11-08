/**
 * SEO 共用工具。
 * 站点域名统一走 getSiteUrl()，避免各页面各写一份、出现 www/非 www 或 http/https 不一致。
 */

/** 返回规范化的站点根地址（生产环境强制 https + www），不带结尾斜杠 */
export function getSiteUrl(): string {
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
  const isProd = process.env.NODE_ENV === 'production'
  const isLocal = siteUrl.includes('localhost')
  if (isProd && !isLocal && siteUrl.startsWith('http://')) {
    siteUrl = siteUrl.replace('http://', 'https://')
  }
  if (isProd && !isLocal && !siteUrl.includes('www.')) {
    siteUrl = siteUrl.replace('https://', 'https://www.')
  }
  return siteUrl.replace(/\/$/, '')
}

/** 把站内相对路径拼成绝对地址 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * 生成 meta description：先剥离 Markdown 标记，再按句子/分句边界截断，
 * 避免出现在词或半句话中间被切掉的情况（例如“…支持个性化开发，如”）。
 */
export function buildMetaDescription(raw: string | null | undefined, fallback: string, max = 155): string {
  const text = (raw || '')
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接只保留文字
    .replace(/[#*_>`~]+/g, ' ') // 其余 Markdown 标记
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return fallback
  if (text.length <= max) return text

  const clipped = text.slice(0, max)
  const boundary = Math.max(
    clipped.lastIndexOf('。'),
    clipped.lastIndexOf('！'),
    clipped.lastIndexOf('？'),
    clipped.lastIndexOf('；'),
    clipped.lastIndexOf('，'),
    clipped.lastIndexOf(' ')
  )
  // 边界太靠前就不回退，否则描述会过短
  const head = boundary > max * 0.6 ? clipped.slice(0, boundary) : clipped
  return `${head.replace(/[，、；：,;:\s]+$/, '')}…`
}

/**
 * 站点官方账号链接，用于 Organization 结构化数据的 sameAs（增强 E-E-A-T）。
 * 配置方式：环境变量 NEXT_PUBLIC_SOCIAL_LINKS，逗号分隔。
 * 例：NEXT_PUBLIC_SOCIAL_LINKS=https://github.com/xxx,https://weibo.com/xxx
 */
export function getOrganizationSameAs(): string[] {
  return (process.env.NEXT_PUBLIC_SOCIAL_LINKS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
