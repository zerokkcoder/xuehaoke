import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import TagDetailClient from './TagDetailClient'

export const revalidate = 3600 // ISR cache for 1 hour

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tagSlug = decodeURIComponent(slug)

  // 1. Fetch tag info
  const tag = await prisma.tag.findFirst({
    where: { slug: tagSlug },
  })

  if (!tag) {
    return notFound()
  }

  // 2. Fetch site settings (mimic /api/site/settings logic)
  let siteConfig = null
  try {
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT hero_image FROM site_settings LIMIT 1')
    const r = rows?.[0]
    if (r) {
      siteConfig = { heroImage: r.hero_image ?? null }
    }
  } catch {}

  // 3. Fetch initial resources (page=1, size=6, sort='latest')
  const page = 1
  const size = 6
  const where = {
    tags: { some: { tag: { slug: tagSlug } } }
  }

  const [total, resourcesRaw] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { id: 'desc' }, // default 'latest'
      take: size,
      include: {
        category: true,
        subcategory: true,
      }
    })
  ])

  // Transform to client format
  const initialResources = resourcesRaw.map((r: any) => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
    category: r.subcategory?.name || r.category?.name || '其他',
    categorySlug: r.category?.slug || null,
    subcategorySlug: r.subcategory?.slug || null
  }))

  return (
    <TagDetailClient
      tagSlug={tagSlug}
      initialTagName={tag.name}
      initialResources={initialResources}
      initialTotal={total}
      initialSiteConfig={siteConfig}
    />
  )
}
