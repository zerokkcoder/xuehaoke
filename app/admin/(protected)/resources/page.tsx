'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useToast } from '@/components/Toast'
import MarkdownIt from 'markdown-it'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog'

type ResItem = {
  id: number
  cover?: string | null
  title: string
  content: string
  price?: any
  downloadCount: number
  viewCount: number
  hotScore: number
  category?: { id: number; name: string } | null
  subcategory?: { id: number; name: string } | null
  tags: { id: number; name: string }[]
  downloads: { id: number; url: string; code?: string | null }[]
}

type CatItem = { id: number; name: string; sort?: number }
type SubItem = { id: number; name: string; sort?: number }

function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[96%] max-w-2xl bg-card rounded-lg shadow-xl ring-1 ring-border">
        <div className="px-4 pt-4 pb-2 border-b"><h3 className="text-lg font-semibold text-foreground">{title}</h3></div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function renderMd(md: string) {
  let html = md
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

function MarkdownEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const mdParser = useMemo(() => new MarkdownIt(), [])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <textarea
        className="input w-full h-[360px] resize-vertical"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在此输入 Markdown 内容"
      />
      <div
        className="prose max-w-none p-3 rounded border bg-background overflow-auto h-[360px]"
        dangerouslySetInnerHTML={{ __html: mdParser.render(value || '') }}
      />
    </div>
  )
}

export default function AdminResourcesPage() {
  const { toast } = useToast()
  const [list, setList] = useState<ResItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [cats, setCats] = useState<CatItem[]>([])
  const [subs, setSubs] = useState<SubItem[]>([])
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [cover, setCover] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const contentRef = useRef<string>('')
  const [mdPreview, setMdPreview] = useState(false)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [subcategoryId, setSubcategoryId] = useState<number | ''>('')
  const [tagsInput, setTagsInput] = useState('')
  const [dlUrl, setDlUrl] = useState('')
  const [dlCode, setDlCode] = useState('')

  const [delId, setDelId] = useState<number | null>(null)
  const [delStep, setDelStep] = useState<0 | 1 | 2>(0)

  const previewHtml = useMemo(() => ({ __html: renderMd(content) }), [content])

  const fetchList = async (p = page, s = size, query = q) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), size: String(s) })
    if (query && query.trim()) params.set('q', query.trim())
    const res = await fetch(`/api/admin/resources?` + params.toString())
    const data = await res.json()
    setList(data?.data || [])
    const pg = data?.pagination
    if (pg) { setPage(pg.page || 1); setSize(pg.size || 10); setTotal(pg.total || 0) }
    setLoading(false)
  }

  const fetchCats = async () => {
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCats(data?.data || [])
  }

  const fetchSubs = async (cid: number) => {
    const res = await fetch(`/api/admin/subcategories?categoryId=${cid}`)
    const data = await res.json()
    setSubs(data?.data || [])
  }

  useEffect(() => { fetchList(); fetchCats() }, [])

  useEffect(() => {
    setSubcategoryId('')
    if (categoryId && typeof categoryId === 'number') fetchSubs(categoryId)
    else setSubs([])
  }, [categoryId])

  useEffect(() => {
    if (!subs.length) setSubcategoryId('')
  }, [subs])

  const openCreate = () => {
    setIsEditing(false); setEditingId(null)
    setCover(''); setTitle(''); setContent(''); setMdPreview(false)
    contentRef.current = ''
    setCategoryId(''); setSubcategoryId(''); setTagsInput('')
    setPrice('');
    setDlUrl(''); setDlCode(''); setModalOpen(true)
  }

  const openEdit = (r: ResItem) => {
    setIsEditing(true); setEditingId(r.id)
    setCover(r.cover || '')
    setTitle(r.title)
    setContent(r.content)
    setMdPreview(false)
    contentRef.current = r.content
    setCategoryId(r.category?.id || '')
    setSubcategoryId(r.subcategory?.id || '')
    setTagsInput(r.tags.map(t => t.name).join(','))
    const firstDl = r.downloads[0]
    setDlUrl(firstDl?.url || '')
    setDlCode(firstDl?.code || '')
    setPrice((r as any).price ?? 0)
    setModalOpen(true)
  }

  const submitForm = async () => {
    const payload: any = {
      cover: cover || null,
      title, content: contentRef.current,
      price: price === '' ? 0 : Number(price),
      categoryId: typeof categoryId === 'number' ? categoryId : undefined,
      subcategoryId: typeof subcategoryId === 'number' ? subcategoryId : null,
      tags: tagsInput.split(',').map(s => s.trim()).filter(Boolean),
      download: { url: dlUrl, code: dlCode || null }
    }
    const url = isEditing && editingId ? `/api/admin/resources/${editingId}` : '/api/admin/resources'
    const method = isEditing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (data.success) {
      setModalOpen(false)
      fetchList()
    } else {
      toast(data.message || '保存失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">资源管理</h2>
        <div className="flex items-center gap-2">
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQ(qInput.trim()); fetchList(1, size, qInput.trim()) } }}
            placeholder="搜索标题/内容/标签/链接"
            className="input"
            style={{ width: 260 }}
          />
          <button className="btn btn-secondary" onClick={() => { setPage(1); setQ(qInput.trim()); fetchList(1, size, qInput.trim()) }}>搜索</button>
          <button onClick={openCreate} className="btn btn-primary">新增资源</button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">加载中…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">封面</th>
                  <th className="py-2 pr-4">标题</th>
                  <th className="py-2 pr-4">价格</th>
                  <th className="py-2 pr-4">分类</th>
                  <th className="py-2 pr-4">子分类</th>
                  
                  <th className="py-2 pr-4">标签</th>
                  <th className="py-2 pr-4">下载信息</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 pr-4">
                      {r.cover ? <img src={r.cover} alt="cover" className="w-14 h-14 object-cover rounded" /> : <span className="text-xs text-muted-foreground">无</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <Link href={`/resource/${r.id}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary truncate inline-block max-w-[280px]">
                        {r.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{formatPrice(Number((r as any).price ?? 0))}</td>
                    <td className="py-2 pr-4">{r.category?.name || '-'}</td>
                    <td className="py-2 pr-4">{r.subcategory?.name || '-'}</td>
                    
                    <td className="py-2 pr-4">
                      {r.tags.length ? r.tags.map(t => (<span key={t.id} className="inline-block px-2 py-1 text-xs bg-secondary rounded mr-1">{t.name}</span>)) : <span className="text-xs text-muted-foreground">无</span>}
                    </td>
                    <td className="py-2 pr-4">
                      {r.downloads.length ? (
                        <span className="text-xs text-muted-foreground truncate inline-block max-w-[160px]">{r.downloads[0].url}{r.downloads[0].code ? ` / ${r.downloads[0].code}` : ''}</span>
                      ) : <span className="text-xs text-muted-foreground">无</span>}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>编辑</button>
                        <button className="btn btn-destructive btn-sm" onClick={() => { setDelId(r.id); setDelStep(1) }}>删除</button>
                      </div>
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

      <Modal open={modalOpen} title={isEditing ? '编辑资源' : '新增资源'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">封面上传</label>
            <div className="flex items-center gap-3 mt-2">
              {cover ? (
                <img src={cover} alt="cover" className="w-16 h-16 object-cover rounded border" />
              ) : (
                <span className="text-xs text-muted-foreground">未选择图片</span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const allowed = ['image/png','image/jpeg','image/webp']
                  if (!allowed.includes(file.type)) { toast('仅支持 png/jpg/webp', 'error'); return }
                  const prevCover = cover
                  if (file.size > 2 * 1024 * 1024) {
                    const bitmap = await createImageBitmap(file)
                    const maxW = 1280, maxH = 1280
                    let { width, height } = bitmap
                    const ratio = Math.min(1, maxW / width, maxH / height)
                    const targetW = Math.round(width * ratio)
                    const targetH = Math.round(height * ratio)
                    const canvas = document.createElement('canvas')
                    canvas.width = targetW; canvas.height = targetH
                    const ctx = canvas.getContext('2d')!
                    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
                    const outType = file.type
                    const quality = outType === 'image/jpeg' || outType === 'image/webp' ? 0.8 : undefined
                    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, outType, quality))
                    if (!blob) { toast('压缩失败', 'error'); return }
                    if (blob.size > 2 * 1024 * 1024) { toast('压缩后仍超过 2MB，请手动压缩', 'error'); return }
                    const fd = new FormData()
                    fd.append('file', new File([blob], file.name.replace(/\.[^.]+$/, '') + (outType === 'image/png' ? '.png' : outType === 'image/webp' ? '.webp' : '.jpg'), { type: outType }))
                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data?.success && data.url) {
                      setCover(data.url)
                      if (prevCover && prevCover.startsWith('/uploads/') && prevCover !== data.url) {
                        try {
                          const del = await fetch(`/api/upload?url=${encodeURIComponent(prevCover)}`, { method: 'DELETE' })
                          const delRes = await del.json()
                          if (!delRes?.success) {
                            toast(delRes?.message || '旧封面删除失败', 'error')
                          }
                        } catch {}
                      }
                    }
                    else toast(data?.message || '上传失败', 'error')
                  } else {
                    const fd = new FormData(); fd.append('file', file)
                    const res = await fetch('/api/upload', { method: 'POST', body: fd })
                    const data = await res.json()
                    if (data?.success && data.url) {
                      setCover(data.url)
                      if (prevCover && prevCover.startsWith('/uploads/') && prevCover !== data.url) {
                        try {
                          const del = await fetch(`/api/upload?url=${encodeURIComponent(prevCover)}`, { method: 'DELETE' })
                          const delRes = await del.json()
                          if (!delRes?.success) {
                            toast(delRes?.message || '旧封面删除失败', 'error')
                          }
                        } catch {}
                      }
                    }
                    else toast(data?.message || '上传失败', 'error')
                  }
                }}
              />
              {cover && cover.startsWith('/uploads/') && (
                <button
                  type="button"
                  className="btn btn-destructive btn-sm"
                  onClick={async () => {
                    const res = await fetch(`/api/upload?url=${encodeURIComponent(cover)}`, { method: 'DELETE' })
                    const data = await res.json()
                    if (data?.success) {
                      setCover('')
                      toast('封面已删除', 'success')
                    } else {
                      toast(data?.message || '删除封面失败', 'error')
                    }
                  }}
                >删除封面</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">标题</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">价格</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} className="input w-full" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">一级分类</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))} className="input w-full">
                <option value="">请选择</option>
                {cats.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">二级分类（可空）</label>
              <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value === '' ? '' : Number(e.target.value))} className="input w-full" disabled={!categoryId || subs.length === 0}>
                <option value="">无</option>
                {subs.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">标签（逗号分隔）</label>
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="input w-full" placeholder="如：React, 教程, 前端" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">下载链接</label>
              <input value={dlUrl} onChange={(e) => setDlUrl(e.target.value)} className="input w-full" placeholder="https://..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">提取码（可空）</label>
              <input value={dlCode} onChange={(e) => setDlCode(e.target.value)} className="input w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">内容（Markdown）</label>
              <div className="flex gap-2">
                <span className="text-xs text-muted-foreground">使用富文本编辑器</span>
              </div>
            </div>
            <div className="mt-2">
              <MarkdownEditor key={editingId ?? (modalOpen ? 'create' : 'closed')} value={content} onChange={(v) => { setContent(v); contentRef.current = v }} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
            <button className="btn btn-primary" onClick={submitForm}>{isEditing ? '保存' : '创建'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={delId !== null && delStep === 1}
        title="删除资源"
        message="确定要删除该资源吗？"
        confirmText="继续"
        cancelText="取消"
        onConfirm={() => setDelStep(2)}
        onCancel={() => { setDelId(null); setDelStep(0) }}
      />
      <ConfirmDialog
        open={delId !== null && delStep === 2}
        title="再次确认"
        message="删除后不可恢复，是否继续？"
        confirmText="确认删除"
        cancelText="返回"
        onConfirm={async () => {
          if (delId == null) return
          const res = await fetch(`/api/admin/resources/${delId}`, { method: 'DELETE' })
          const data = await res.json().catch(() => ({}))
          if (data?.success) {
            setDelId(null); setDelStep(0); fetchList()
          }
        }}
        onCancel={() => setDelStep(1)}
      />
    </div>
  )
}
