'use client'
import { useEffect, useState } from 'react'

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
    <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container">
        <div className="mt-6 w-full min-h-24 flex items-center justify-center text-center text-md">
          {siteConfig?.footerText || '学习是一生的投资，知识是最宝贵的财富'}
        </div>
      </div>
    </footer>
  )
}