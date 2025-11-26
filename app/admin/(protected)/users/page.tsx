'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog'

type UserItem = { id: number; username: string; email: string; emailVerified: boolean; createdAt: string }

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [list, setList] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editUser, setEditUser] = useState<{ username: string; email: string; emailVerified: boolean; password?: string }>({ username: '', email: '', emailVerified: false })

  const [createUser, setCreateUser] = useState<{ username: string; email: string; password: string; emailVerified: boolean }>({ username: '', email: '', password: '', emailVerified: false })
  const [delId, setDelId] = useState<number | null>(null)

  const fetchList = async (p = page, s = size, query = q) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), size: String(s) })
    if (query.trim()) params.set('q', query.trim())
    const res = await fetch(`/api/admin/users?${params.toString()}`)
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      setList(data.data || [])
      const pg = data.pagination || {}; setPage(pg.page || 1); setSize(pg.size || 10); setTotal(pg.total || 0)
    } else {
      toast(data?.message || '加载失败', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchList(1, size, q) }, [])

  const startEdit = (u: UserItem) => {
    setEditingId(u.id)
    setEditUser({ username: u.username, email: u.email, emailVerified: u.emailVerified })
  }

  const saveEdit = async () => {
    if (!editingId) return
    const payload: any = { ...editUser }
    if (payload.password && payload.password.length < 6) { toast('密码至少6位', 'error'); return }
    const res = await fetch(`/api/admin/users/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('用户已更新', 'success')
      setEditingId(null)
      setEditUser({ username: '', email: '', emailVerified: false })
      fetchList(page, size, q)
    } else {
      toast(data?.message || '更新失败', 'error')
    }
  }

  const removeUser = async (id: number) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('用户已删除', 'success')
      fetchList(page, size, q)
    } else {
      toast(data?.message || '删除失败', 'error')
    }
  }

  const createNew = async () => {
    const { username, email, password } = createUser
    if (!username.trim()) { toast('用户名不能为空', 'error'); return }
    if (!email.trim()) { toast('邮箱不能为空', 'error'); return }
    if (!password || password.length < 6) { toast('密码至少6位', 'error'); return }
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createUser) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('用户已创建', 'success')
      setCreateUser({ username: '', email: '', password: '', emailVerified: false })
      fetchList(1, size, q)
    } else {
      toast(data?.message || '创建失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify之间">
        <h2 className="text-xl font-semibold text-foreground">用户管理</h2>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索用户名/邮箱" className="input flex-1" />
          <button className="btn btn-secondary" onClick={() => fetchList(1, size, q)}>搜索</button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input value={createUser.username} onChange={(e) => setCreateUser(prev => ({ ...prev, username: e.target.value }))} placeholder="用户名" className="input" />
        <input value={createUser.email} onChange={(e) => setCreateUser(prev => ({ ...prev, email: e.target.value }))} placeholder="邮箱" className="input" />
        <input type="password" value={createUser.password} onChange={(e) => setCreateUser(prev => ({ ...prev, password: e.target.value }))} placeholder="初始密码" className="input" />
        <label className="flex items-center text-sm"><input type="checkbox" checked={createUser.emailVerified} onChange={(e) => setCreateUser(prev => ({ ...prev, emailVerified: e.target.checked }))} className="mr-2" />邮箱已验证</label>
        <button className="btn btn-primary" onClick={createNew}>新增用户</button>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">用户名</th>
                  <th className="py-2 pr-4">邮箱</th>
                  <th className="py-2 pr-4">已验证</th>
                  <th className="py-2 pr-4">创建时间</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">{u.id}</td>
                    <td className="py-2 pr-4">
                      {editingId === u.id ? (
                        <input value={editUser.username} onChange={(e) => setEditUser(prev => ({ ...prev, username: e.target.value }))} className="input" />
                      ) : (
                        u.username
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === u.id ? (
                        <input value={editUser.email} onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))} className="input" />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === u.id ? (
                        <input type="checkbox" checked={editUser.emailVerified} onChange={(e) => setEditUser(prev => ({ ...prev, emailVerified: e.target.checked }))} />
                      ) : (
                        u.emailVerified ? '是' : '否'
                      )}
                    </td>
                    <td className="py-2 pr-4">{new Date(u.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input type="password" placeholder="重置密码(可选)" className="input w-40" value={editUser.password || ''} onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))} />
                          <button onClick={saveEdit} className="btn btn-primary btn-sm">保存</button>
                          <button onClick={() => { setEditingId(null); setEditUser({ username: '', email: '', emailVerified: false }) }} className="btn btn-secondary btn-sm">取消</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(u)} className="btn btn-secondary btn-sm">编辑</button>
                          <button onClick={() => setDelId(u.id)} className="btn btn-destructive btn-sm">删除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={delId !== null}
        title="删除用户"
        message="删除后不可恢复，确定要删除该用户吗？"
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={async () => { if (delId != null) { await removeUser(delId); setDelId(null) } }}
        onCancel={() => setDelId(null)}
      />

      <div className="flex items-center justify-between bg-card rounded-md shadow-sm p-3">
        <div className="text-sm text-muted-foreground">共 {total} 条，页大小
          <select
            className="input ml-2 text-center px-1"
            style={{ width: 48, display: 'inline-block', paddingLeft: 4, paddingRight: 4 }}
            value={size}
            onChange={(e) => { const s = Number(e.target.value); setSize(s); fetchList(1, s, q) }}
          >
            {[10,20,50].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchList(page - 1, size, q)}>上一页</button>
          <span className="text-sm">第 {page} / {Math.max(1, Math.ceil(total / size))} 页</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / size)} onClick={() => fetchList(page + 1, size, q)}>下一页</button>
        </div>
      </div>
    </div>
  )
}
