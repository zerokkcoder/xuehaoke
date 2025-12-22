import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const idNum = Number(id)
  try {
    const r = await prisma.resource.findUnique({ where: { id: idNum }, select: { title: true, content: true, cover: true, category: { select: { name: true } }, subcategory: { select: { name: true } } } })
    if (!r) {
      const hs = await headers()
      const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
      const host = hs.get('x-forwarded-host') || hs.get('host') || ''
      const origin = host ? `${proto}://${host}` : 'https://example.com'
      return { title: '资源未找到', alternates: { canonical: `${origin}/resource/${id}` }, robots: { index: true, follow: true } }
    }
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    const origin = host ? `${proto}://${host}` : 'https://example.com'
    const title = `${r.title} - 资源下载`
    const twitterTitle = r.title
    const description = (r.content || '').replace(/\s+/g, ' ').slice(0, 160)
    const imageRaw = r.cover || '/logo.png'
    const image = imageRaw.startsWith('http') ? imageRaw : `${origin}${imageRaw}`
    return {
      title,
      description,
      keywords: [r.title, r.category?.name || '', r.subcategory?.name || ''].filter(Boolean),
      alternates: { canonical: `${origin}/resource/${id}` },
      robots: { index: true, follow: true },
      openGraph: {
        title: twitterTitle,
        description,
        images: [{ url: image }],
        url: `${origin}/resource/${id}`,
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
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    const origin = host ? `${proto}://${host}` : 'https://example.com'
    const { id: id2 } = await params
    return { title: '资源详情', alternates: { canonical: `${origin}/resource/${id2}` }, robots: { index: true, follow: true } }
  }
}

export const dynamic = 'force-dynamic'

export default async function ResourceLayout(props: any) {
  const { children, params } = props
  const { id } = await params
  const idNum = Number(id)
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
  const proto = hs.get('x-forwarded-proto') || 'https'
  const host = hs.get('x-forwarded-host') || hs.get('host') || ''
  const origin = host ? `${proto}://${host}` : 'https://example.com'
  const name = r?.title || '资源详情'
  const description = (r?.content || '').replace(/\s+/g, ' ').slice(0, 160)
  const imageRaw = r?.cover || site?.siteLogo || '/logo.png'
  const image = imageRaw.startsWith('http') ? imageRaw : `${origin}${imageRaw}`
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
      url: `${origin}/resource/${id}`,
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
