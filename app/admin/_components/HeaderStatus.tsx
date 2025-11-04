'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Dropdown from './Dropdown'
import ConfirmDialog from './ConfirmDialog'

export default function HeaderStatus() {
  const router = useRouter()
  const [me, setMe] = useState<{ username: string; role: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/admin/me')
        if (res.ok) {
          const data = await res.json()
          if (data.authenticated) {
            setMe({ username: data.user.username, role: data.user.role })
          } else {
            setMe(null)
          }
        } else {
          setMe(null)
        }
      } catch {
        setMe(null)
      } finally {
        setChecking(false)
      }
    }
    loadMe()
  }, [])

  if (checking) {
    return <span className="text-sm text-muted-foreground">检测中…</span>
  }

  if (!me) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-red-600">未登录</span>
        <Link href="/admin/login" className="btn btn-secondary py-1">去登录</Link>
      </div>
    )
  }

  return (
    <Dropdown
      align="right"
      trigger={
        <button type="button" className="flex items-center gap-1 text-sm text-foreground hover:text-primary">
          <span>{me.username}（{me.role}）</span>
          <span className="text-muted-foreground">▾</span>
        </button>
      }
      menu={<LogoutMenu setMe={setMe} />}
    />
  )
}

function LogoutMenu({ setMe }: { setMe: (val: any) => void }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-secondary" title="个人资料">
        个人资料
      </button>
      <button
        onClick={() => setOpen(true)}
        className="block w-full text-left text-sm px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600"
      >
        退出登录
      </button>
      <ConfirmDialog
        open={open}
        title="退出登录"
        message="确定要退出登录吗？退出后需要重新登录才能进入后台。"
        confirmText="确认退出"
        cancelText="取消"
        onConfirm={async () => {
          setOpen(false)
          await fetch('/api/admin/logout', { method: 'POST' })
          localStorage.removeItem('adminToken')
          setMe(null)
          router.push('/admin/login')
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}