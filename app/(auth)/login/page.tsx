'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [siteConfig, setSiteConfig] = useState<{ siteLogo?: string | null; siteName?: string | null } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch('/api/site/settings', { signal: controller.signal, cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) setSiteConfig(json.data)
      } catch {}
    }
    load()
    return () => controller.abort()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.username.trim(), password: formData.password })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        toast(json?.message || '登录失败', 'error')
      } else {
        toast('登录成功！', 'success')
        try {
          const u = json?.data
          if (u && u.username) {
            // 可选：登录后同步从 /api/user/me 拉取 avatarUrl 和 VIP 状态
            let avatarUrl: string | undefined
            let isVip = false
            try {
              const meRes = await fetch('/api/user/me', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u.username })
              })
              const meJson = await meRes.json().catch(() => ({}))
              if (meRes.ok && meJson?.success) {
                avatarUrl = meJson?.data?.avatarUrl || undefined
                isVip = !!meJson?.data?.isVip
              }
            } catch {}
            window.localStorage.setItem('site_user', JSON.stringify({ username: u.username, isVip, avatarUrl }))
          }
        } catch {}
        window.location.href = '/'
      }
    } catch (err) {
      toast('网络错误，请稍后再试', 'error')
    } finally {
      setLoading(false)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: "url('/auth_bg_animated.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2">
            <img src={siteConfig?.siteLogo || '/logo.png'} alt="logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-foreground">{siteConfig?.siteName || '学好课'}</span>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">用户名或邮箱</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required className="input w-full" placeholder="请输入用户名或邮箱" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">密码</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required className="input w-full pr-10" placeholder="请输入密码" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground" aria-label="切换显示密码">
                  {showPassword ? (<EyeSlashIcon className="h-5 w-5" />) : (<EyeIcon className="h-5 w-5" />)}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-violet-500 text-white py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div><span>登录中...</span></div>
              ) : ('登录')}
            </button>
            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">忘记密码？</Link>
              <Link href="/register" className="text-sm text-primary hover:underline font-medium">立即注册</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}