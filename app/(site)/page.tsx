import prisma from '@/lib/prisma'
import HomeClient from './HomeClient'
import { getCachedSiteSettings, getCachedHomepageResources } from '@/lib/cache'

/**
 * 页面重新验证时间 (ISR): 1小时
 */
export const revalidate = 3600

/**
 * 首页服务端组件
 * 负责获取初始数据 (站点配置、资源列表) 并传递给客户端组件
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const sort = (typeof resolvedSearchParams.sort === 'string' && ['latest', 'downloads', 'views'].includes(resolvedSearchParams.sort))
    ? resolvedSearchParams.sort as 'latest' | 'downloads' | 'views'
    : 'latest'

  // 1. 获取站点配置
  let siteConfig = null
  try {
    const s = await getCachedSiteSettings()
    if (s) {
      siteConfig = {
        heroImage: s.heroImage || null,
        siteSlogan: s.siteSlogan || null,
        siteSubtitle: s.siteSubtitle || null,
        siteName: s.siteName || null
      }
    }
  } catch (e) {
    console.error('Failed to fetch site settings:', e)
  }

  // 2. 获取初始资源列表
  const page = 1
  const size = 6
  
  let total = 0
  let resourcesRaw: any[] = []

  if (!q && sort === 'latest') {
    try {
      const cached = await getCachedHomepageResources()
      total = cached.total
      resourcesRaw = cached.resources
    } catch {}
  } else {
    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } }
      ]
    }

    let orderBy: any = { id: 'desc' }
    if (sort === 'downloads') {
      orderBy = { downloadCount: 'desc' }
    } else if (sort === 'views') {
      orderBy = { viewCount: 'desc' }
    }

    const [t, r] = await Promise.all([
      prisma.resource.count({ where }),
      prisma.resource.findMany({
        where,
        orderBy,
        take: size,
        include: {
          category: true,
          subcategory: true,
        }
      })
    ])
    total = t
    resourcesRaw = r
  }

  // 转换为客户端组件需要的格式

  // 转换为客户端组件需要的格式
  const initialResources = resourcesRaw.map((r) => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
    category: r.subcategory?.name || r.category?.name || '其他',
    categorySlug: r.category?.slug || null,
    subcategorySlug: r.subcategory?.slug || null,
  }))

  return (
    <HomeClient
      initialResources={initialResources}
      initialTotal={total}
      initialSiteConfig={siteConfig}
      initialQ={q}
      initialSort={sort}
    />
  )
}
