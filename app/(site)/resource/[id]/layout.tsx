import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idNum = Number(params.id)
  try {
    const r = await prisma.resource.findUnique({ where: { id: idNum }, select: { title: true, content: true, cover: true, category: { select: { name: true } }, subcategory: { select: { name: true } } } })
    if (!r) {
      return { title: '资源未找到', alternates: { canonical: `/resource/${params.id}` } }
    }
    const title = `${r.title} - 资源下载`
    const twitterTitle = r.title
    const description = (r.content || '').replace(/\s+/g, ' ').slice(0, 160)
    const image = r.cover || '/logo.png'
    return {
      title,
      description,
      keywords: [r.title, r.category?.name || '', r.subcategory?.name || ''].filter(Boolean),
      alternates: { canonical: `/resource/${params.id}` },
      openGraph: {
        title: twitterTitle,
        description,
        images: [{ url: image }],
        type: 'article',
        locale: 'zh_CN',
      },
      twitter: {
        card: 'summary_large_image',
        title: twitterTitle,
        description,
        images: [image],
      },
    }
  } catch {
    return { title: '资源详情', alternates: { canonical: `/resource/${params.id}` } }
  }
}

export default async function ResourceLayout(props: any) {
  const { children, params } = props
  const idNum = Number(params?.id)
  let r: { title: string; content: string; cover: string | null; price: any } | null = null
  let site: { siteName: string | null; siteLogo: string | null } | null = null
  try {
    const row = await prisma.resource.findUnique({ where: { id: idNum }, select: { title: true, content: true, cover: true, price: true } })
    r = row ? { title: row.title, content: row.content, cover: row.cover || null, price: row.price } : null
  } catch {}
  try {
    const sRows: { site_name: string | null; site_logo: string | null }[] = await prisma.$queryRawUnsafe('SELECT site_name, site_logo FROM site_settings LIMIT 1')
    const sr = sRows?.[0]
    site = sr ? { siteName: sr.site_name || null, siteLogo: sr.site_logo || null } : null
  } catch {}

  const name = r?.title || '资源详情'
  const description = (r?.content || '').replace(/\s+/g, ' ').slice(0, 160)
  const image = r?.cover || site?.siteLogo || '/logo.png'
  const price = Number(r?.price || 0).toFixed(2)
  const brandName = site?.siteName || '骇课网'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku: String(idNum),
    brand: { '@type': 'Brand', name: brandName },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CNY',
      price,
      availability: 'https://schema.org/InStock',
      url: `/resource/${params.id}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
