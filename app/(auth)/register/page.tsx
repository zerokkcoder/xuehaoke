'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [sending, setSending] = useState(false);
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    // 去掉同意条款校验
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          code: formData.code.trim(),
        })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        toast(json?.message || '注册失败', 'error')
      } else {
        toast('注册成功！请登录您的账户。', 'success')
        window.location.href = '/login'
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 失去焦点时检查用户名是否已注册
  const checkUsername = async () => {
    const v = formData.username.trim()
    if (!v) return
    try {
      const res = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: v })
      })
      const json = await res.json().catch(() => null)
      if (json?.success && json?.data?.usernameTaken === true) {
        setErrors(prev => ({ ...prev, username: '该用户名已被注册' }))
      } else {
        setErrors(prev => ({ ...prev, username: '' }))
      }
    } catch {}
  }

  // 失去焦点时检查邮箱是否已注册
  const checkEmail = async () => {
    const v = formData.email.trim()
    if (!v) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }))
      return
    }
    try {
      const res = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v })
      })
      const json = await res.json().catch(() => null)
      if (json?.success && json?.data?.emailTaken === true) {
        setErrors(prev => ({ ...prev, email: '该邮箱已注册' }))
      } else {
        setErrors(prev => ({ ...prev, email: '' }))
      }
    } catch {}
  }

  const sendCode = async () => {
    setErrors(prev => ({ ...prev, code: '' }))
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: '邮箱不能为空' }))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: '请输入有效的邮箱地址' }))
      return
    }
    setSending(true)
    try {
      // 先检查邮箱是否已注册
      const ck = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      })
      const ckj = await ck.json().catch(() => null)
      if (ckj?.data?.emailTaken) {
        setErrors(prev => ({ ...prev, email: '该邮箱已注册' }))
        setSending(false)
        return
      }
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        toast(json?.message || '验证码发送失败', 'error')
      } else {
        const code = json?.data?.code
        if (code) {
          // 开发或未配置邮件：接口返回验证码，便于调试
          toast(`验证码已发送到邮箱（开发环境直接返回）：${code}`, 'success')
        } else {
          // 生产环境：不展示验证码，仅提示已发送
          toast('验证码已发送到邮箱，请查收', 'success')
        }
      }
    } catch (err) {
      toast('网络错误，请稍后再试', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: "url('/auth_bg_animated.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2">
            <img src={siteConfig?.siteLogo || '/logo.png'} alt="logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-semibold text-foreground">{siteConfig?.siteName || '学好课'}</span>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={checkUsername}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.username ? 'border-red-500' : 'border-border'
                }`}
                placeholder="请输入用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          邮箱地址
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={checkEmail}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-border'
          }`}
          placeholder="请输入邮箱地址"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.code ? 'border-red-500' : 'border-border'}`}
            placeholder="请输入邮箱验证码"
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={sending}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? '发送中...' : '发送验证码'}
          </button>
        </div>
        {errors.code && (
          <p className="mt-1 text-sm text-red-600">{errors.code}</p>
        )}
      </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                确认密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="请再次输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 移除同意条款复选框与文案 */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-500 text-white py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  注册中...
                </div>
              ) : (
                '注册'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              已有账户？{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}