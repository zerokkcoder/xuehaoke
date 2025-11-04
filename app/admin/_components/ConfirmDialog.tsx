'use client'

import { useEffect } from 'react'

type Props = {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = '确认操作',
  message = '确定要继续吗？',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-[92%] max-w-sm bg-card rounded-lg shadow-xl ring-1 ring-border">
        <div className="px-4 pt-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 mb-4">{message}</p>
        </div>
        <div className="px-4 pb-4 flex gap-3 justify-end">
          <button className="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}