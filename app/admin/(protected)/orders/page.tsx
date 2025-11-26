'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

type OrderRow = {
  id: number
  userId: number | null
  outTradeNo: string
  tradeNo?: string | null
  orderType: string
  productId: number
  productName: string
  amount: any
  status: string
  payChannel: string
  createdAt: string
  updatedAt: string
  paidAt?: string | null
}

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [list, setList] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const fetchList = async (p = page, s = size, query = q, st = status) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), size: String(s) })
    if (query.trim()) params.set('q', query.trim())
    if (st.trim()) params.set('status', st.trim())
    const res = await fetch(`/api/admin/orders?${params.toString()}`)
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      setList(data.data || [])
      const pg = data.pagination || {}; setPage(pg.page || 1); setSize(pg.size || 10); setTotal(pg.total || 0)
    } else {
      toast(data?.message || '加载失败', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchList(1, size, q, status) }, [])

  const queryStatus = async (outTradeNo: string) => {
    const res = await fetch('/api/admin/orders/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outTradeNo }) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast(`查询成功：${data.data?.status || 'UNKNOWN'}`, 'success')
      fetchList(page, size, q, status)
    } else {
      toast(data?.message || '查询失败', 'error')
    }
  }

  const updateStatus = async (id: number, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.success) {
      toast('订单状态已更新', 'success')
      setList(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    } else {
      toast(data?.message || '更新失败', 'error')
    }
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending': return '待支付'
      case 'success': return '已支付'
      case 'closed': return '已关闭'
      case 'failed': return '失败'
      default: return s
    }
  }

  const statusClass = (s: string) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      default: return ''
    }
  }

  const orderTypeLabel = (t: string) => {
    switch (t) {
      case 'member': return '购买会员'
      case 'course': return '购买课程'
      default: return t
    }
  }

  const payChannelLabel = (c: string) => {
    switch (c) {
      case 'alipay': return '支付宝'
      case 'wechat': return '微信支付'
      default: return c
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">订单管理</h2>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索订单号/产品名/类型" className="input flex-1" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" style={{ width: 140 }}>
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="success">已支付</option>
            <option value="closed">已关闭</option>
            <option value="failed">失败</option>
          </select>
          <button className="btn btn-secondary" onClick={() => fetchList(1, size, q, status)}>搜索</button>
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
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">订单号</th>
                  <th className="py-2 pr-4">流水号</th>
                  <th className="py-2 pr-4">类型</th>
                  <th className="py-2 pr-4">产品ID</th>
                  <th className="py-2 pr-4">产品名称</th>
                  <th className="py-2 pr-4">金额(¥)</th>
                  <th className="py-2 pr-4">状态</th>
                  <th className="py-2 pr-4">支付渠道</th>
                  <th className="py-2 pr-4">创建时间</th>
                  <th className="py-2 pr-4">支付时间</th>
                  <th className="py-2 pr-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="py-2 pr-4">{o.id}</td>
                    <td className="py-2 pr-4">{o.outTradeNo}</td>
                    <td className="py-2 pr-4">{o.tradeNo || '-'}</td>
                    <td className="py-2 pr-4">{orderTypeLabel(o.orderType)}</td>
                    <td className="py-2 pr-4">{o.productId}</td>
                    <td className="py-2 pr-4 truncate max-w-[220px]">{o.productName}</td>
                    <td className="py-2 pr-4">{Number(o.amount || 0).toFixed(2)}</td>
                    <td className="py-2 pr-4">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`input ${statusClass(o.status)}`}
                        style={{ width: 120 }}
                      >
                        {['pending','success','closed','failed'].map(s => (
                          <option key={s} value={s}>{statusLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">{payChannelLabel(o.payChannel)}</td>
                    <td className="py-2 pr-4">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{o.paidAt ? new Date(o.paidAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => queryStatus(o.outTradeNo)}>查询状态</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items中心 justify-between bg-card rounded-md shadow-sm p-3">
        <div className="text-sm text-muted-foreground">共 {total} 条，页大小
          <select
            className="input ml-2 text中心 px-1"
            style={{ width: 64, display: 'inline-block', paddingLeft: 4, paddingRight: 4 }}
            value={size}
            onChange={(e) => { const s = Number(e.target.value); setSize(s); fetchList(1, s, q, status) }}
          >
            {[10,20,50,100].map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchList(page - 1, size, q, status)}>上一页</button>
          <span className="text-sm">第 {page} / {Math.max(1, Math.ceil(total / size))} 页</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / size)} onClick={() => fetchList(page + 1, size, q, status)}>下一页</button>
        </div>
      </div>
    </div>
  )
}
