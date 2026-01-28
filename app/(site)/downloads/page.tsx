'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ResourceCard from '@/components/ResourceCard'

type DownloadItem = {
  resourceId: number
  accessedAt: string
  title: string
  cover: string | null
  categorySlug: string | null
  subcategorySlug: string | null
  categoryName: string
  subcategoryName: string
}

export default function DownloadsPage() {
  const [items, setItems] = useState<DownloadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [siteConfig, setSiteConfig] = useState<{ heroImage?: string | null } | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('site_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.username === 'string') {
          setUsername(parsed.username)
        }
      }
    } catch {}
  }, [])

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
    const fetchDownloads = async () => {
      if (!username) { setLoading(false); return }
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/user/downloads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) {
          setError(json?.message || '获取下载记录失败')
          setItems([])
        } else {
          setItems(Array.isArray(json.data) ? json.data : [])
        }
      } catch (e: any) {
        setError(e?.message || '获取下载记录失败')
      } finally {
        setLoading(false)
      }
    }
    fetchDownloads()
  }, [username])

  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">请登录后查看下载记录</h1>
          <Link href="/login" className="btn btn-accent inline-block">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Hero */}
        <section className="mb-6">
          <div className="relative w-full h-40 md:h-52 overflow-hidden card">
            <Image
              src={siteConfig?.heroImage || "/haike_hero.svg"}
              alt="Downloads Hero"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">下载记录</h1>
                <p className="text-sm md:text-base opacity-90">用户：{username}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-2">当前暂无下载记录</div>
            <Link href="/" className="btn btn-primary inline-block">去逛逛</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {items.map((d, idx) => (
              <ResourceCard
                key={`${d.resourceId}-${d.accessedAt}`}
                resource={{
                  id: d.resourceId,
                  title: d.title,
                  coverImage: d.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
                  category: d.subcategoryName || d.categoryName || '其他',
                  categorySlug: d.categorySlug,
                  subcategorySlug: d.subcategorySlug,
                }}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
