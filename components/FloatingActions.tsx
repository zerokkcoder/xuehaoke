'use client'

import { useEffect, useState } from 'react'
import VIPFloatingButton from '@/components/VIPFloatingButton'
import FavoritesFloatingButton from '@/components/FavoritesFloatingButton'
import BackToTopButton from '@/components/BackToTopButton'

export default function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      try {
        const y = window.scrollY || document.documentElement.scrollTop || 0
        setShowBackToTop(y > 200)
      } catch {}
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-36 right-6 flex flex-col items-end gap-3 z-50">
      <FavoritesFloatingButton />
      <VIPFloatingButton />
      {showBackToTop && <BackToTopButton />}
    </div>
  )
}