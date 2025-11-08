'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'

export default function TagPage() {
  const params = useParams()
  const tagId = Number(params.id as string)

  const [tagName, setTagName] = useState<string>('标签')
  const [displayedResources, setDisplayedResources] = useState<{ id: number; coverImage: string; title: string; category: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(0)
  const loadedIdsRef = useRef<Set<number>>(new Set())
  const [hasMore, setHasMore] = useState(true)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  const [sort, setSort] = useState<'latest' | 'downloads' | 'views'>('latest')

  useEffect(() => {
    const loadTagName = async () => {
      try {
        const res = await fetch('/api/tags')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          const found = (json.data || []).find((t: any) => Number(t.id) === tagId)
          setTagName(found?.name || '标签')
        }
      } catch {}
    }
    loadTagName()
  }, [tagId])

  const loadMoreResources = async (sortOverride?: 'latest' | 'downloads' | 'views', pageOverride?: number, force?: boolean) => {
    if ((isLoading || !hasMore) && !force) return
    setIsLoading(true)
    let computedTotal = 0
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? page
      if (requestedPage === lastPageRef.current) { setIsLoading(false); return }
      const activeSort = sortOverride ?? sort
      const url = `/api/resources?page=${requestedPage}&size=${size}&tagId=${tagId}&sort=${activeSort}`
      const res = await fetch(url)
      if (!res.ok) { setIsLoading(false); return }
      let data: any = null
      try { data = await res.json() } catch { setIsLoading(false); return }
      const list = Array.isArray(data?.data) ? data.data : []
      const pg = data?.pagination; if (pg) { computedTotal = pg.total || 0; setTotal(computedTotal) }
      if (list.length === 0) {
        lastPageRef.current = requestedPage
        setPage(requestedPage + 1)
        setIsLoading(false)
        return
      }
      const next = list.map((r: any) => ({ id: r.id, title: r.title, coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop', category: r.subcategoryName || r.categoryName || '其他', categoryId: r.categoryId, subcategoryId: r.subcategoryId }))
      const filtered = next.filter((item: { id: number }) => !loadedIdsRef.current.has(item.id))
      filtered.forEach((item: { id: number }) => loadedIdsRef.current.add(item.id))
      setDisplayedResources(prev => [...prev, ...filtered])
      const loadedCount = loadedIdsRef.current.size
      nextHasMoreFlag = (filtered.length > 0) && (computedTotal === 0 || loadedCount < computedTotal)
      lastPageRef.current = requestedPage
      if (nextHasMoreFlag) { setPage(requestedPage + 1) } else { setAutoLoadEnabled(false); setTotal(loadedCount) }
    } catch {} finally {
      setIsLoading(false)
      setHasMore(nextHasMoreFlag)
      setAutoLoadEnabled(nextHasMoreFlag && computedTotal > 0)
    }
  }

  useEffect(() => {
    setDisplayedResources([])
    setTotal(0)
    setPage(1)
    lastPageRef.current = 0
    loadedIdsRef.current.clear()
    setHasMore(true)
    setAutoLoadEnabled(false)
    setIsLoading(false)
    ;(async () => { await loadMoreResources(sort, 1, true) })()
  }, [tagId])

  useEffect(() => {
    if (!autoLoadEnabled) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => { const [entry] = entries; if (entry.isIntersecting && hasMore && !isLoading) { loadMoreResources(undefined, undefined, false) } }, { root: null, rootMargin: '200px', threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, displayedResources.length, isLoading, page, total])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Hero section, no filter card below */}
        <section className="mb-6">
          <div className="relative w-screen left-1/2 -translate-x-1/2 h-48 md:h-64 overflow-hidden border border-border bg-card">
            <Image
              src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1600&h=600&fit=crop"
              alt="Tag Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{tagName}</h1>
                <p className="text-sm md:text-base opacity-90">共找到 {total || displayedResources.length} 个资源</p>
              </div>
            </div>
          </div>
        </section>

        {/* 标签页不需要排序卡片 */}

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