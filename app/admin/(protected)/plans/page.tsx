'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import ConfirmDialog from '@/app/admin/_components/ConfirmDialog'

type PlanItem = { id: number; name: string; price: any; durationDays: number; dailyDownloads: number; isPopular: boolean; features?: string[] }

export default function AdminPlansPage() {
  const { toast } = useToast()
  const [list, setList] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [delId, setDelId] = useState<number | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPlan, setEditPlan] = useState<PlanItem>({ id: 0, name: '', price: 0, durationDays: 30, dailyDownloads: 5, isPopular: false, features: [] })
  const [createPlan, setCreatePlan] = useState<PlanItem>({ id: 0, name: '', price: 0, durationDays: 30, dailyDownloads: 5, isPopular: false, features: [] })
  const [createFeaturesText, setCreateFeaturesText] = useState<string>('')
  const [editFeaturesText, setEditFeaturesText] = useState<string>('')

  const fetchList = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/plans?size=999`)
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      setList(data.data || [])
    } else {
      toast(data?.message || '加载失败', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])

  const startEdit = (p: PlanItem) => {
    setEditingId(p.id)
    setEditPlan({ ...p, price: Number(p.price || 0), features: Array.isArray(p.features) ? p.features : [] })
    setEditFeaturesText(featureStr(p.features))
  }

  const saveEdit = async () => {
    if (!editingId) return
    const payload: any = { ...editPlan, features: editPlan.features }
    const res = await fetch(`/api/admin/plans/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('计划已更新', 'success')
      setEditingId(null)
      fetchList()
    } else {
      toast(data?.message || '更新失败', 'error')
    }
  }

  const removePlan = async (id: number) => {
    const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('计划已删除', 'success')
      fetchList()
    } else {
      toast(data?.message || '删除失败', 'error')
    }
  }

  const createNew = async () => {
    const payload: any = { ...createPlan, features: createFeaturesText.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }
    if (!String(payload.name).trim()) { toast('名称不能为空', 'error'); return }
    if (Number(payload.durationDays) < 0) { toast('有效期天数不能为负（0表示永久）', 'error'); return }
    const res = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('计划已创建', 'success')
      setCreatePlan({ id: 0, name: '', price: 0, durationDays: 30, dailyDownloads: 5, isPopular: false, features: [] })
      setCreateOpen(false)
      fetchList()
    } else {
      toast(data?.message || '创建失败', 'error')
    }
  }

  const featureStr = (arr?: string[]) => Array.isArray(arr) ? arr.join('\n') : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">会员计划</h2>
        <button className="btn btn-primary" onClick={() => { setCreateFeaturesText(featureStr(createPlan.features)); setCreateOpen(true) }}>新增计划</button>
      </div>

      {createOpen && (
        <div className="fixed inset-0 bg黑/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 text-foreground">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新增会员计划</h3>
              <button onClick={() => setCreateOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">名称</label>
                  <input value={createPlan.name} onChange={(e) => setCreatePlan(prev => ({ ...prev, name: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">价格(¥)</label>
                  <input type="number" step="0.01" value={createPlan.price} onChange={(e) => setCreatePlan(prev => ({ ...prev, price: Number(e.target.value || 0) }))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">有效期(天)（0 表示永久会员）</label>
                  <input type="number" value={createPlan.durationDays} onChange={(e) => setCreatePlan(prev => ({ ...prev, durationDays: Number(e.target.value || 0) }))} className="input w-full" disabled={createPlan.durationDays === 0} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">每日下载次数</label>
                  <input type="number" value={createPlan.dailyDownloads} onChange={(e) => setCreatePlan(prev => ({ ...prev, dailyDownloads: Number(e.target.value || 0) }))} className="input w-full" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">特性（每行一条或用逗号分隔）</label>
                  <textarea rows={4} value={createFeaturesText} onChange={(e) => setCreateFeaturesText(e.target.value)} className="input w-full" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between">
                  <label className="flex items-center text-sm"><input type="checkbox" checked={createPlan.isPopular} onChange={(e) => setCreatePlan(prev => ({ ...prev, isPopular: e.target.checked }))} className="mr-2" />最受欢迎</label>
                  <label className="flex items-center text-sm"><input type="checkbox" checked={createPlan.durationDays === 0} onChange={(e) => setCreatePlan(prev => ({ ...prev, durationDays: e.target.checked ? 0 : 30 }))} className="mr-2" />永久会员</label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>取消</button>
                <button className="btn btn-primary" onClick={createNew}>确定</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <th className="py-2 pr-4">价格(¥)</th>
                  <th className="py-2 pr-4">有效期(天)</th>
                  <th className="py-2 pr-4">每日下载</th>
                  <th className="py-2 pr-4">最受欢迎</th>
                  <th className="py-2 pr-4">特性</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 pr-4">{p.id}</td>
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4">{Number(p.price || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4">{p.durationDays === 0 ? '永久' : p.durationDays}</td>
                    <td className="py-2 pr-4">{p.dailyDownloads}</td>
                    <td className="py-2 pr-4">{p.isPopular ? '是' : '否'}</td>
                    <td className="py-2 pr-4 whitespace-pre-line">{featureStr(p.features)}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(p)} className="btn btn-secondary btn-sm">编辑</button>
                        <button onClick={() => setDelId(p.id)} className="btn btn-destructive btn-sm">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editingId !== null && (
        <div className="fixed inset-0 bg黑/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full p-6 text-foreground">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">编辑会员计划</h3>
              <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">名称</label>
                  <input value={editPlan.name} onChange={(e) => setEditPlan(prev => ({ ...prev, name: e.target.value }))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">价格(¥)</label>
                  <input type="number" step="0.01" value={editPlan.price} onChange={(e) => setEditPlan(prev => ({ ...prev, price: Number(e.target.value || 0) }))} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">有效期(天)（0 表示永久会员）</label>
                  <input type="number" value={editPlan.durationDays} onChange={(e) => setEditPlan(prev => ({ ...prev, durationDays: Number(e.target.value || 0) }))} className="input w-full" disabled={editPlan.durationDays === 0} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">每日下载次数</label>
                  <input type="number" value={editPlan.dailyDownloads} onChange={(e) => setEditPlan(prev => ({ ...prev, dailyDownloads: Number(e.target.value || 0) }))} className="input w-full" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">特性（每行一条或用逗号分隔）</label>
                  <textarea rows={4} value={editFeaturesText} onChange={(e) => setEditFeaturesText(e.target.value)} className="input w-full" />
                </div>
                <div className="md:col-span-2 flex items-center justify-between">
                  <label className="flex items-center text-sm"><input type="checkbox" checked={editPlan.isPopular} onChange={(e) => setEditPlan(prev => ({ ...prev, isPopular: e.target.checked }))} className="mr-2" />最受欢迎</label>
                  <label className="flex items-center text-sm"><input type="checkbox" checked={editPlan.durationDays === 0} onChange={(e) => setEditPlan(prev => ({ ...prev, durationDays: e.target.checked ? 0 : 30 }))} className="mr-2" />永久会员</label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-secondary" onClick={() => setEditingId(null)}>取消</button>
                <button className="btn btn-primary" onClick={() => { setEditPlan(prev => ({ ...prev, features: editFeaturesText.split(/[\n,]/).map(s => s.trim()).filter(Boolean) })); saveEdit() }}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={delId !== null}
        title="删除会员计划"
        message="删除后不可恢复，确定要删除该计划吗？"
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={async () => { if (delId != null) { await removePlan(delId); setDelId(null) } }}
        onCancel={() => setDelId(null)}
      />
    </div>
  )
}
