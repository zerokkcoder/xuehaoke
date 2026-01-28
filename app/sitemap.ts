import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xuehaoke.top'

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
  
  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Tags
  const tags = await prisma.tag.findMany({
    select: { slug: true, createdAt: true },
  })
  
  const tagUrls = tags.map((tag) => ({
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

  const resourceUrls = resources.map((resource) => ({
    url: `${baseUrl}/resource/${resource.id}`,
    lastModified: resource.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [...routes, ...categoryUrls, ...tagUrls, ...resourceUrls]
}
