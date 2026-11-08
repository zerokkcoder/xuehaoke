// 后台「Google AdSense」配置统一在此处理。
// 注意：保存时请求体里绝不能出现 <script> 原样字符串，否则会被服务器 WAF 判为 XSS 直接 403。
// 因此后台只存发布商 ID（ca-pub-xxx），脚本地址由这里拼出来。
const ADSENSE_SCRIPT_BASE = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
const CLIENT_ID_RE = /(?:ca-)?pub-\d{6,}/i

/** 从发布商 ID / 完整 <script> 代码 / 脚本 URL 中提取规范的 ca-pub-xxx，提取不到返回空串 */
export function extractAdsenseClientId(value?: string | null): string {
  const raw = (value || '').trim()
  const id = raw.match(CLIENT_ID_RE)?.[0]
  if (!id) return ''
  return /^ca-/i.test(id) ? id : `ca-${id}`
}

/** 后台设置值 → 需要加载的 AdSense 脚本地址；未填写或识别不了时返回 null（即不开启） */
export function resolveAdsenseScriptSrc(value?: string | null): string | null {
  const clientId = extractAdsenseClientId(value)
  return clientId ? `${ADSENSE_SCRIPT_BASE}?client=${clientId}` : null
}
