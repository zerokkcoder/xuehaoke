'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'

interface TagDetailClientProps {
  tagSlug: string
  initialTagName: string
  initialResources: { id: number; coverImage: string; title: string; category: string }[]
  initialTotal: number
  initialSiteConfig: { heroImage?: string | null } | null
}

export default function TagDetailClient({
  tagSlug,
  initialTagName,
  initialResources,
  initialTotal,
  initialSiteConfig
}: TagDetailClientProps) {
  const [displayedResources, setDisplayedResources] = useState(initialResources)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(initialTotal)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(1) // Initial page is 1
  const loadedIdsRef = useRef<Set<number>>(new Set(initialResources.map(r => r.id)))
  const [hasMore, setHasMore] = useState(initialResources.length < initialTotal)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  const [sort, setSort] = useState<'latest' | 'downloads' | 'views'>('latest')

  // When tagSlug changes, reset everything (though this component is likely remounted by key in parent)
  useEffect(() => {
    // If the parent component uses tagSlug as a key, this effect might be redundant for initial load,
    // but useful if we navigate between tags without full remount (unlikely with Next.js App Router default behavior for same segment).
    // However, since we pass initial props, we should respect them.
    // We only reset if the props differ significantly from state, which is tricky.
    // For now, let's rely on the parent passing fresh initial data and Next.js handling the component key.
  }, [tagSlug])

  const loadMoreResources = async (sortOverride?: 'latest' | 'downloads' | 'views', pageOverride?: number, force?: boolean) => {
    if ((isLoading || !hasMore) && !force) return
    setIsLoading(true)
    let computedTotal = total
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? (page + 1)
      if (requestedPage === lastPageRef.current && !force) { setIsLoading(false); return }
      
      const activeSort = sortOverride ?? sort
      const url = `/api/resources?page=${requestedPage}&size=${size}&tagSlug=${encodeURIComponent(tagSlug)}&sort=${activeSort}`
      const res = await fetch(url)
      if (!res.ok) { setIsLoading(false); return }
      let data: any = null
      try { data = await res.json() } catch { setIsLoading(false); return }
      
      const list = Array.isArray(data?.data) ? data.data : []
      const pg = data?.pagination; if (pg) { computedTotal = pg.total || 0; setTotal(computedTotal) }
      
      if (list.length === 0) {
        setHasMore(false)
        setIsLoading(false)
        return
      }

      const next = list.map((r: any) => ({
        id: r.id,
        title: r.title,
        coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
        category: r.subcategoryName || r.categoryName || '其他',
        categorySlug: r.categorySlug || null,
        subcategorySlug: r.subcategorySlug || null
      }))

      const filtered = next.filter((item: { id: number }) => !loadedIdsRef.current.has(item.id))
      filtered.forEach((item: { id: number }) => loadedIdsRef.current.add(item.id))
      
      setDisplayedResources(prev => force ? filtered : [...prev, ...filtered])
      
      const loadedCount = force ? filtered.length : loadedIdsRef.current.size
      nextHasMoreFlag = (filtered.length > 0) && (computedTotal === 0 || loadedCount < computedTotal)
      
      lastPageRef.current = requestedPage
      setPage(requestedPage)
    } catch {} finally {
      setIsLoading(false)
      setHasMore(nextHasMoreFlag)
      setAutoLoadEnabled(nextHasMoreFlag && computedTotal > 0)
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    // Only enable auto-load after first manual interaction or if we want it by default?
    // Original code set autoLoadEnabled to false initially.
    // But if we have initial data, we might want to enable it if there's more.
    if (!autoLoadEnabled && hasMore && displayedResources.length > 0) {
        // Allow auto-load if we have content and there's more
        setAutoLoadEnabled(true) 
    }
  }, [hasMore, displayedResources.length])

  useEffect(() => {
    if (!autoLoadEnabled) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const lastRef = { t: 0 }
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      const now = Date.now()
      if (now - lastRef.t < 500) return
      if (entry.isIntersecting && hasMore && !isLoading) {
        lastRef.t = now
        loadMoreResources(undefined, undefined, false)
      }
    }, { root: null, rootMargin: '200px', threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, hasMore, isLoading, page]) // removed total/displayedResources.length to reduce re-renders

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Hero section */}
        <section className="mb-6">
          <div className="relative w-full h-48 md:h-64 overflow-hidden card">
            <Image
              src={initialSiteConfig?.heroImage || "/haike_hero.svg"}
              alt="Tag Hero"
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{initialTagName}</h1>
                <p className="text-sm md:text-base opacity-90">共找到 {total} 个资源</p>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Grid */}
        {displayedResources.length === 0 ? (
          <div className="text-center mt-4 py-16">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无资源</h3>
            <p className="text-muted-foreground">该标签下还没有资源，敬请期待。</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
              {displayedResources.map((resource, index) => (
                <ResourceCard key={resource.id} resource={resource} index={index} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-4" />
            {isLoading && (
              <div className="flex justify-center my-6">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
