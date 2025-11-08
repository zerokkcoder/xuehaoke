'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [me, setMe] = useState<{ username: string; role: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [stats, setStats] = useState<{
    totalUsers: number
    vipUsers: number
    totalResources: number
    totalOrders: number
    pendingOrders: number
    successOrders: number
    revenue: number
    totalDownloads: number
    latestOrders: { outTradeNo: string; status: string; amount: any; productName: string; createdAt: string }[]
    latestResources: { id: number; title: string; price: any; createdAt: string }[]
  } | null>(null)

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) setStats(json.data)
      } catch {}
    }
    loadStats()
  }, [])
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 py-6">
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
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">用户总数</div>
                  <div className="text-lg font-semibold text-foreground">{stats.totalUsers}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">VIP 用户</div>
                  <div className="text-lg font-semibold text-foreground">{stats.vipUsers}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">资源总数</div>
                  <div className="text-lg font-semibold text-foreground">{stats.totalResources}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">下载总数</div>
                  <div className="text-lg font-semibold text-foreground">{stats.totalDownloads}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">订单总数</div>
                  <div className="text-lg font-semibold text-foreground">{stats.totalOrders}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">待支付</div>
                  <div className="text-lg font-semibold text-foreground">{stats.pendingOrders}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">成功订单</div>
                  <div className="text-lg font-semibold text-foreground">{stats.successOrders}</div>
                </div>
                <div className="rounded border border-border bg-secondary/50 px-4 py-3">
                  <div className="text-xs text-muted-foreground">总收入（¥）</div>
                  <div className="text-lg font-semibold text-foreground">{Number(stats.revenue).toFixed(2)}</div>
                </div>
              </div>
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

          {stats && (
            <section className="bg-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">最近订单</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left px-2 py-1">订单号</th>
                      <th className="text-left px-2 py-1">商品</th>
                      <th className="text-left px-2 py-1">金额</th>
                      <th className="text-left px-2 py-1">状态</th>
                      <th className="text-left px-2 py-1">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.latestOrders.map((o, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-2 py-1 text-foreground">{o.outTradeNo}</td>
                        <td className="px-2 py-1 text-foreground">{o.productName}</td>
                        <td className="px-2 py-1 text-foreground">¥{Number(o.amount || 0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-foreground">{o.status}</td>
                        <td className="px-2 py-1 text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {stats && (
            <section className="bg-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">最近资源</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.latestResources.map((r) => (
                  <div key={r.id} className="rounded border border-border p-3">
                    <div className="text-sm font-semibold text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">价格：¥{Number(r.price || 0).toFixed(2)} · 时间：{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}