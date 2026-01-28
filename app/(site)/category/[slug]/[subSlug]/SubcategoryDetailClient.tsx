'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'

interface SubcategoryDetailClientProps {
  categorySlug: string
  subcategorySlug: string
  initialSubcategoryName: string
  initialResources: { id: number; coverImage: string; title: string; category: string }[]
  initialTotal: number
  initialSiteConfig: { heroImage?: string | null } | null
}

export default function SubcategoryDetailClient({
  categorySlug,
  subcategorySlug,
  initialSubcategoryName,
  initialResources,
  initialTotal,
  initialSiteConfig
}: SubcategoryDetailClientProps) {
  const [displayedResources, setDisplayedResources] = useState(initialResources)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(initialTotal)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(1)
  const loadedIdsRef = useRef<Set<number>>(new Set(initialResources.map(r => r.id)))
  const [hasMore, setHasMore] = useState(initialResources.length < initialTotal)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  const [sort, setSort] = useState<'latest' | 'downloads' | 'views'>('latest')

  const loadMoreResources = async (sortOverride?: 'latest' | 'downloads' | 'views', pageOverride?: number, force?: boolean) => {
    if ((isLoading || !hasMore) && !force) return
    setIsLoading(true)
    let computedTotal = total
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? (page + 1)
      if (requestedPage === lastPageRef.current && !force) { setIsLoading(false); return }
      
      const activeSort = sortOverride ?? sort
      const url = `/api/resources?page=${requestedPage}&size=${size}&subcategorySlug=${encodeURIComponent(subcategorySlug)}&sort=${activeSort}`
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

  useEffect(() => {
    if (!autoLoadEnabled && hasMore && displayedResources.length > 0) {
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
  }, [autoLoadEnabled, hasMore, isLoading, page])

  const handleSortChange = (nextSort: 'latest' | 'downloads' | 'views') => {
    if (sort === nextSort) return
    setDisplayedResources([])
    setTotal(0)
    setPage(1)
    lastPageRef.current = 0
    loadedIdsRef.current.clear()
    setHasMore(true)
    setAutoLoadEnabled(false)
    setIsLoading(false)
    setSort(nextSort)
    ;(async () => { await loadMoreResources(nextSort, 1, true) })()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <section className="mb-6">
          <div className="relative w-full h-48 md:h-64 overflow-hidden card">
            <Image
              src={initialSiteConfig?.heroImage || "/haike_hero.svg"}
              alt="Subcategory Hero"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{initialSubcategoryName}</h1>
                <p className="text-sm md:text-base opacity-90">共找到 {total} 个资源</p>
              </div>
            </div>
          </div>
        </section>

        <div className="card p-3 text-sm mt-4">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">排序</span>
            <button onClick={() => handleSortChange('latest')} className={`px-2 py-0.5 rounded-full ${sort==='latest' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>最新发布</button>
            <button onClick={() => handleSortChange('downloads')} className={`px-2 py-0.5 rounded-full ${sort==='downloads' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>下载最多</button>
            <button onClick={() => handleSortChange('views')} className={`px-2 py-0.5 rounded-full ${sort==='views' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>浏览最多</button>
          </div>
        </div>

        <section className="mt-2">
          <div className="container mx-auto">
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
          </div>
        </section>
      </div>
    </div>
  )
}
