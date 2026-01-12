'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type SiteUser = { username: string; isVip?: boolean }
type MeData = {
  id: number
  username: string
  isVip: boolean
  vipExpireAt: string | null
  vipPlanId: number | null
  vipPlanName: string | null
}

export default function ProfilePage() {
  const [localUser, setLocalUser] = useState<SiteUser | null>(null)
  const [me, setMe] = useState<MeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [recentDownloads, setRecentDownloads] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [siteConfig, setSiteConfig] = useState<{ heroImage?: string | null } | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'avatar' | 'info' | 'downloads' | 'orders'>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // 读取本地登录信息
    try {
      const raw = window.localStorage.getItem('site_user')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.username === 'string') {
          setLocalUser({ username: parsed.username, isVip: !!parsed.isVip })
          if (parsed.avatarUrl) setAvatarUrl(String(parsed.avatarUrl))
        }
      }
    } catch {}
  }, [])

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

  useEffect(() => {
    const fetchMe = async () => {
      if (!localUser?.username) { setLoading(false); return }
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/user/me', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: localUser.username }),
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) {
          setError(json?.message || '获取用户信息失败')
          setMe(null)
        } else {
          setMe(json.data)
        }
      } catch (e: any) {
        setError(e?.message || '获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
    const fetchDownloads = async () => {
      if (!localUser?.username) return
      try {
        const res = await fetch('/api/user/downloads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: localUser.username }), cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) {
          const list = Array.isArray(json.data) ? json.data : []
          setRecentDownloads(list.slice(0, 8))
        }
      } catch {}
    }
    const fetchOrders = async () => {
      if (!localUser?.username) return
      try {
        const res = await fetch('/api/user/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: localUser.username }), cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) {
          const list = Array.isArray(json.data) ? json.data : []
          setOrders(list.slice(0, 10))
        }
      } catch {}
    }
    fetchDownloads()
    fetchOrders()
  }, [localUser?.username])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        setError(json?.message || '上传失败')
        return
      }
      const url = String(json.url)
      setAvatarUrl(url)
      // 持久化到数据库的 User 表
      try {
        const saveRes = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: localUser?.username, avatarUrl: url }),
        })
        const saveJson = await saveRes.json().catch(() => ({}))
        if (!saveRes.ok || !saveJson?.success) {
          // 前端提示但不阻断本地更新
          console.warn('保存头像失败:', saveJson?.message)
        }
      } catch {}
      try {
        const raw = window.localStorage.getItem('site_user')
        if (raw) {
          const parsed = JSON.parse(raw)
          parsed.avatarUrl = url
          window.localStorage.setItem('site_user', JSON.stringify(parsed))
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message || '上传失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (!localUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">请登录后查看个人中心</h1>
          <Link href="/login" className="btn btn-accent inline-block">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Hero */}
        <section className="mb-6">
          <div className="relative w-full h-40 md:h-52 overflow-hidden card">
            <Image
              src={siteConfig?.heroImage || "/haike_hero.svg"}
              alt="Profile Hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">个人中心</h1>
                <p className="text-sm md:text-base opacity-90">欢迎你，{localUser.username}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile menu toggle */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <button
            className="px-3 py-2 card text-foreground"
            onClick={() => setMenuOpen(true)}
            aria-label="打开菜单"
          >
            打开菜单
          </button>
          <div className="text-sm text-muted-foreground">当前模块：{activeTab === 'overview' ? '概览' : activeTab === 'avatar' ? '头像设置' : activeTab === 'info' ? '基本信息' : activeTab === 'downloads' ? '最近下载' : '订单记录'}</div>
        </div>

        {/* Two-column layout: left menu, right content */}
        <div className="flex gap-6">
          {/* Left menu */}
          <aside className="hidden md:block w-56 md:w-64 shrink-0 sticky top-20">
            <div className="card p-2">
              {(['overview','avatar','info','downloads','orders'] as const).map(key => (
                <button
                  key={key}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === key ? 'bg-violet-50 text-violet-600' : 'text-foreground hover:bg-secondary'}`}
                  onClick={() => setActiveTab(key)}
                >
                  {key === 'overview' ? '概览' : key === 'avatar' ? '头像设置' : key === 'info' ? '基本信息' : key === 'downloads' ? '最近下载' : '订单记录'}
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile drawer menu */}
          {menuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
              <aside className="absolute left-0 top-0 h-full w-64 card rounded-none border-r border-border p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">菜单</span>
                  <button className="px-2 py-1 rounded-md bg-secondary text-foreground" onClick={() => setMenuOpen(false)} aria-label="关闭菜单">关闭</button>
                </div>
                {(['overview','avatar','info','downloads','orders'] as const).map(key => (
                  <button
                    key={key}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeTab === key ? 'bg-pink-50 text-pink-600' : 'text-foreground hover:bg-secondary'}`}
                    onClick={() => { setActiveTab(key); setMenuOpen(false) }}
                  >
                    {key === 'overview' ? '概览' : key === 'avatar' ? '头像设置' : key === 'info' ? '基本信息' : key === 'downloads' ? '最近下载' : '订单记录'}
                  </button>
                ))}
              </aside>
            </div>
          )}

          {/* Right content */}
          <section className="flex-1">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 基本信息卡片（概览） */}
                <div className="card p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-3">基本信息</h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>用户名：<span className="text-foreground font-medium">{localUser.username}</span></div>
                    {loading ? (
                      <div>加载中...</div>
                    ) : error ? (
                      <div className="text-destructive">{error}</div>
                    ) : me ? (
                      <>
                        <div>VIP：<span className="text-foreground">{me.isVip ? '已开通' : '未开通'}</span></div>
                        {me.isVip && (
                          <div>会员计划：<span className="text-foreground">{me.vipPlanName || '—'}</span></div>
                        )}
                        {me.isVip && (
                          <div>到期时间：<span className="text-foreground">{me.vipExpireAt ? new Date(me.vipExpireAt).toLocaleString() : '—'}</span></div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
                {/* 最近下载简版（概览） */}
                <div className="card p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-3">最近下载</h2>
                  {recentDownloads.length === 0 ? (
                    <div className="text-sm text-muted-foreground">暂无记录</div>
                  ) : (
                    <div className="space-y-2">
                      {recentDownloads.slice(0, 4).map((d) => (
                        <div key={`${d.resourceId}-${d.accessedAt}`} className="flex items-center gap-3">
                          <div className="relative w-16 h-12 overflow-hidden rounded bg-white">
                            <Image src={d.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=320&h=240&fit=crop'} alt={d.title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/resource/${d.resourceId}`} className="block text-sm font-medium text-foreground hover:underline truncate">{d.title}</Link>
                            <div className="text-xs text-muted-foreground truncate">{new Date(d.accessedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                      <Link href="/downloads" className="text-sm text-primary hover:underline">查看全部</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'avatar' && (
              <div className="card p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">我的头像</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-border bg-white">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">无头像</div>
                    )}
                  </div>
                  <div>
                    <label className="btn btn-primary inline-block cursor-pointer">
                      {uploading ? '上传中...' : '更换头像'}
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">支持 PNG/JPG/WebP，大小 ≤ 2MB</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'info' && (
              <div className="card p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">基本信息</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>用户名：<span className="text-foreground font-medium">{localUser.username}</span></div>
                  {loading ? (
                    <div>加载中...</div>
                  ) : error ? (
                    <div className="text-destructive">{error}</div>
                  ) : me ? (
                    <>
                      <div>邮箱：<span className="text-foreground">（隐私保护，未显示）</span></div>
                      <div>VIP：<span className="text-foreground">{me.isVip ? '已开通' : '未开通'}</span></div>
                      {me.isVip && (
                        <div>会员计划：<span className="text-foreground">{me.vipPlanName || '—'}</span></div>
                      )}
                      {me.isVip && (
                        <div>到期时间：<span className="text-foreground">{me.vipExpireAt ? new Date(me.vipExpireAt).toLocaleString() : '—'}</span></div>
                      )}
                    </>
                  ) : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/vip" className="rounded-full bg-yellow-400 text-black px-3 py-1 text-xs md:text-sm hover:opacity-90">升级VIP</Link>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">找回密码</Link>
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="card p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">我的下载</h2>
                <p className="text-sm text-muted-foreground mb-2">查看你的下载记录，以及每日下载额度。</p>
                <div className="flex items-center gap-2">
                  <Link href="/downloads" className="btn btn-primary">打开下载记录</Link>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {me?.isVip ? (
                    <span>会员每日下载额度由你的计划决定（如在 VIP 页面展示）。</span>
                  ) : (
                    <span>非会员每日下载额度有限，建议升级 VIP 获取更高配额。</span>
                  )}
                </div>
                {recentDownloads.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">最近下载</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recentDownloads.map((d, idx) => (
                        <div key={`${d.resourceId}-${d.accessedAt}`} className="flex items-center gap-3 p-2 border border-border rounded-md">
                          <div className="relative w-16 h-12 overflow-hidden rounded bg-white">
                            <Image src={d.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=320&h=240&fit=crop'} alt={d.title} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/resource/${d.resourceId}`} className="block text-sm font-medium text-foreground hover:underline truncate">{d.title}</Link>
                            <div className="text-xs text-muted-foreground truncate">{new Date(d.accessedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="card p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">订单记录</h2>
                {orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无订单</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="text-left py-2 pr-4">订单号</th>
                          <th className="text-left py-2 pr-4">类型</th>
                          <th className="text-left py-2 pr-4">商品</th>
                          <th className="text-left py-2 pr-4">金额</th>
                          <th className="text-left py-2 pr-4">状态</th>
                          <th className="text-left py-2 pr-4">创建时间</th>
                          <th className="text-left py-2 pr-4">支付时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-b border-border">
                            <td className="py-2 pr-4 truncate max-w-[180px]">{o.outTradeNo}</td>
                            <td className="py-2 pr-4">{o.orderType}</td>
                            <td className="py-2 pr-4 truncate max-w-[240px]">{o.productName}</td>
                            <td className="py-2 pr-4">¥{o.amount}</td>
                            <td className="py-2 pr-4">{o.status}</td>
                            <td className="py-2 pr-4">{new Date(o.createdAt).toLocaleString()}</td>
                            <td className="py-2 pr-4">{o.paidAt ? new Date(o.paidAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}