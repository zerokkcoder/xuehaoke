'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ResourceCard from '@/components/ResourceCard'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

function HomeInner() {
  const [displayedResources, setDisplayedResources] = useState<{ id: number; coverImage: string; title: string; category: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(0)
  const loadedIdsRef = useRef<Set<number>>(new Set())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'latest' | 'downloads' | 'views'>('latest')
  const [hasMore, setHasMore] = useState(true)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false)
  // 移除初始化标记，改为监听 URL 的搜索参数变化
  const router = useRouter()
  const searchParams = useSearchParams()
  const qParamValue = (searchParams.get('q') || '').trim()
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDisplayedResources([])
    setTotal(0)
    setPage(1)
    lastPageRef.current = 0
    loadedIdsRef.current.clear()
    setHasMore(true)
    setAutoLoadEnabled(false)
    const q = query.trim()
    const currentQ = searchParams.get('q') || ''
    if (q) {
      if ( q !== currentQ) router.replace(`/?q=${encodeURIComponent(q)}`)
    } else {
      // 保留空查询参数
      router.replace('/?q=')
    }
    // 不在这里直接加载，等待 URL 变化后由 effect 统一触发加载，避免竞态或重复请求
    // 兜底：立即触发一次首轮加载（使用当前输入作为 q），不等 URL effect
    loadMoreResources(q, true, undefined, 1)
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
    let computedTotal = 0
    let nextHasMoreFlag = false
    try {
      const requestedPage = pageOverride ?? page
      // 防重复：若当前页与最近成功加载的页相同，跳过
      if (requestedPage === lastPageRef.current) { setIsLoading(false); return }
      const activeQ = (qOverride ?? qParamValue) || ''
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
        // 标记已尝试当前页，避免 Observer 再次请求同一页造成无限 loading
        lastPageRef.current = requestedPage
        if (advance) setPage(requestedPage + 1)
        setIsLoading(false)
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
      // 以 ref 跟踪已加载的唯一 ID，过滤掉重复项
      const filtered = next.filter((item: { id: number }) => !loadedIdsRef.current.has(item.id))
      filtered.forEach((item: { id: number }) => loadedIdsRef.current.add(item.id))
      setDisplayedResources(prev => [...prev, ...filtered])
      const loadedCount = loadedIdsRef.current.size
      nextHasMoreFlag = (filtered.length > 0) && (computedTotal === 0 || loadedCount < computedTotal)
      // 标记已成功加载的页；仅在有新增数据时推进下一页，否则停止自动加载
      lastPageRef.current = requestedPage
      if (nextHasMoreFlag) {
        if (advance) setPage(requestedPage + 1)
      } else {
        // 无新增唯一数据，判定为已加载完，关闭自动加载
        setAutoLoadEnabled(false)
        setTotal(loadedCount)
      }
    } catch {
      // ignore fetch errors
    } finally {
      setIsLoading(false)
      // 首轮加载结束后再开启自动加载，仅当仍有更多数据时触发滚动加载
      setHasMore(nextHasMoreFlag)
      setAutoLoadEnabled(nextHasMoreFlag && computedTotal > 0)
    }
  }

  // Auto load more when the sentinel enters viewport
  useEffect(() => {
    if (!autoLoadEnabled) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // 使用全局 hasMore 状态控制是否继续加载
        if (entry.isIntersecting && hasMore && !isLoading) {
          const nextPage = (lastPageRef.current || 0) + 1
          loadMoreResources(qParamValue, false, undefined, nextPage, true)
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [autoLoadEnabled, displayedResources.length, isLoading, page, total, qParamValue])

  // 监听 URL 中的 q 改变：重置列表并加载第一页（统一入口）
  useEffect(() => {
    setQuery(qParamValue)
    setDisplayedResources([])
    setTotal(0)
    setPage(1)
    lastPageRef.current = 0
    loadedIdsRef.current.clear()
    // 导航后先关闭 Observer，待当前加载完成再开启
    setAutoLoadEnabled(false)
    loadMoreResources(qParamValue, true, undefined, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParamValue])

  const handleSortChange = (next: 'latest' | 'downloads' | 'views') => {
    if (sort === next) return
    setDisplayedResources([])
    loadedIdsRef.current.clear()
    lastPageRef.current = 0
    setPage(1)
    setTotal(0)
    setHasMore(true)
    setAutoLoadEnabled(false)
    setIsLoading(false)
    setSort(next)
    ;(async () => { await loadMoreResources(undefined, true, next, 1, false) })()
  }

  const showSearchView = (searchParams.get('q') !== null)
  const [siteConfig, setSiteConfig] = useState<{ heroImage?: string | null; siteSlogan?: string | null; siteSubtitle?: string | null } | null>(null)

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Static Image, Title, Description, and Search */}
      {!showSearchView && (
        <section>
          <div className="relative w-full h-64 md:h-72 overflow-hidden rounded-lg border border-border bg-card">
            <Image
              src={siteConfig?.heroImage || "/haike_hero.svg"}
              alt="Hero"
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full text-white">
                <div className="w-full animate-fadeIn flex flex-col items-center justify-center text-center">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{siteConfig?.siteSubtitle || '学好课，卷王必备的资源平台'}</h1>
                  <p className="text-base md:text-lg mb-4 opacity-90">{siteConfig?.siteSlogan || '海量优质资源，快速检索，一键下载'}</p>
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
          <div className="relative w-full h-40 md:h-48 overflow-hidden rounded-lg border border-border bg-card">
            <Image
              src={siteConfig?.heroImage || "/haike_hero.svg"}
              alt="Search Header"
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
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
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-muted-foreground">分类</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white">全部</span>
              </div>
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground">排序</span>
                <button onClick={() => handleSortChange('latest')} className={`px-2 py-0.5 rounded-full ${sort==='latest' ? 'bg-violet-500 text-white' : 'text-black'}`}>最新发布</button>
                <button onClick={() => handleSortChange('downloads')} className={`px-2 py-0.5 rounded-full ${sort==='downloads' ? 'bg-violet-500 text-white' : 'text-black'}`}>下载最多</button>
                <button onClick={() => handleSortChange('views')} className={`px-2 py-0.5 rounded-full ${sort==='views' ? 'bg-violet-500 text-white' : 'text-black'}`}>浏览最多</button>
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

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <HomeInner />
    </Suspense>
  )
}
