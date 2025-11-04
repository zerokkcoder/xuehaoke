'use client'

import { useEffect, useRef, useState } from 'react'

type DropdownProps = {
  trigger: React.ReactNode
  menu: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export default function Dropdown({ trigger, menu, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(false) // 点击后固定展开
  const ref = useRef<HTMLDivElement | null>(null)

  // 点击空白处关闭
  useEffect(() => {
    const handleDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setLocked(false)
      }
    }
    document.addEventListener('mousedown', handleDoc)
    return () => document.removeEventListener('mousedown', handleDoc)
  }, [])

  return (
    <div ref={ref} className={`relative inline-block ${className ?? ''}`}>
      <div
        onClick={() => {
          setLocked(prev => {
            const next = !prev
            setOpen(next)
            return next
          })
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className={`absolute mt-2 w-44 bg-card rounded-md shadow-lg ring-1 ring-border p-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {menu}
        </div>
      )}
    </div>
  )
}