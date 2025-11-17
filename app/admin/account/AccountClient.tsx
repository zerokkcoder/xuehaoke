'use client'

import { useEffect, useState } from 'react'

export default function AccountClient() {
  const [me, setMe] = useState<{ id: number; username: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [newUsername, setNewUsername] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg('')
      try {
        const res = await fetch('/api/admin/account', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) {
          const u = json.data
          setMe({ id: u.id, username: u.username })
          setNewUsername(u.username || '')
        } else {
          setMsg(json?.message || '加载失败')
        }
      } catch (e: any) {
        setMsg(e?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername, oldPassword, newPassword })
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success) {
        setMsg('保存成功')
        setOldPassword('')
        setNewPassword('')
        if (json?.data?.username) setMe(prev => prev ? { ...prev, username: json.data.username } : prev)
      } else {
        setMsg(json?.message || '保存失败')
      }
    } catch (e: any) {
      setMsg(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 py-6">
        <div className="bg-card rounded-lg border border-border p-6 max-w-2xl">
          <h1 className="text-xl font-semibold text-foreground mb-4">个人资料</h1>
          {loading ? (
            <div>加载中...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">用户名</label>
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input w-full" placeholder="请输入新的用户名" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">当前密码</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="input w-full" placeholder="验证后才能修改密码" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">新密码</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input w-full" placeholder="输入新的密码" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '保存'}</button>
                {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}