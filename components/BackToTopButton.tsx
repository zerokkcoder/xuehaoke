'use client'

import { ChevronUpIcon } from '@heroicons/react/24/outline'

export default function BackToTopButton({ className = '' }: { className?: string }) {
  const handleBackToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // Fallback without smooth
      window.scrollTo(0, 0)
    }
  }

  return (
    <button
      aria-label="返回顶部"
      onClick={handleBackToTop}
      className={`w-12 h-12 rounded-full bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${className}`}
    >
      <ChevronUpIcon className="w-5 h-5" />
    </button>
  )
}