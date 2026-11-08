import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ResourceDetailClient from './ResourceDetailClient'
import { getCachedLatestResources, getCachedHotTags, getCachedGuessResources } from '@/lib/cache'
import { getSiteUrl, absoluteUrl, buildMetaDescription } from '@/lib/seo'

// ISR：详情页正文对所有人一致，登录态与下载链接改由客户端调用鉴权接口获取，
// 这样页面可以缓存（原来 revalidate = 0 + 服务端读 Cookie，导致该路由无法缓存）。
export const revalidate = 3600

// 声明本路由为「按需生成 + 缓存」：不预先渲染任何 id（避免上千条资源在构建期全量渲染），
// 首次访问时生成并写入 ISR 缓存，之后直接命中缓存。
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) return {}

  const siteUrl = getSiteUrl()
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
  const fallbackDesc = `${mainTag}视频教程免费下载，涵盖${tagNames.join('、')}等核心技术点，适合${resource.category?.name || '编程'}学习者。`
  const metaDescription = buildMetaDescription(resource.content, fallbackDesc)
  const canonical = `${siteUrl}/resource/${idNum}`
  const image = resource.cover ? absoluteUrl(resource.cover) : undefined

  return {
    title: optimizedTitle,
    description: metaDescription,
    keywords: [resource.title, ...tagNames.slice(0, 3), resource.category?.name, resource.subcategory?.name].filter(Boolean) as string[],
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: optimizedTitle,
      description: metaDescription,
      url: canonical,
      type: 'article',
      locale: 'zh_CN',
      images: image ? [image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizedTitle,
      description: metaDescription,
      images: image ? [image] : [],
    },
  }
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // 4.5 鉴权与下载链接：改由客户端调用 /api/resources/access 获取，
  // 服务端不再读 Cookie，从而让本页可以走 ISR 缓存。
  const downloadUrl = ''
  const downloadCode = ''
  const authorized = false

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

  // 6. 生成结构化数据：只保留 Course + FAQ + Breadcrumb。
  //    已删除原来伪造的 AggregateRating（用 downloadCount 冒充评分/评价数，
  //    违反 Google 结构化数据政策，有被人工处罚的风险）。
  const siteUrl = getSiteUrl()
  const resourceUrl = `${siteUrl}/resource/${resourceRaw.id}`
  const priceValue = Number(resourceRaw.price) > 0 ? Number(resourceRaw.price).toFixed(2) : "0"
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": resourceRaw.title,
    "description": resourceRaw.content
      ? resourceRaw.content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 500)
      : `${resourceRaw.title} 视频教程`,
    "url": resourceUrl,
    "image": resourceRaw.cover ? absoluteUrl(resourceRaw.cover) : undefined,
    "provider": {
      "@type": "Organization",
      "name": "学好课",
      "url": siteUrl
    },
    "offers": {
      "@type": "Offer",
      "price": priceValue,
      "priceCurrency": "CNY",
      "url": resourceUrl,
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

  // 7. 面包屑结构化数据，与页面顶部的 HTML 面包屑保持一致
  const breadcrumbItems: { name: string; url: string }[] = [{ name: '首页', url: `${siteUrl}/` }]
  if (resourceRaw.category?.slug) {
    breadcrumbItems.push({ name: resourceRaw.category.name, url: `${siteUrl}/category/${resourceRaw.category.slug}` })
    if (resourceRaw.subcategory?.slug) {
      breadcrumbItems.push({ name: resourceRaw.subcategory.name, url: `${siteUrl}/category/${resourceRaw.category.slug}/${resourceRaw.subcategory.slug}` })
    }
  }
  breadcrumbItems.push({ name: resourceRaw.title, url: resourceUrl })
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.url,
    })),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
