'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { UserCircleIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface HeaderProps {
  currentUser?: {
    username: string
    isVip: boolean
  }
}

type NavCategory = { id: number; name: string; subcategories: { id: number; name: string }[] }

export default function Header({ currentUser }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [navCategories, setNavCategories] = useState<NavCategory[]>([])
  const [openCategoryId, setOpenCategoryId] = useState<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setNavCategories((data?.data || []).map((c: any) => ({ id: c.id, name: c.name, subcategories: (c.subcategories || []).map((s: any) => ({ id: s.id, name: s.name })) })))
        }
      } catch {
        // ignore
      }
    }
    load()
  }, [])

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 link">
            <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center">
              <span className="text-sm font-semibold">库</span>
            </div>
            <span className="text-lg font-semibold">酷库下载</span>
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
                      className="flex items-center gap-1 text-foreground hover:text-primary"
                      onClick={(e) => {
                        if (hasSubs) {
                          e.preventDefault()
                          if (closeTimerRef.current) { window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
                          setOpenCategoryId(isOpen ? null : category.id)
                        }
                      }}
                    >
                      <span className="text-sm">{category.name}</span>
                    </Link>
                    {hasSubs && (
                      <button
                        aria-label={isOpen ? '收起子类' : '展开子类'}
                        className="p-1 text-muted-foreground hover:text-primary"
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
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
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
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-foreground hover:text-primary"
              >
                <UserCircleIcon className="w-6 h-6" />
                <span className="hidden sm:block text-sm font-medium">
                  {currentUser?.username || '登录/注册'}
                </span>
                {currentUser?.isVip && (
                  <span className="badge">VIP</span>
                )}
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-background border border-border rounded-lg z-50">
                  <div className="py-2">
                    {currentUser ? (
                      <>
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
                        {!currentUser.isVip && (
                          <Link
                            href="/vip"
                            className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                          >
                            升级VIP
                          </Link>
                        )}
                        <hr className="my-2 border-border" />
                        <button className="block w-full text-left px-3 py-2 text-sm text-destructive hover:bg-secondary">
                          退出登录
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                        >
                          登录
                        </Link>
                        <Link
                          href="/register"
                          className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary"
                        >
                          注册
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                    className="flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary hover:bg-secondary rounded-md"
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