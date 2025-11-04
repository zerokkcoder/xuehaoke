'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [me, setMe] = useState<{ username: string; role: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // 客户端守卫（与中间件双保险）：兼容旧的 localStorage.adminToken
  useEffect(() => {
    // 客户端状态展示：调用 /api/admin/me
    const loadMe = async () => {
      try {
        const res = await fetch('/api/admin/me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setMe({ username: data.user.username, role: data.user.role })
          } else {
            setMe(null)
          }
        } else {
          setMe(null)
        }
      } catch {
        setMe(null)
      } finally {
        setAuthChecked(true)
      }
    }
    loadMe()
  }, [])
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl px-4 py-6">
        <div className="space-y-6">
          <section className="bg-card rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">仪表盘</h2>
            {authChecked ? (
              me ? (
                <p className="text-sm text-muted-foreground">欢迎，{me.username}（{me.role}）。祝你工作顺利！</p>
              ) : (
                <p className="text-sm text-red-600">未登录，部分功能不可用。</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">状态检测中…</p>
            )}
          </section>

          <section className="bg-card rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">系统信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded bg-secondary/50 px-4 py-3">
                <div className="text-muted-foreground">当前环境</div>
                <div className="text-foreground">开发环境</div>
              </div>
              <div className="rounded bg-secondary/50 px-4 py-3">
                <div className="text-muted-foreground">版本</div>
                <div className="text-foreground">v0.1.0</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}