'use client'

import Link from 'next/link'

export default function VIPFloatingButton({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/vip"
      className={`relative w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group flex items-center justify-center ${className}`}
      aria-label="升级VIP会员"
    >
      <span className="text-sm font-bold">VIP</span>
      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        升级VIP会员
      </div>
    </Link>
  )
}