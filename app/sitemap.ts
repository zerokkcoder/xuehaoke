import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

// 缓存 sitemap 1 小时，避免每次爬取都全量查询分类/标签/资源
export const revalidate = 3600

// 规范化 URL：移除 trailing slash，确保格式一致
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 统一使用 https://www.xuehaoke.top，避免 www/非www 重复
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
  if (!baseUrl.includes('www.') && !baseUrl.includes('localhost')) {
    baseUrl = baseUrl.replace('https://', 'https://www.')
  }
  baseUrl = normalizeUrl(baseUrl)

  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Categories
  const categories = await prisma.category.findMany({
    select: { slug: true, createdAt: true },
  })

  // 去重：使用 Map 按 slug 去重
  const categoryMap = new Map<string, { slug: string; createdAt: Date }>()
  categories.forEach((category: any) => {
    if (category.slug && !categoryMap.has(category.slug)) {
      categoryMap.set(category.slug, category)
    }
  })

  const categoryUrls = Array.from(categoryMap.values()).map((category: any) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Tags
  const tags = await prisma.tag.findMany({
    select: { slug: true, createdAt: true },
  })

  // 去重
  const tagMap = new Map<string, { slug: string; createdAt: Date }>()
  tags.forEach((tag: any) => {
    if (tag.slug && !tagMap.has(tag.slug)) {
      tagMap.set(tag.slug, tag)
    }
  })

  const tagUrls = Array.from(tagMap.values()).map((tag: any) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    lastModified: tag.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Resources (Limit to recent 1000 to avoid performance issues)
  const resources = await prisma.resource.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  })

  // 去重：按 ID 去重
  const resourceMap = new Map<number, { id: number; updatedAt: Date }>()
  resources.forEach((resource: any) => {
    if (!resourceMap.has(resource.id)) {
      resourceMap.set(resource.id, resource)
    }
  })

  const resourceUrls = Array.from(resourceMap.values()).map((resource: any) => ({
    url: `${baseUrl}/resource/${resource.id}`,
    lastModified: resource.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [...routes, ...categoryUrls, ...tagUrls, ...resourceUrls]
}
