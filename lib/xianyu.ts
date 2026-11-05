export type XianyuKeywordHit = { word: string; replacement: string; count: number }

export type XianyuMaterial = {
  title: string
  description: string
  price: number
  images: string[]
  hits: XianyuKeywordHit[]
}

// 闲鱼常见违规 / 限流关键词及其安全替代表达
// 说明：匹配时按词长倒序处理，避免短词先替换导致长词失效
const KEYWORD_RULES: Array<[string, string]> = [
  // 站外联系方式
  ['加个微信', '伽个威信'],
  ['加微信', '伽威信'],
  ['微信号', '威信号'],
  ['微信', '威信'],
  ['vx', '薇'],
  ['qq', '企鹅'],
  ['扣扣', '企鹅'],
  ['支付宝', '吱付宝'],
  ['电话号码', '联络方式'],
  ['手机号', '联络号'],
  ['联系方式', '练习方式'],
  ['电话', '垫话'],
  ['加我', '伽我'],
  ['私聊', '斯聊'],
  ['私信', '斯信'],
  // 站外平台
  ['拼多多', '拼夕夕'],
  ['抖音', '抖荫'],
  ['快手', '筷手'],
  ['小红书', '小红薯'],
  ['bilibili', '哔哩'],
  ['B站', '哔站'],
  ['百度网盘', '云盘'],
  ['百度云', '云盘'],
  ['网盘', '云盘'],
  ['淘宝', '桃宝'],
  ['官网', '观网'],
  // 版权 / 风险类
  ['破解', 'po解'],
  ['盗版', '道版'],
  ['侵权', '侵全'],
  ['网课', '网颗'],
  ['教程', '教呈'],
  ['素材', '素才'],
  ['资源', '滋源'],
  ['代理', '代里'],
  ['兼职', '兼值'],
  ['刷单', '涮单'],
  ['返现', '返仙'],
  // 广告法极限词
  ['全网最低', '超值'],
  ['最低价', '超值'],
  ['最便宜', '超值'],
  ['永久有效', '长期有效'],
  ['国家级', '高规格'],
]

const SORTED_RULES = [...KEYWORD_RULES].sort((a, b) => b[0].length - a[0].length)

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 自动替换违规关键词，并返回命中明细（供后台展示，可手动覆盖）
export function sanitizeXianyuText(input: string): { text: string; hits: XianyuKeywordHit[] } {
  let text = String(input ?? '')
  const hits: XianyuKeywordHit[] = []
  for (const [word, replacement] of SORTED_RULES) {
    const re = new RegExp(escapeRegExp(word), 'gi')
    const matches = text.match(re)
    if (matches && matches.length > 0) {
      hits.push({ word, replacement, count: matches.length })
      text = text.replace(re, replacement)
    }
  }
  return { text, hits }
}

// 将资源正文（Markdown）转成纯文本，并去掉站外链接等高风险内容
export function stripMarkdownToPlain(input: string): string {
  let s = String(input ?? '')
  s = s.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
  s = s.replace(/```/g, ' ')
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  s = s.replace(/https?:\/\/\S+/g, ' ')
  s = s.replace(/^\s{0,3}#{1,6}\s*/gm, '')
  s = s.replace(/^\s{0,3}>\s?/gm, '')
  s = s.replace(/^\s{0,3}[-*+]\s+/gm, '')
  s = s.replace(/^\s{0,3}\d+\.\s+/gm, '')
  s = s.replace(/^\s*[-=]{3,}\s*$/gm, '')
  s = s.replace(/[*_`~]/g, '')
  s = s.replace(/[ \t]+/g, ' ')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

// 由资源生成闲鱼上架素材（标题 / 描述 / 价格 / 图片），并完成违禁词替换
export function buildXianyuMaterial(input: {
  title: string
  content?: string | null
  price?: unknown
  cover?: string | null
}): XianyuMaterial {
  const rawTitle = String(input.title || '').trim()
  const plain = stripMarkdownToPlain(input.content || '')
  const lines = plain.split('\n')
  if (lines[0]?.trim() === rawTitle) lines.shift()
  const body = lines.join('\n').trim()

  const titleRes = sanitizeXianyuText(rawTitle)
  const descRes = sanitizeXianyuText(body)

  const map = new Map<string, XianyuKeywordHit>()
  for (const hit of [...titleRes.hits, ...descRes.hits]) {
    const key = `${hit.word}→${hit.replacement}`
    const prev = map.get(key)
    if (prev) prev.count += hit.count
    else map.set(key, { ...hit })
  }

  const priceNum = Number(input.price)
  return {
    title: titleRes.text,
    description: descRes.text,
    price: Number.isFinite(priceNum) ? Math.max(0, Math.round(priceNum * 100) / 100) : 0,
    images: input.cover ? [input.cover] : [],
    hits: Array.from(map.values()),
  }
}
