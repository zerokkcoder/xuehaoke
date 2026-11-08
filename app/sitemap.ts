import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'
import { getSiteUrl } from '@/lib/seo'

// 缓存 sitemap 1 小时，避免每次爬取都全量查询分类/标签/资源
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 统一域名（生产环境强制 https + www），避免 www/非 www 重复
  const baseUrl = getSiteUrl()

  // Static routes
  // 注意：这里不再输出 lastModified。原来是 new Date()，每次生成都会变，
  // 属于「假更新」，搜索引擎会因此降低对本站 lastmod 的信任度，不如不写。
  const routes = [
    '',
    '/about',
    '/contact',
    '/privacy-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
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
