'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugCode, setDebugCode] = useState('')

  const requestCode = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/auth/reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        setMessage(json?.message || '发送失败')
        return
      }
      setMessage(json?.message || '验证码已发送至邮箱')
      // 开发环境可能返回调试码
      if (json?.data?.code) setDebugCode(String(json.data.code))
      setStep('reset')
    } catch (e: any) {
      setMessage(e?.message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setLoading(true)
    setMessage('')
    try {
      if (!code || !password || password !== confirm) {
        setMessage('请输入验证码，设置新密码并确认一致')
        setLoading(false)
        return
      }
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, code, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success) {
        setMessage(json?.message || '重置失败')
        return
      }
      setMessage(json?.message || '重置成功')
      setStep('done')
    } catch (e: any) {
      setMessage(e?.message || '重置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">找回密码</h1>
        {step === 'request' && (
          <>
            <label className="block text-sm text-muted-foreground mb-2">注册邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input mb-4"
              placeholder="请输入邮箱"
            />
            <button onClick={requestCode} disabled={loading} className="w-full btn btn-accent">
              {loading ? '发送中...' : '发送验证码'}
            </button>
            {message && <p className="mt-3 text-sm text-muted-foreground">{message}{debugCode && `（调试码：${debugCode}）`}</p>}
            <div className="mt-4 text-sm">
              <Link href="/login" className="text-primary hover:underline">返回登录</Link>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <label className="block text-sm text-muted-foreground mb-2">邮箱</label>
            <input type="email" value={email} disabled className="w-full input mb-3" />
            <label className="block text-sm text-muted-foreground mb-2">验证码</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full input mb-3" placeholder="6位验证码" />
            <label className="block text-sm text-muted-foreground mb-2">新密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full input mb-3" placeholder="至少6位" />
            <label className="block text-sm text-muted-foreground mb-2">确认新密码</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full input mb-4" placeholder="再次输入新密码" />
            <button onClick={resetPassword} disabled={loading} className="w-full btn btn-primary">
              {loading ? '重置中...' : '确认重置'}
            </button>
            {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
            <div className="mt-4 text-sm">
              <button onClick={() => setStep('request')} className="text-primary hover:underline">返回上一步</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="text-center">
            <p className="text-sm text-foreground">密码已重置，请使用新密码登录。</p>
            <Link href="/login" className="mt-4 inline-block btn btn-accent">前往登录</Link>
          </div>
        )}
      </div>
    </div>
  )
}