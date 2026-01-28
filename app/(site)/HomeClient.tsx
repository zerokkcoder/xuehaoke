'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'
import TypewriterText from '@/components/TypewriterText'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

interface HomeClientProps {
  initialResources: { id: number; coverImage: string; title: string; category: string }[]
  initialTotal: number
  initialSiteConfig: { heroImage?: string | null; siteSlogan?: string | null; siteSubtitle?: string | null; siteName?: string | null } | null
  initialQ: string
  initialSort: 'latest' | 'downloads' | 'views'
}

export default function HomeClient({
  initialResources,
  initialTotal,
  initialSiteConfig,
  initialQ,
  initialSort
}: HomeClientProps) {
  const [displayedResources, setDisplayedResources] = useState(initialResources)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(initialTotal)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(1)
  const loadedIdsRef = useRef<Set<number>>(new Set(initialResources.map(r => r.id)))
  const [query, setQuery] = useState(initialQ)
  const [sort, setSort] = useState<'latest' | 'downloads' | 'views'>(initialSort)
  const [hasMore, setHasMore] = useState(initialResources.length < initialTotal)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  // const qParamValue = (searchParams.get('q') || '').trim() // We use initialQ passed from server

  // Sync state if props change (e.g. navigation)
  // But strictly speaking, if we navigate, the Server Component re-renders and passes new props.
  // We should initialize state from props, but also watch for prop changes if the component isn't unmounted.
  // In Next.js App Router, navigating with query params usually re-runs the page component.
  
  useEffect(() => {
    setDisplayedResources(initialResources)
    setTotal(initialTotal)
    setPage(1)
    lastPageRef.current = 1
    loadedIdsRef.current = new Set(initialResources.map(r => r.id))
    setHasMore(initialResources.length < initialTotal)
    setQuery(initialQ)
    setSort(initialSort)
    setIsLoading(false)
    setAutoLoadEnabled(false)
  }, [initialResources, initialTotal, initialQ, initialSort])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    const currentQ = searchParams.get('q') || ''
    if (q !== currentQ) {
      if (q) {
        router.push(`/?q=${encodeURIComponent(q)}`)
      } else {
        router.push('/')
      }
    }
  }

  const loadMoreResources = async (
    qOverride?: string,
    force?: boolean,
    sortOverride?: 'latest' | 'downloads' | 'views',
    pageOverride?: number,
    advance: boolean = true,
  ) => {
    if (isLoading || (!hasMore && !force)) return
    setIsLoading(true)
    let computedTotal = total
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? (page + 1)
      if (requestedPage === lastPageRef.current && !force) { setIsLoading(false); return }
      
      const activeQ = qOverride ?? query
      const qParam = activeQ ? `&q=${encodeURIComponent(activeQ)}` : ''
      const activeSort = sortOverride ?? sort
      const url = `/api/resources?page=${requestedPage}&size=${size}${qParam}&sort=${activeSort}`
      const res = await fetch(url)
      if (!res.ok) { setIsLoading(false); return }
      let data: any = null
      try { data = await res.json() } catch { setIsLoading(false); return }
      
      const list = Array.isArray(data?.data) ? data.data : []
      const pg = data?.pagination; if (pg) { computedTotal = pg.total || 0; setTotal(computedTotal) }
      
      if (list.length === 0) {
        lastPageRef.current = requestedPage
        if (advance) setPage(requestedPage)
        setIsLoading(false)
        setHasMore(false)
        return
      }

      const next = list.map((r: any) => ({
        id: r.id,
        title: r.title,
        coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
        category: r.subcategoryName || r.categoryName || '其他',
        categorySlug: r.categorySlug || null,
        subcategorySlug: r.subcategorySlug || null,
      }))

      const filtered = next.filter((item: { id: number }) => !loadedIdsRef.current.has(item.id))
      filtered.forEach((item: { id: number }) => loadedIdsRef.current.add(item.id))
      
      setDisplayedResources(prev => force ? filtered : [...prev, ...filtered])
      
      const loadedCount = force ? filtered.length : loadedIdsRef.current.size
      nextHasMoreFlag = (filtered.length > 0) && (computedTotal === 0 || loadedCount < computedTotal)
      
      lastPageRef.current = requestedPage
      if (nextHasMoreFlag) {
        if (advance) setPage(requestedPage)
      } else {
        setAutoLoadEnabled(false)
        setTotal(loadedCount)
      }
    } catch {
    } finally {
      setIsLoading(false)
      setHasMore(nextHasMoreFlag)
      setAutoLoadEnabled(nextHasMoreFlag && computedTotal > 0)
    }
  }

  // Auto load enable check
  useEffect(() => {
    if (!autoLoadEnabled && hasMore && displayedResources.length > 0) {
       // Check if we need to enable auto load (e.g. scroll happened)
       // Simplified: just enable it if there is more
       setAutoLoadEnabled(true)
    }
  }, [hasMore, displayedResources.length])

  useEffect(() => {
    if (!autoLoadEnabled) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const lastRef = { t: 0 }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        const now = Date.now()
        if (now - lastRef.t < 500) return
        if (entry.isIntersecting && hasMore && !isLoading) {
          lastRef.t = now
          loadMoreResources(undefined, false, undefined, undefined, true)
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, displayedResources.length, isLoading, page, total, query, sort])

  const handleSortChange = (next: 'latest' | 'downloads' | 'views') => {
    if (sort === next) return
    const url = new URL(window.location.href)
    url.searchParams.set('sort', next)
    router.push(url.pathname + url.search)
  }

  const showSearchView = !!initialQ
  
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Static Image, Title, Description, and Search */}
      {!showSearchView && (
        <section>
          <div className="relative w-full h-64 md:h-72 overflow-hidden card">
            <Image
              src={initialSiteConfig?.heroImage || "/haike_hero.svg"}
              alt="Hero"
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full text-white">
                <div className="w-full animate-fadeIn flex flex-col items-center justify-center text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{initialSiteConfig?.siteSubtitle || '学好课，卷王必备的资源平台'}</h1>
                  <TypewriterText 
                    text={initialSiteConfig?.siteSlogan || '海量优质资源，快速检索，一键下载'} 
                    className="text-base md:text-lg mb-4 opacity-90"
                  />
                  <form onSubmit={handleSearchSubmit} className="flex items-center justify-center w-11/12 md:w-full md:max-w-md mx-auto bg-white rounded-full shadow">
                    <input
                      type="text"
                      placeholder="搜一下"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 outline-none bg-transparent text-sm md:text-base text-foreground pl-4 md:pl-6"
                    />
                    <button type="submit" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-violet-500 text-white flex items-center justify-center hover:opacity-90" aria-label="搜索">
                      <MagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {showSearchView && (
        <section>
          <div className="relative w-full h-40 md:h-48 overflow-hidden card">
            <Image
              src={initialSiteConfig?.heroImage || "/haike_hero.svg"}
              alt="Search Header"
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full">
                <form onSubmit={handleSearchSubmit} className="flex items-center justify-center w-11/12 md:w-full md:max-w-md mx-auto bg-white rounded-full shadow">
                  <input
                    type="text"
                    placeholder="搜一下"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 outline-none bg-transparent text-sm md:text-base text-foreground pl-4 md:pl-6"
                  />
                  <button type="submit" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-violet-500 text-white flex items-center justify-center hover:opacity-90" aria-label="搜索">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="container mx-auto mt-6!">
            <div className="card p-3 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-muted-foreground">分类</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white">全部</span>
              </div>
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground">排序</span>
                <button onClick={() => handleSortChange('latest')} className={`px-2 py-0.5 rounded-full ${sort==='latest' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>最新发布</button>
                <button onClick={() => handleSortChange('downloads')} className={`px-2 py-0.5 rounded-full ${sort==='downloads' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>下载最多</button>
                <button onClick={() => handleSortChange('views')} className={`px-2 py-0.5 rounded-full ${sort==='views' ? 'bg-violet-500 text-white' : 'text-foreground hover:bg-muted'}`}>浏览最多</button>
            </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Resources Section */}
      <section className="mt-6">
        <div className="container mx-auto">
          {/* Resources Grid - Waterfall Layout */}
          <div className="grid grid-auto-fit items-stretch gap-4 md:gap-5 justify-center md:justify-start">
            {displayedResources.map((resource, index) => (
              <ResourceCard key={resource.id} resource={resource} index={index} />
            ))}
          </div>
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>
      </section>

      {/* Categories Overview removed per request */}
      
      {/* VIP Floating Button moved to site layout */}
    </div>
  )
}
