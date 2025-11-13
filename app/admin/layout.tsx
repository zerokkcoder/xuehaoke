"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../globals.css";
import HeaderStatus from "./_components/HeaderStatus";
import { HomeIcon, Squares2X2Icon, DocumentIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, TagIcon, UserIcon, StarIcon, CreditCardIcon, Cog6ToothIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"
  const [collapsed, setCollapsed] = useState(false)
  const [siteConfig, setSiteConfig] = useState<{ siteLogo?: string | null; siteName?: string | null } | null>(null)

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

  if (isLogin) {
    return <div className="min-h-screen bg-background antialiased">{children}</div>
  }

  return (
    <div className="min-h-screen bg-background antialiased">
      <header className="bg-card shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={siteConfig?.siteLogo || '/logo.png'} alt="logo" className="w-8 h-8 rounded object-contain" />
            <span className="text-lg font-semibold text-foreground">管理后台</span>
            <button
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
              className="ml-2 inline-flex items-center justify-center w-8 h-8 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => setCollapsed(v => !v)}
            >
              {collapsed ? (
                <ChevronDoubleRightIcon className="h-5 w-5" />
              ) : (
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <HeaderStatus />
        </div>
      </header>
      <div className="w-full pt-16">
        <div className="flex min-h-0">
          <AsideMenu collapsed={collapsed} />
          <main className="h-screen flex-1 px-4 py-4 bg-gray-50 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}

function AsideMenu({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const items = [
    { href: "/admin", label: "仪表盘", Icon: HomeIcon },
    { href: "/admin/categories", label: "分类管理", Icon: DocumentIcon },
    { href: "/admin/tags", label: "标签管理", Icon: TagIcon },
    { href: "/admin/resources", label: "资源管理", Icon: Squares2X2Icon },
    { href: "/admin/favorites", label: "收藏管理", Icon: BookmarkIcon },
    { href: "/admin/users", label: "用户管理", Icon: UserIcon },
    { href: "/admin/plans", label: "会员计划", Icon: StarIcon },
    { href: "/admin/orders", label: "订单管理", Icon: CreditCardIcon },
    { href: "/admin/settings", label: "站点设置", Icon: Cog6ToothIcon },
  ] as const

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 transition-all border-r border-border`}>
      <nav className="space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-secondary ${active ? 'bg-secondary font-medium' : ''}`}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className={`${collapsed ? 'sr-only' : 'text-foreground'}`}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}