'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

type FavItem = { id: number; title: string; url: string; enabled: boolean; createdAt?: string }

export default function AdminFavoritesPage() {
  const { toast } = useToast()
  const [list, setList] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newEnabled, setNewEnabled] = useState(true)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)

  const fetchList = async (p = page, s = size, query = q) => {
    setLoading(true)
    const res = await fetch(`/api/admin/favorites?page=${p}&size=${s}&q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setList(data?.data || [])
    const pg = data?.pagination
    if (pg) { setPage(pg.page || 1); setSize(pg.size || 10); setTotal(pg.total || 0) }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])

  const createItem = async () => {
    if (!newTitle.trim() || !newUrl.trim()) { toast('标题和链接不能为空', 'error'); return }
    const res = await fetch('/api/admin/favorites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), url: newUrl.trim(), enabled: newEnabled })
    })
    const data = await res.json()
    if (data?.success) {
      setNewTitle(''); setNewUrl(''); setNewEnabled(true)
      fetchList()
    } else {
      toast(data?.message || '创建失败', 'error')
    }
  }

  const startEdit = (it: FavItem) => {
    setEditingId(it.id)
    setEditTitle(it.title)
    setEditUrl(it.url)
    setEditEnabled(!!it.enabled)
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/favorites/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim(), url: editUrl.trim(), enabled: editEnabled })
    })
    const data = await res.json()
    if (data?.success) {
      setEditingId(null); setEditTitle(''); setEditUrl(''); setEditEnabled(true)
      fetchList()
    } else {
      toast(data?.message || '更新失败', 'error')
    }
  }

  const toggleEnabled = async (it: FavItem) => {
    const res = await fetch(`/api/admin/favorites/${it.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !it.enabled })
    })
    const data = await res.json()
    if (data?.success) { fetchList() } else { toast(data?.message || '更新失败', 'error') }
  }

  const deleteItem = async (it: FavItem) => {
    if (!confirm('确认删除该收藏吗？')) return
    const res = await fetch(`/api/admin/favorites/${it.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({ success: res.ok }))
    if (data?.success) { fetchList() } else { toast(data?.message || '删除失败', 'error') }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">收藏管理</h2>

      <div className="bg-card rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground">标题</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input flex-1" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground">链接</label>
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="input flex-1" />
          </div>
          <button onClick={createItem} className="btn btn-primary">新增收藏</button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索标题或链接" className="input flex-1" />
              <button onClick={() => fetchList(1, size, q)} className="btn btn-secondary">搜索</button>
            </div>
            <div className="text-sm text-muted-foreground">共 {total} 条</div>
          </div>

          {loading ? (
            <div className="text-sm text-muted-foreground">加载中…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">标题</th>
                  <th className="py-2 pr-4">链接</th>
                  <th className="py-2 pr-4">启用</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(it => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2 pr-4">{it.id}</td>
                    <td className="py-2 pr-4">
                      {editingId === it.id ? (
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input w-48" />
                      ) : (
                        it.title
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === it.id ? (
                        <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="input w-full" />
                      ) : (
                        <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{it.url}</a>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === it.id ? (
                        <input type="checkbox" checked={editEnabled} onChange={(e) => setEditEnabled(e.target.checked)} />
                      ) : (
                        it.enabled ? '是' : '否'
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === it.id ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="btn btn-primary btn-sm">保存</button>
                          <button onClick={() => { setEditingId(null); setEditTitle(''); setEditUrl(''); setEditEnabled(true) }} className="btn btn-secondary btn-sm">取消</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(it)} className="btn btn-secondary btn-sm">编辑</button>
                          <button onClick={() => toggleEnabled(it)} className="btn btn-secondary btn-sm">{it.enabled ? '禁用' : '启用'}</button>
                          <button onClick={() => deleteItem(it)} className="btn btn-danger btn-sm">删除</button>
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

      <div className="flex items-center justify-between bg-card rounded-md shadow-sm p-3">
        <div className="text-sm text-muted-foreground">页大小
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