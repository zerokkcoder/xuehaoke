import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import SubcategoryDetailClient from './SubcategoryDetailClient'

export const revalidate = 3600 // ISR cache for 1 hour

export async function generateMetadata({ params }: { params: Promise<{ slug: string; subSlug: string }> }): Promise<Metadata> {
  const { slug, subSlug } = await params
  const categorySlug = decodeURIComponent(slug)
  const subcategorySlug = decodeURIComponent(subSlug)

  try {
    const sub = await prisma.subcategory.findFirst({
      where: { 
        slug: subcategorySlug,
        category: { slug: categorySlug }
      }
    })

    if (!sub) {
      return { title: '子分类未找到' }
    }

    const name = sub.name || '子分类'
    const title = `${name} - 资源分类`
    const description = `浏览 ${name} 分类下的精选资源。`

    return {
      title,
      description,
      alternates: { canonical: `/category/${categorySlug}/${subcategorySlug}` },
      openGraph: { title, description, type: 'website', locale: 'zh_CN' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: '子分类', alternates: { canonical: `/category/${categorySlug}/${subcategorySlug}` } }
  }
}

export default async function SubcategoryPage({ params }: { params: Promise<{ slug: string; subSlug: string }> }) {
  const { slug, subSlug } = await params
  const categorySlug = decodeURIComponent(slug)
  const subcategorySlug = decodeURIComponent(subSlug)

  // 1. Fetch subcategory info
  const subcategory = await prisma.subcategory.findFirst({
    where: { 
      slug: subcategorySlug,
      category: { slug: categorySlug }
    }
  })

  if (!subcategory) {
    return notFound()
  }

  // 2. Fetch site settings
  let siteConfig = null
  try {
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT hero_image FROM site_settings LIMIT 1')
    const r = rows?.[0]
    if (r) {
      siteConfig = { heroImage: r.hero_image ?? null }
    }
  } catch {}

  // 3. Fetch initial resources
  const page = 1
  const size = 6
  const where = {
    subcategory: { slug: subcategorySlug },
    category: { slug: categorySlug }
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
    <SubcategoryDetailClient
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
      initialSubcategoryName={subcategory.name}
      initialResources={initialResources}
      initialTotal={total}
      initialSiteConfig={siteConfig}
    />
  )
}
