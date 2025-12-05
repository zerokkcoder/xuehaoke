'use client'

import React, { useEffect, useState } from 'react'
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog'
import { useToast } from '@/components/Toast'

export default function AdminCategoriesPage() {
  const [list, setList] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sort, setSort] = useState<number | ''>('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editSort, setEditSort] = useState<number | ''>('')
  const [delId, setDelId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [subList, setSubList] = useState<{ id: number; name: string }[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subName, setSubName] = useState('')
  const [subSlug, setSubSlug] = useState('')
  const [subSort, setSubSort] = useState<number | ''>('')
  const [subEditId, setSubEditId] = useState<number | null>(null)
  const [subEditName, setSubEditName] = useState('')
  const [subEditSlug, setSubEditSlug] = useState('')
  const [subEditSort, setSubEditSort] = useState<number | ''>('')
  const { toast } = useToast()
  const [subDelId, setSubDelId] = useState<number | null>(null)
  const [subDelStep, setSubDelStep] = useState<0 | 1 | 2>(0)

  const fetchList = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setList(data?.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])

  const addCategory = async () => {
    if (!name.trim()) return
    const res = await fetch('/api/admin/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug: slug.trim() || undefined, sort: sort === '' ? 0 : Number(sort) })
    })
    const data = await res.json()
    if (data.success) {
      setName('')
      setSlug('')
      setSort('')
      fetchList()
    }
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch(`/api/admin/categories/${editingId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName, slug: editSlug.trim() || undefined, sort: editSort === '' ? undefined : Number(editSort) })
    })
    const data = await res.json()
    if (data.success) {
      setEditingId(null)
      setEditName('')
      setEditSlug('')
      setEditSort('')
      fetchList()
    }
  }

  const fetchSub = async (catId: number) => {
    setSubLoading(true)
    const res = await fetch(`/api/admin/subcategories?categoryId=${catId}`)
    const data = await res.json()
    setSubList(data?.data || [])
    setSubLoading(false)
  }

  const addSub = async (catId: number) => {
    if (!subName.trim()) return
    if (!subSlug.trim()) { toast('Slug不能为空', 'error'); return }
    const res = await fetch('/api/admin/subcategories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: catId, name: subName, slug: subSlug.trim() || undefined, sort: subSort === '' ? 0 : Number(subSort) })
    })
    const data = await res.json()
    if (data.success) {
      setSubName('')
      setSubSlug('')
      setSubSort('')
      fetchSub(catId)
    }
  }

  const saveSubEdit = async () => {
    if (!subEditId) return
    if (!subEditName.trim()) return
    if (!subEditSlug.trim()) { toast('Slug不能为空', 'error'); return }
    const res = await fetch(`/api/admin/subcategories/${subEditId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: subEditName, slug: subEditSlug.trim() || undefined, sort: subEditSort === '' ? undefined : Number(subEditSort) })
    })
    const data = await res.json()
    if (data.success) {
      setSubEditId(null)
      setSubEditName('')
      setSubEditSlug('')
      setSubEditSort('')
      if (expandedId) fetchSub(expandedId)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">分类管理</h2>

      <div className="bg-card rounded-lg shadow-sm p-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入分类名称"
          className="input flex-1"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="可选：Slug"
          className="input flex-1"
        />
        <input
          type="number"
          value={sort}
          onChange={(e) => setSort(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="排序值"
          className="input flex-1"
        />
        <button onClick={addCategory} className="btn btn-primary">新增</button>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">名称</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">排序值</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(c => (
                  <React.Fragment key={c.id}>
                  <tr className="border-t">
                    <td className="py-2 pr-4">
                      {editingId === c.id ? (
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input" />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === c.id ? (
                        <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="input" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{(c as any).slug || ''}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === c.id ? (
                        <input type="number" value={editSort} onChange={(e) => setEditSort(e.target.value === '' ? '' : Number(e.target.value))} className="input w-24" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{(c as any).sort ?? 0}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === c.id ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="btn btn-primary btn-sm">保存</button>
                          <button onClick={() => { setEditingId(null); setEditName(''); setEditSort('') }} className="btn btn-secondary btn-sm">取消</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(c.id); setEditName(c.name); setEditSlug((c as any).slug || ''); setEditSort((c as any).sort ?? 0) }} className="btn btn-secondary btn-sm">编辑</button>
                          <button onClick={() => { setExpandedId(prev => { const next = prev === c.id ? null : c.id; if (next) fetchSub(next); return next }) }} className="btn btn-secondary btn-sm">子分类</button>
                          <button onClick={() => setDelId(c.id)} className="btn btn-destructive btn-sm">删除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr>
                      <td colSpan={3} className="bg-secondary/40 p-3">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="新增子分类" className="input flex-1" />
                            <input value={subSlug} onChange={(e) => setSubSlug(e.target.value)} placeholder="可选：Slug" className="input flex-1" />
                            <input type="number" value={subSort} onChange={(e) => setSubSort(e.target.value === '' ? '' : Number(e.target.value))} placeholder="排序值" className="input flex-1" />
                            <button onClick={() => addSub(c.id)} className="btn btn-primary btn-sm">新增</button>
                          </div>
                          {subLoading ? (
                            <div className="text-xs text-muted-foreground">子分类加载中…</div>
                          ) : (
                            <div className="space-y-2">
                              {subList.map(sc => (
                                <div key={sc.id} className="flex items-center justify-between p-2 rounded bg-card shadow-sm">
                                  <div className="flex-1">
                                    {subEditId === sc.id ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <input value={subEditName} onChange={(e) => setSubEditName(e.target.value)} className="input" />
                                        <input value={subEditSlug} onChange={(e) => setSubEditSlug(e.target.value)} className="input" placeholder="Slug" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-foreground">{sc.name}</span>
                                        <span className="text-xs text-muted-foreground">{(sc as any).slug || ''}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subEditId === sc.id ? (
                                      <>
                                        <button onClick={saveSubEdit} className="btn btn-primary btn-sm ml-2">保存</button>
                                        <button onClick={() => { setSubEditId(null); setSubEditName(''); setSubEditSort('') }} className="btn btn-secondary btn-sm">取消</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setSubEditId(sc.id); setSubEditName(sc.name); setSubEditSlug((sc as any).slug || ''); setSubEditSort((sc as any).sort ?? 0) }} className="btn btn-secondary btn-sm">编辑</button>
                                        <button
                                          onClick={() => { setSubDelId(sc.id); setSubDelStep(1) }}
                                          className="btn btn-destructive btn-sm"
                                        >
                                          删除
                                        </button>
                                      </>
                                    )}
                                    <div className="ml-4 text-xs text-muted-foreground">排序值：{(sc as any).sort ?? 0}</div>
                                    {subEditId === sc.id && (
                                      <input type="number" value={subEditSort} onChange={(e) => setSubEditSort(e.target.value === '' ? '' : Number(e.target.value))} className="input flex-1" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={delId !== null}
        title="删除分类"
        message="删除后不可恢复，确定要删除该分类吗？"
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={async () => {
          if (delId == null) return
          const res = await fetch(`/api/admin/categories/${delId}`, { method: 'DELETE' })
          let ok = res.ok
          let msg = ''
          try {
            const data = await res.json()
            ok = ok && !!data?.success
            msg = data?.message || ''
          } catch {}
          if (!ok) {
            toast(msg || '该分类或其子分类存在关联资源，禁止删除', 'error')
            setDelId(null)
            return
          }
          toast('分类已删除', 'success')
          setDelId(null)
          fetchList()
        }}
        onCancel={() => setDelId(null)}
      />

      <ConfirmDialog
        open={subDelId !== null && subDelStep === 1}
        title="删除子分类"
        message="确定要删除该子分类吗？"
        confirmText="继续"
        cancelText="取消"
        onConfirm={() => setSubDelStep(2)}
        onCancel={() => { setSubDelId(null); setSubDelStep(0) }}
      />
      <ConfirmDialog
        open={subDelId !== null && subDelStep === 2}
        title="再次确认"
        message="删除后不可恢复，是否继续？"
        confirmText="确认删除"
        cancelText="返回"
        onConfirm={async () => {
          if (subDelId == null) return
          const res = await fetch(`/api/admin/subcategories/${subDelId}`, { method: 'DELETE' })
          let ok = res.ok
          let msg = ''
          try {
            const data = await res.json()
            ok = ok && !!data?.success
            msg = data?.message || ''
          } catch {}
          if (!ok) {
            toast(msg || '该子分类存在关联资源，禁止删除', 'error')
            setSubDelId(null)
            setSubDelStep(0)
            return
          }
          const catId = expandedId
          setSubDelId(null)
          setSubDelStep(0)
          if (catId) fetchSub(catId)
          toast('子分类已删除', 'success')
        }}
        onCancel={() => setSubDelStep(1)}
      />

    </div>
  )
}
