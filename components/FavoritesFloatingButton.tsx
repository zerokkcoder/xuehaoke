'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function FavoritesFloatingButton({ className = '' }: { className?: string }) {
  const [vip, setVip] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('site_user')
      if (!raw) { setTimeout(() => setVip(false), 0); return }
      const u = JSON.parse(raw)
      const username = u?.username
      if (!username) { setTimeout(() => setVip(false), 0); return }
      fetch('/api/user/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
      }).then(async (res) => {
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          const expire = json.data?.vipExpireAt ? new Date(json.data.vipExpireAt) : null
          const now = new Date()
          const active = !!json.data?.isVip && (expire ? expire > now : true)
          setVip(active)
        } else {
          setTimeout(() => setVip(false), 0)
        }
      }).catch(() => { setTimeout(() => setVip(false), 0) })
    } catch { setTimeout(() => setVip(false), 0) }
  }, [])

  if (!vip) return null

  return (
    <Link
      href="/favorites"
      className={`relative w-12 h-12 rounded-full bg-linear-to-r from-violet-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group flex items-center justify-center ${className}`}
      aria-label="网盘资源"
    >
      <span className="text-sm font-bold">盘</span>
      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        网盘资源
      </div>
    </Link>
  )
}