'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, remember })
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || '登录失败')
      }
      localStorage.setItem('adminToken', data.token)
      router.push('/admin')
    } catch (err: any) {
      setError(err?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-card rounded-lg shadow-sm border p-6">
        <h1 className="text-xl font-semibold text-foreground mb-4">后台登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="输入密码"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            记住登录（30天）
          </label>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2 text-base disabled:opacity-50"
          >
            {loading ? '登录中…' : '登录管理后台'}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">该页面为演示登录界面。登录后会跳转到后台首页。</p>
      </div>
    </div>
  )
}