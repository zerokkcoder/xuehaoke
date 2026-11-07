import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import ResourceDetailClient from './ResourceDetailClient'
import { getCachedLatestResources, getCachedHotTags, getCachedGuessResources } from '@/lib/cache'
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
    select: { title: true, content: true, cover: true, category: { select: { name: true, slug: true } }, subcategory: { select: { name: true, slug: true } }, tags: { include: { tag: true } } }
  })

  if (!resource) return {}

  const tagNames = resource.tags.map((t: any) => t.tag.name).filter((n: any) => n)
  const mainTag = tagNames[0] || resource.category?.name || ''
  const techKeywords = tagNames.slice(0, 3).join('+') || resource.category?.name || ''
  const cleanTitle = resource.title.replace(/无秘|完结|高清|完整版/gi, '').trim()
  const highlights = cleanTitle.length > 30 ? cleanTitle.slice(0, 30) + '...' : cleanTitle

  const optimizedTitle = `${techKeywords}视频教程 - ${highlights} | 学好课`
  const metaDescription = resource.content
    ? resource.content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 160)
    : `${mainTag}视频教程免费下载，涵盖${tagNames.join('、')}等核心技术点，适合${resource.category?.name || '编程'}学习者。`

  return {
    title: optimizedTitle,
    description: metaDescription,
    openGraph: {
      title: optimizedTitle,
      description: metaDescription,
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
    getCachedGuessResources()
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
    tags: resourceRaw.tags.map((t: any) => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug })),
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

  // 7. Generate Course Schema for Rich Snippets
  const priceValue = Number(resourceRaw.price) > 0 ? Number(resourceRaw.price).toFixed(2) : "0"
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": resourceRaw.title,
    "description": resourceRaw.content
      ? resourceRaw.content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 500)
      : `${resourceRaw.title} 视频教程`,
    "url": `https://www.xuehaoke.top/resource/${resourceRaw.id}`,
    "image": resourceRaw.cover || undefined,
    "provider": {
      "@type": "Organization",
      "name": "学好课",
      "url": "https://www.xuehaoke.top"
    },
    "aggregateRating": resourceRaw.downloadCount > 10 ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": resourceRaw.downloadCount.toString()
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": priceValue,
      "priceCurrency": "CNY",
      "availability": Number(resourceRaw.price) > 0
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock"
    },
    "about": {
      "@type": "Thing",
      "name": resourceRaw.category?.name || "编程课程",
      "description": resourceRaw.subcategory?.name || `${resourceRaw.tags.map((t: any) => t.tag.name).join('、')}相关课程`
    }
  }

  // 8. Generate FAQ Schema for AI SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `什么是 ${resourceRaw.title}？`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": resourceRaw.content 
            ? resourceRaw.content.slice(0, 200).replace(/[\r\n#*`]+/g, ' ').trim() + (resourceRaw.content.length > 200 ? '...' : '')
            : `${resourceRaw.title} 是一个优质的 ${resourceRaw.category.name} 资源，涵盖了${resourceRaw.tags.map((t: any) => t.tag.name).join('、')}等相关内容。`
        }
      },
      {
        "@type": "Question",
        "name": `如何获取 ${resourceRaw.title}？`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `您可以在本页面直接下载 ${resourceRaw.title}。我们提供高速下载服务，确保您能快速获取所需的 ${resourceRaw.category.name} 资料。点击页面上的“立即下载”按钮即可开始。`
        }
      },
      {
        "@type": "Question",
        "name": `${resourceRaw.title} 是免费的吗？`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": Number(resourceRaw.price) > 0 
            ? `本资源当前价格为 ${Number(resourceRaw.price).toFixed(2)} 元。加入本站 VIP 会员可享受免费下载或折扣优惠。` 
            : `是的，${resourceRaw.title} 完全免费，您可以直接下载使用，无需支付任何费用。`
        }
      },
      {
        "@type": "Question",
        "name": `${resourceRaw.title} 适合谁使用？`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `该资源适合所有对 ${resourceRaw.category.name} 感兴趣的学习者、开发者或设计师。无论您是初学者还是有经验的专业人士，都能从中获益。`
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <ResourceDetailClient
        resource={resource}
        prevNext={{ prev, next }}
        hotTags={tags}
        latestArticles={latestRaw}
        guessList={guessList}
      />
    </>
  )
}
