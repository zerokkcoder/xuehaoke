'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ResourceCard from '@/components/ResourceCard'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

export default function Home() {
  const [displayedResources, setDisplayedResources] = useState<{ id: number; coverImage: string; title: string; category: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [size] = useState(6)
  const [total, setTotal] = useState(0)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const lastPageRef = useRef(0)

  const loadMoreResources = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const requestedPage = page
      // 防重复：若当前页与最近成功加载的页相同，跳过
      if (requestedPage === lastPageRef.current) { setIsLoading(false); return }
      const res = await fetch(`/api/resources?page=${requestedPage}&size=${size}`)
      if (!res.ok) { setIsLoading(false); return }
      let data: any = null
      try { data = await res.json() } catch { setIsLoading(false); return }
      const list = Array.isArray(data?.data) ? data.data : []
      if (list.length === 0) { setIsLoading(false); return }
      const next = list.map((r: any) => ({
        id: r.id,
        title: r.title,
        coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
        category: r.subcategoryName || r.categoryName || '其他',
      }))
      setDisplayedResources(prev => {
        const merged = [...prev, ...next]
        const seen = new Set<any>()
        const unique = merged.filter(item => {
          const k = item.id
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        return unique
      })
      const pg = data?.pagination; if (pg) { setTotal(pg.total || 0) }
      // 标记已成功加载的页，并推进下一页
      lastPageRef.current = requestedPage
      setPage(requestedPage + 1)
    } catch {
      // ignore fetch errors
    } finally {
      setIsLoading(false)
    }
  }

  // Auto load more when the sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        const hasMore = displayedResources.length < total || total === 0
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMoreResources()
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayedResources.length, isLoading, page, total])

  // 初始加载
  useEffect(() => {
    if (displayedResources.length === 0) {
      loadMoreResources()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Static Image, Title, Description, and Search */}
      <section>
        <div className="relative w-full h-64 md:h-72 overflow-hidden rounded-lg border border-border bg-card">
          <Image
            src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1600&h=600&fit=crop"
            alt="Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full text-white">
              <div className="w-full animate-fadeIn flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">优课网，卷王必备的资源平台</h1>
                <p className="text-base md:text-lg mb-4 opacity-90">海量优质资源，快速检索，一键下载</p>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center justify-center w-full max-w-md mx-auto bg-white rounded-full shadow"
                >
                  <input
                    type="text"
                    placeholder="搜一下"
                    className="flex-1 outline-none bg-transparent text-sm md:text-base text-foreground pl-5 md:pl-6"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center hover:opacity-90"
                    aria-label="搜索"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources Section */}
      <section className="mt-6">
        <div className="container mx-auto">
          {/* Resources Grid - Waterfall Layout */}
          <div className="grid grid-auto-fit justify-center gap-5 md:gap-6">
            {displayedResources.map((resource, index) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                index={index}
              />
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
      
      {/* VIP Floating Button */}
      <VIPFloatingButton />
    </div>
  )
}

// VIP Floating Button Component
function VIPFloatingButton() {
  return (
    <Link
      href="/vip"
      className="fixed bottom-6 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
    >
      <div className="flex items-center justify-center">
        <span className="text-xl font-bold">VIP</span>
      </div>
      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        升级VIP会员
      </div>
    </Link>
  )
}
