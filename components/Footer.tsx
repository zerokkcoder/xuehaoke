'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Footer() {
  const [siteConfig, setSiteConfig] = useState<{ footerText?: string | null; siteName?: string | null } | null>(null)
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
    <footer className="bg-linear-to-r from-blue-600 to-purple-600 text-white py-8">
      <div className="container flex flex-col items-center">
        <div className="w-full text-center text-md font-medium mb-4">
          {siteConfig?.footerText || '学习是一生的投资，知识是最宝贵的财富'}
        </div>
        
        <div className="flex items-center gap-6 text-xs text-white/60">
          <Link href="/about" className="hover:text-white transition-colors">关于我们</Link>
          <Link href="/contact" className="hover:text-white transition-colors">联系我们</Link>
          <Link href="/privacy-policy" className="hover:text-white transition-colors">隐私政策</Link>
          <Link href="/sitemap.xml" className="hover:text-white transition-colors">站点地图</Link>
        </div>
        
        <div className="mt-4 text-[10px] text-white/40">
          &copy; {new Date().getFullYear()} {siteConfig?.siteName || '学好课'}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}