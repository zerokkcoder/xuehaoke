import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import ResourceDetailClient from './ResourceDetailClient'

export const revalidate = 3600 // ISR cache for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) return {}
  
  const resource = await prisma.resource.findUnique({
    where: { id: idNum },
    select: { title: true, content: true, cover: true }
  })
  
  if (!resource) return {}
  
  return {
    title: resource.title,
    description: resource.content ? resource.content.slice(0, 160).replace(/[#*`]/g, '') : '',
    openGraph: {
      title: resource.title,
      description: resource.content ? resource.content.slice(0, 160).replace(/[#*`]/g, '') : '',
      images: resource.cover ? [resource.cover] : [],
    }
  }
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resourceId = id
  const idNum = Number(id)

  if (isNaN(idNum)) return notFound()

  // 1. Fetch main resource data
  const resourceRaw = await prisma.resource.findUnique({
    where: { id: idNum },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      tags: { include: { tag: true } },
    }
  })

  if (!resourceRaw) return notFound()

  // 2. Fetch related data (parallel)
  const [prev, next, hotTagsRaw, latestRaw, randomRaw] = await Promise.all([
    prisma.resource.findFirst({
      where: { id: { lt: idNum } },
      orderBy: { id: 'desc' },
      select: { id: true, title: true }
    }),
    prisma.resource.findFirst({
      where: { id: { gt: idNum } },
      orderBy: { id: 'asc' },
      select: { id: true, title: true }
    }),
    prisma.resourceTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
    }),
    prisma.resource.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      select: { id: true, title: true }
    }),
    prisma.$queryRawUnsafe<any[]>('SELECT id, title, cover FROM resources ORDER BY RAND() LIMIT 6')
  ])

  // 3. Process tags
  const tagIds = hotTagsRaw.map(t => t.tagId)
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true, slug: true }
  })

  // 4. Process random/guess list
  const guessList = randomRaw.map((r: any) => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
    category: '推荐资源', // Simplified
  }))

  // 5. Transform resource data for client
  const resource = {
    id: String(resourceRaw.id),
    title: resourceRaw.title,
    description: resourceRaw.content, // mapped to description in client
    content: resourceRaw.content,
    cover: resourceRaw.cover,
    price: Number(resourceRaw.price),
    downloadCount: resourceRaw.downloadCount,
    viewCount: resourceRaw.viewCount,
    createdAt: resourceRaw.createdAt.toISOString(),
    category: resourceRaw.category.name,
    categorySlug: resourceRaw.category.slug,
    subcategory: resourceRaw.subcategory?.name,
    subcategorySlug: resourceRaw.subcategory?.slug,
    tags: resourceRaw.tags.map(t => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug })),
    isVipOnly: false, // Simplified
    isNew: (Date.now() - resourceRaw.createdAt.getTime()) < 7 * 24 * 3600 * 1000,
    isPopular: resourceRaw.downloadCount > 100 || resourceRaw.viewCount > 500,
    downloadUrl: '', // Secure info not passed to client by default unless authorized check passed later
    downloadCode: '',
  }

  // 6. Log view count (server side effect)
  // We can't easily execute async side effect without delaying response, 
  // better to let client trigger view count or use a fire-and-forget mechanism if possible.
  // For now we skip server-side view counting or rely on client.

  return (
    <ResourceDetailClient
      resource={resource}
      prevNext={{ prev, next }}
      hotTags={tags}
      latestArticles={latestRaw}
      guessList={guessList}
    />
  )
}
