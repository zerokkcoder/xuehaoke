'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserCircleIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface HeaderProps {
  currentUser?: {
    username: string
    isVip: boolean
    avatarUrl?: string
  }
  initialCategories?: NavCategory[]
  initialSiteConfig?: { siteName?: string | null; siteLogo?: string | null } | null
}

type NavCategory = { id: number; name: string; subcategories: { id: number; name: string }[] }

export default function Header({ currentUser, initialCategories = [], initialSiteConfig = null }: HeaderProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [navCategories, setNavCategories] = useState<NavCategory[]>(initialCategories)
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null)
  const [siteUser, setSiteUser] = useState<{ username: string; isVip: boolean; avatarUrl?: string } | null>(currentUser ?? null)
  const [siteConfig, setSiteConfig] = useState<{ siteName?: string | null; siteLogo?: string | null } | null>(initialSiteConfig)
  const closeTimerRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) return
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch('/api/categories', { signal: controller.signal, keepalive: true, cache: 'no-store' })
        if (!res.ok) return
        let data: any = null
        try { data = await res.json() } catch { return }
        const incoming = Array.isArray(data?.data) ? data.data : []
        const seenCat = new Set<number>()
        const dedupCats: NavCategory[] = []
        for (const c of incoming) {
          if (seenCat.has(c.id)) continue
          seenCat.add(c.id)
          const seenSub = new Set<number>()
          const subs = (c.subcategories || []).filter((s: any) => {
            if (seenSub.has(s.id)) return false
            seenSub.add(s.id)
            return true
          }).map((s: any) => ({ id: s.id, name: s.name }))
          dedupCats.push({ id: c.id, name: c.name, subcategories: subs })
        }
        setNavCategories(dedupCats)
      } catch (err: any) {
        // 如果是主动取消（页面切换/卸载），不记录错误
        if (err?.name === 'AbortError') return
      }
    }
    load()
    return () => controller.abort()
  }, [])

  // Always refresh public site settings (logo/name) on mount to avoid stale cache
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch('/api/site/settings', { signal: controller.signal, cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && json.data) setSiteConfig(json.data)
      } catch {}
    }
    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setMounted(true)
    try {
      const raw = window.localStorage.getItem('site_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.username === 'string') {
          setSiteUser({ username: parsed.username, isVip: !!parsed.isVip, avatarUrl: parsed.avatarUrl })
        }
      }
    } catch {}
  }, [])

  const handleLogout = () => {
    // 调用后端清除 httpOnly 会话 Cookie
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(() => {})
      .finally(() => {
        // 清除前端缓存的用户信息
        try { window.localStorage.removeItem('site_user') } catch {}
        setSiteUser(null)
        setIsUserMenuOpen(false)
        // 退出后重载页面，确保授权状态与导航同步更新
        try { window.location.reload() } catch {}
      })
  }

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 link">
            <Image src={siteConfig?.siteLogo || '/logo.png'} alt="logo" width={28} height={28} className="object-contain" priority />
            <span className="text-lg font-semibold">{siteConfig?.siteName || '酷库下载'}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navCategories.map((category) => {
              const hasSubs = category.subcategories && category.subcategories.length > 0
              const isOpen = openCategoryId === category.id
              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => {
                    if (!hasSubs) return
                    if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
                    setOpenCategoryId(category.id)
                  }}
                  onMouseLeave={() => {
                    if (!hasSubs) return
                    if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
                    closeTimerRef.current = window.setTimeout(() => {
                      setOpenCategoryId((prev) => (prev === category.id ? null : prev))
                      closeTimerRef.current = null
                    }, 180)
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/category/${category.id}`}
                      className={`flex items-center gap-1 text-foreground hover:text-violet-500 pb-0.5 border-b-2 ${pathname?.startsWith(`/category/${category.id}`) ? 'border-violet-500' : 'border-transparent'}`}
                    >
                      <span className="text-sm">{category.name}</span>
                    </Link>
                    {hasSubs && (
                      <button
                        aria-label={isOpen ? '收起子类' : '展开子类'}
                        className="p-1 text-muted-foreground hover:text-violet-500"
                        onClick={() => setOpenCategoryId(isOpen ? null : category.id)}
                      >
                        {isOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {hasSubs && isOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-44 bg-background border border-border rounded-lg z-50"
                      onMouseEnter={() => {
                        if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
                        setOpenCategoryId(category.id)
                      }}
                      onMouseLeave={() => {
                        if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
                        closeTimerRef.current = window.setTimeout(() => {
                          setOpenCategoryId((prev) => (prev === category.id ? null : prev))
                          closeTimerRef.current = null
                        }, 180)
                      }}
                    >
                      <div className="py-2">
                        {category.subcategories.map((subcategory) => (
                          <Link
                            key={subcategory.id}
                            href={`/category/${category.id}/${subcategory.id}`}
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-violet-500 hover:bg-secondary"
                          >
                            {subcategory.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {(mounted ? siteUser : currentUser) ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-foreground hover:text-primary"
                >
                  {(mounted ? siteUser : currentUser)?.avatarUrl ? (
                    <Image src={(mounted ? siteUser : currentUser)!.avatarUrl as string} alt="avatar" width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-6 h-6" />
                  )}
                  <span className="hidden sm:block text-sm font-medium">
                    {(mounted ? siteUser : currentUser)!.username}
                  </span>
                  {(mounted ? siteUser : currentUser)!.isVip && (
                    <span className="badge">VIP</span>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 bg-background border border-border rounded-lg z-50">
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                      >
                        个人中心
                      </Link>
                      <Link
                        href="/downloads"
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                      >
                        下载记录
                      </Link>
                      <Link
                        href="/vip"
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                      >
                        升级VIP
                      </Link>
                      <hr className="my-2 border-border" />
                      <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-destructive hover:bg-secondary">
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary">登录</Link>
                <span className="text-muted-foreground">/</span>
                <Link href="/register" className="text-sm font-medium text-foreground hover:text-primary">注册</Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-foreground hover:text-primary hover:bg-secondary"
            >
              {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="space-y-2">
              {navCategories.map((category) => (
                <div key={category.id}>
                  <Link
                    href={`/category/${category.id}`}
                    className={`flex items-center gap-2 px-4 py-2 text-foreground hover:text-violet-500 hover:bg-secondary rounded-md ${pathname?.startsWith(`/category/${category.id}`) ? 'underline underline-offset-4 decoration-2 decoration-violet-500' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">{category.name}</span>
                  </Link>
                  <div className="ml-8 space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`/category/${category.id}/${subcategory.id}`}
                        className="block px-4 py-1 text-sm text-muted-foreground hover:text-primary hover:bg-secondary rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}