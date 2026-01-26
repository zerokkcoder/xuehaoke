import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { headers, cookies } from 'next/headers'
import ResourceDetailClient from './ResourceDetailClient'
import { getCachedLatestResources, getCachedHotTags } from '@/lib/cache'
import jwt from 'jsonwebtoken'

export const revalidate = 0 // Disable cache for dynamic auth check or use logic below
// Note: If we use cookies, we opt out of full static generation for this route segment, 
// but since it's a dynamic [id] route, it's usually dynamic anyway. 
// However, 'revalidate' export forces ISR. 
// We should probably keep ISR for the public content but check auth dynamically.
// Actually, for authenticated content in ISR pages, we usually rely on client-side fetching.
// But since the user wants it to work "on click" without waiting, and SSR is better.
// Let's remove revalidate to make it dynamic, OR keep it and accept we need to access DB.
// Given the requirement, I'll switch to dynamic rendering to support immediate download link availability.
// Or better: keep ISR but add a "dynamic" hole? Next.js doesn't support that easily in App Router without "use client".
// So I will remove `export const revalidate = 3600` and let it be dynamic by default due to cookies usage.

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
  const [prev, next, tags, latestRaw, randomRaw] = await Promise.all([
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
    getCachedHotTags(),
    getCachedLatestResources(),
    prisma.$queryRawUnsafe<any[]>('SELECT id, title, cover FROM resources ORDER BY RAND() LIMIT 6')
  ])

  // 3. Process tags (handled by cache)
  // const tagIds = hotTagsRaw.map(t => t.tagId)
  // const tags = ...

  // 4. Process random/guess list
  const guessList = randomRaw.map((r: any) => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
    category: '推荐资源', // Simplified
  }))

  // 4.5 Check authorization
  let downloadUrl = ''
  let downloadCode = ''
  let authorized = false

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('site_token')?.value
    if (token) {
      const secret = process.env.SITE_JWT_SECRET || 'site_dev_secret_change_me'
      const payload = jwt.verify(token, secret) as any
      const userId = Number(payload?.uid)
      if (userId) {
        const [access, user] = await Promise.all([
          prisma.userResourceAccess.findUnique({ where: { userId_resourceId: { userId, resourceId: idNum } } }),
          prisma.user.findUnique({ where: { id: userId }, select: { isVip: true, vipExpireAt: true } })
        ])
        const now = new Date()
        const isVip = !!user?.isVip && (!!user?.vipExpireAt ? (new Date(user.vipExpireAt) > now) : true)
        
        if (isVip || access) {
          authorized = true
          // Fetch download link
          const resourceWithDownload = await prisma.resource.findUnique({
            where: { id: idNum },
            include: { downloads: true }
          })
          const download = resourceWithDownload?.downloads?.[0]
          if (download) {
            downloadUrl = download.url
            downloadCode = download.code || ''
          }
        }
      }
    }
  } catch (e) {
    // Ignore auth errors, treat as unauthorized
  }

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
    downloadUrl, 
    downloadCode,
    authorized,
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
