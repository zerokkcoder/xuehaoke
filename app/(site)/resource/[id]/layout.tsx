import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) {
    return { title: '资源未找到', robots: { index: false, follow: true } }
  }
  try {
    const r = await prisma.resource.findUnique({ where: { id: idNum }, select: { title: true, content: true, cover: true, category: { select: { name: true } }, subcategory: { select: { name: true } } } })
    
    // 强制使用生产环境域名
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'

    if (!r) {
      return { title: '资源未找到', alternates: { canonical: `${siteUrl}/resource/${id}` }, robots: { index: false, follow: true } }
    }
    
    const title = `${r.title} - 资源下载`
    const twitterTitle = r.title
    const description = (r.content || '').replace(/\s+/g, ' ').slice(0, 160)
    const imageRaw = r.cover || '/logo.png'
    const image = imageRaw.startsWith('http') ? imageRaw : `${siteUrl}${imageRaw}`
    return {
      title,
      description,
      keywords: [r.title, r.category?.name || '', r.subcategory?.name || ''].filter(Boolean),
      alternates: { canonical: `${siteUrl}/resource/${id}` },
      robots: { index: true, follow: true },
      openGraph: {
        title: twitterTitle,
        description,
        images: [{ url: image }],
        url: `${siteUrl}/resource/${id}`,
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
    return { title: '资源详情', alternates: { canonical: `${siteUrl}/resource/${id}` }, robots: { index: false, follow: true } }
  }
}

export const dynamic = 'force-dynamic'

export default async function ResourceLayout(props: any) {
  const { children, params } = props
  const { id } = await params
  const idNum = Number(id)
  
  if (isNaN(idNum)) {
    notFound()
  }

  // 验证资源是否存在
  const exists = await prisma.resource.count({ where: { id: idNum } })
  if (exists === 0) {
    notFound()
  }

  let r: { title: string; content: string; cover: string | null; price: any; downloadCount: number } | null = null
  let site: { siteName: string | null; siteLogo: string | null } | null = null
  try {
    const row = await prisma.resource.findUnique({ where: { id: idNum }, select: { title: true, content: true, cover: true, price: true, downloadCount: true } })
    r = row ? { title: row.title, content: row.content, cover: row.cover || null, price: row.price, downloadCount: row.downloadCount } : null
  } catch {}
  try {
    const sRows: { site_name: string | null; site_logo: string | null }[] = await prisma.$queryRawUnsafe('SELECT site_name, site_logo FROM site_settings LIMIT 1')
    const sr = sRows?.[0]
    site = sr ? { siteName: sr.site_name || null, siteLogo: sr.site_logo || null } : null
  } catch {}

  const hs = await headers()
  const nonce = hs.get('x-nonce') || undefined
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
  const name = r?.title || '资源详情'
  const description = (r?.content || '').replace(/\s+/g, ' ').slice(0, 160)
  const imageRaw = r?.cover || site?.siteLogo || '/logo.png'
  const image = imageRaw.startsWith('http') ? imageRaw : `${siteUrl}${imageRaw}`
  const price = Number(r?.price || 0).toFixed(2)
  const brandName = site?.siteName || '学好课'
  
  // Calculate priceValidUntil (1 year from now)
  const priceValidUntil = new Date()
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku: String(idNum),
    brand: { '@type': 'Brand', name: brandName },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      ratingCount: Math.max(1, r?.downloadCount || 0),
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CNY',
      price,
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/resource/${id}`,
      priceValidUntil: priceValidUntil.toISOString().split('T')[0],
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'CNY',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'CN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
        },
      },
    },
  }

  return (
    <>
      <script type="application/ld+json" nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
