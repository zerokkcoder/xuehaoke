import redis from './redis'
import prisma from './prisma'

const CACHE_TTL = 60 * 60 // 1 hour
const KEY_LATEST_RESOURCES = 'latest_resources'
const KEY_HOT_TAGS = 'hot_tags'
const KEY_SITE_SETTINGS = 'site_settings'
const KEY_CATEGORIES = 'categories'
const KEY_PLANS = 'plans'
const KEY_HOMEPAGE_RESOURCES = 'homepage_resources'

export async function getCachedLatestResources(limit = 10) {
  const cached = await redis.get(KEY_LATEST_RESOURCES)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const data = await prisma.resource.findMany({
    orderBy: { id: 'desc' },
    take: limit,
    select: { id: true, title: true }
  })

  await redis.set(KEY_LATEST_RESOURCES, JSON.stringify(data), 'EX', CACHE_TTL)
  return data
}

export async function getCachedHotTags() {
  const cached = await redis.get(KEY_HOT_TAGS)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const hotTagsRaw = await prisma.resourceTag.groupBy({
    by: ['tagId'],
    _count: { tagId: true },
    orderBy: { _count: { tagId: 'desc' } },
  })

  const tagIds = hotTagsRaw.map(t => t.tagId)
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true, slug: true }
  })

  // Sort tags by count order
  const sortedTags = tagIds.map(id => tags.find(t => t.id === id)).filter(Boolean)

  await redis.set(KEY_HOT_TAGS, JSON.stringify(sortedTags), 'EX', CACHE_TTL)
  return sortedTags
}

export async function getCachedSiteSettings() {
  const cached = await redis.get(KEY_SITE_SETTINGS)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const rows: any[] = await prisma.$queryRawUnsafe('SELECT * FROM site_settings LIMIT 1')
  const r = rows?.[0]
  
  const data = r ? {
    id: r.id,
    siteName: r.site_name,
    siteLogo: r.site_logo,
    siteSlogan: r.site_slogan,
    siteKeywords: r.site_keywords,
    siteDescription: r.site_description,
    heroImage: r.hero_image,
    footerText: r.footer_text,
    siteSubtitle: r.site_subtitle,
  } : {}

  await redis.set(KEY_SITE_SETTINGS, JSON.stringify(data), 'EX', CACHE_TTL)
  return data
}

export async function getCachedCategories() {
  const cached = await redis.get(KEY_CATEGORIES)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const cats = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    include: {
      subcategories: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
    },
  })
  
  // Format to match what the frontend expects if needed, or just return raw Prisma result
  // The layout.tsx does some mapping, we can replicate it or return the raw data and let the caller handle it.
  // Looking at layout.tsx, it maps to { id, name, slug, subcategories: [...] }
  // Let's return the raw prisma result to be flexible, but the caller needs to handle it.
  // Actually, let's just cache the raw data.
  
  await redis.set(KEY_CATEGORIES, JSON.stringify(cats), 'EX', CACHE_TTL)
  return cats
}

export async function getCachedPlans() {
  const cached = await redis.get(KEY_PLANS)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const plans = await prisma.membershipPlan.findMany({
    orderBy: [{ isPopular: 'desc' }, { price: 'asc' }, { id: 'asc' }]
  })

  await redis.set(KEY_PLANS, JSON.stringify(plans), 'EX', CACHE_TTL)
  return plans
}

export async function getCachedHomepageResources() {
  const cached = await redis.get(KEY_HOMEPAGE_RESOURCES)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (e) {
      console.error('Redis parse error:', e)
    }
  }

  const [total, resources] = await Promise.all([
    prisma.resource.count(),
    prisma.resource.findMany({
      orderBy: { id: 'desc' },
      take: 6,
      include: {
        category: true,
        subcategory: true,
      }
    })
  ])

  const result = { total, resources }
  await redis.set(KEY_HOMEPAGE_RESOURCES, JSON.stringify(result), 'EX', CACHE_TTL)
  return result
}

export async function invalidateResourceCache() {
  await redis.del(KEY_LATEST_RESOURCES)
  await redis.del(KEY_HOT_TAGS)
  await redis.del(KEY_HOMEPAGE_RESOURCES)
}

export async function invalidateSiteSettingsCache() {
  await redis.del(KEY_SITE_SETTINGS)
}

export async function invalidateCategoriesCache() {
  await redis.del(KEY_CATEGORIES)
}

export async function invalidatePlansCache() {
  await redis.del(KEY_PLANS)
}
