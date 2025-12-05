'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

type TagItem = { id: number; name: string; slug?: string }

export default function AdminTagsPage() {
  const { toast } = useToast()
  const [list, setList] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  const fetchList = async (p = page, s = size) => {
    setLoading(true)
    const res = await fetch(`/api/admin/tags?page=${p}&size=${s}`)
    const data = await res.json()
    setList(data?.data || [])
    const pg = data?.pagination
    if (pg) { setPage(pg.page || 1); setSize(pg.size || 10); setTotal(pg.total || 0) }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])

  const startEdit = (tag: TagItem) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditSlug(tag.slug || '')
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/tags/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, slug: editSlug.trim() || undefined })
    })
    const data = await res.json()
    if (data?.success) {
      setEditingId(null); setEditName(''); setEditSlug('')
      fetchList()
    } else {
      toast(data?.message || '更新失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">标签管理</h2>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">名称</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(tag => (
                  <tr key={tag.id} className="border-t">
                    <td className="py-2 pr-4">{tag.id}</td>
                    <td className="py-2 pr-4">
                      {editingId === tag.id ? (
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" />
                      ) : (
                        tag.name
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === tag.id ? (
                        <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="input" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{tag.slug || ''}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === tag.id ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="btn btn-primary btn-sm">保存</button>
                          <button onClick={() => { setEditingId(null); setEditName('') }} className="btn btn-secondary btn-sm">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(tag)} className="btn btn-secondary btn-sm">编辑</button>
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
        <div className="text-sm text-muted-foreground">共 {total} 条，页大小
          <select
            className="input ml-2 text-center px-1"
            style={{ width: 48, display: 'inline-block', paddingLeft: 4, paddingRight: 4 }}
            value={size}
            onChange={(e) => { const s = Number(e.target.value); setSize(s); fetchList(1, s) }}
          >
            {[10,20,50].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchList(page - 1, size)}>上一页</button>
          <span className="text-sm">第 {page} / {Math.max(1, Math.ceil(total / size))} 页</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / size)} onClick={() => fetchList(page + 1, size)}>下一页</button>
        </div>
      </div>

    </div>
  )
}
