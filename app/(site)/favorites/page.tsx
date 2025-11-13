"use client"

import { useEffect, useState } from 'react'
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog'

type FavItem = { id: number; title: string; url: string; enabled: boolean }

export default function FavoritesPage() {
  const [userVip, setUserVip] = useState<boolean | null>(null)
  const [items, setItems] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(50)
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / size))
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('site_user')
      if (!raw) { setUserVip(false); return }
      const u = JSON.parse(raw)
      const username = u?.username
      if (!username) { setUserVip(false); return }
      fetch('/api/user/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
      }).then(async (res) => {
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          const expire = json.data?.vipExpireAt ? new Date(json.data.vipExpireAt) : null
          const now = new Date()
          const active = !!json.data?.isVip && (expire ? expire > now : true)
          setUserVip(active)
        } else {
          setUserVip(false)
        }
      }).catch(() => { setUserVip(false) })
    } catch { setUserVip(false) }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const url = new URL('/api/favorites', window.location.origin)
        url.searchParams.set('page', String(page))
        url.searchParams.set('size', String(size))
        if (q && q.trim()) url.searchParams.set('q', q.trim())
        const res = await fetch(url.toString(), { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        const data = res.ok && json?.success && Array.isArray(json.data) ? json.data : []
        if (mounted) setItems(data)
        const pg = json?.pagination
        if (pg && mounted) {
          setTotal(pg.total || 0)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [page, size, q])

  const markUnavailable = async (it: FavItem) => {
    try {
      const res = await fetch(`/api/favorites/${it.id}`, { method: 'PUT' })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setItems(prev => prev.map(x => x.id === it.id ? { ...x, enabled: false } : x))
      }
    } catch {}
  }

  if (userVip === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">网盘资源</h1>
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="text-muted-foreground">检测中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!userVip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">网盘资源</h1>
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="text-muted-foreground">此页面仅对VIP用户可见</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">网盘资源</h1>
        <div className="bg-card rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()) } }}
              placeholder="搜索标题或链接"
              className="px-3 py-2 border border-border rounded text-sm w-full max-w-xs"
            />
            <button className="btn btn-secondary btn-sm" onClick={() => { setPage(1); setQ(qInput.trim()) }}>搜索</button>
          </div>
          {loading ? (
            <div className="text-muted-foreground">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">暂无收藏</div>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3">
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-black hover:underline ${it.enabled ? '' : 'line-through'}`}
                    >
                      {it.title}
                    </a>
                    <button
                      onClick={() => { if (it.enabled) { setConfirmId(it.id); setConfirmStep(1) } }}
                      disabled={!it.enabled}
                      className={`px-2 py-1 text-xs rounded border ${it.enabled ? 'text-white bg-red-500 hover:bg-red-600 border-transparent' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                    >
                      不可用
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">共 {total} 条 · 第 {page} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >上一页</button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >下一页</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmModals
        id={confirmId}
        step={confirmStep}
        onContinue={() => setConfirmStep(2)}
        onCancel={() => { setConfirmId(null); setConfirmStep(0) }}
        onConfirm={async () => {
          if (confirmId != null) {
            const it = items.find(x => x.id === confirmId)
            if (it) await markUnavailable(it)
          }
          setConfirmId(null)
          setConfirmStep(0)
        }}
      />
    </div>
  )
}

function ConfirmModals({ id, step, onContinue, onCancel, onConfirm }: { id: number | null; step: 0 | 1 | 2; onContinue: () => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <ConfirmDialog
        open={id !== null && step === 1}
        title="标记不可用"
        message="确定要标记该链接不可用吗？"
        confirmText="继续"
        cancelText="取消"
        onConfirm={onContinue}
        onCancel={onCancel}
      />
      <ConfirmDialog
        open={id !== null && step === 2}
        title="再次确认"
        message="标记为不可用后将不再展示，是否继续？"
        confirmText="确认标记"
        cancelText="返回"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </>
  )
}