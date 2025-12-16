'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'

export default function SubcategoryPage() {
  const params = useParams()
  const categoryParam = params.slug as string
  const subParam = params.subSlug as string
  const categorySlug = categoryParam
  const subcategorySlug = subParam

  const [categoryName, setCategoryName] = useState<string>('')
  const [subcategoryName, setSubcategoryName] = useState<string>('')
  const [allCategories, setAllCategories] = useState<{ id: number; name: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[]>([])

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
  const [siteConfig, setSiteConfig] = useState<{ heroImage?: string | null } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch('/api/site/settings', { signal: controller.signal, cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) setSiteConfig(json.data)
      } catch {}
    }
    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await fetch('/api/categories')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          const cats: any[] = json.data || []
          setAllCategories(cats.map((c: any) => ({ id: Number(c.id), name: String(c.name || '') })))
          const found = cats.find((c: any) => String(c.slug || '') === categorySlug)
          setCategoryName(found?.name || '')
          const subs: any[] = found?.subcategories || []
          setSubcategories(subs.map((s: any) => ({ id: Number(s.id), name: String(s.name || '') })))
          const subFound = subs.find((s: any) => String(s.slug || '') === subcategorySlug)
          setSubcategoryName(subFound?.name || '')
        }
      } catch {}
    }
    loadMeta()
  }, [categoryParam, subParam])

  const loadMoreResources = async (
    sortOverride?: 'latest' | 'downloads' | 'views',
    pageOverride?: number,
    force?: boolean,
  ) => {
    if ((isLoading || !hasMore) && !force) return
    setIsLoading(true)
    let computedTotal = 0
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? page
      if (requestedPage === lastPageRef.current) { setIsLoading(false); return }
      const activeSort = sortOverride ?? sort
      const url = `/api/resources?page=${requestedPage}&size=${size}&subcategorySlug=${encodeURIComponent(subcategorySlug)}&sort=${activeSort}`
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
      const next = list.map((r: any) => ({ id: r.id, title: r.title, coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop', category: r.subcategoryName || r.categoryName || '其他', categorySlug: r.categorySlug || null, subcategorySlug: r.subcategorySlug || null }))
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
  }, [subParam, sort])

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
        loadMoreResources()
      }
    }, { root: null, rootMargin: '200px', threshold: 0 })
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
        <section className="mb-6">
          <div className="relative w-screen left-1/2 -translate-x-1/2 h-48 md:h-64 overflow-hidden border border-border bg-card">
            <Image
              src={siteConfig?.heroImage || "/haike_hero.svg"}
              alt="Subcategory Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{subcategoryName || '子分类'}</h1>
                <p className="text-sm md:text-base opacity-90">共找到 {total || displayedResources.length} 个资源</p>
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-lg border border-border bg-card p-3 text-sm mt-4">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">排序</span>
            <button onClick={() => handleSortChange('latest')} className={`px-2 py-0.5 rounded-full ${sort==='latest' ? 'bg-violet-500 text-white' : 'text-black'}`}>最新发布</button>
            <button onClick={() => handleSortChange('downloads')} className={`px-2 py-0.5 rounded-full ${sort==='downloads' ? 'bg-violet-500 text-white' : 'text-black'}`}>下载最多</button>
            <button onClick={() => handleSortChange('views')} className={`px-2 py-0.5 rounded-full ${sort==='views' ? 'bg-violet-500 text-white' : 'text-black'}`}>浏览最多</button>
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
