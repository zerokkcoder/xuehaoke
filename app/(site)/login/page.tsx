'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login
    setTimeout(() => {
      alert('登录成功！');
      setLoading(false);
      window.location.href = '/';
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            资源下载站
          </Link>
          <p className="text-muted-foreground mt-2">欢迎回来，请登录您的账户</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                用户名或邮箱
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="请输入用户名或邮箱"
              />
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
                  required
                  className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="ml-2 text-sm text-muted-foreground">记住我</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  登录中...
                </div>
              ) : (
                '登录'
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-foreground">或者</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-lg shadow-sm bg-white text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                onClick={() => alert('微信登录功能开发中...')}
              >
                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.019.2.06.16.238.2.35.14l1.956-.99c.18-.08.33-.1.48.03.51.42 1.126.66 1.786.66.51 0 .99-.14 1.418-.39.19.14.4.2.62.2.72 0 1.31-.59 1.31-1.31 0-.1-.02-.2-.05-.29.39-.2.72-.51.99-.89.08-.1.04-.2 0-.29l-.16-.23c-.08-.12-.16-.24-.23-.36-.01-.02-.02-.03-.03-.05-.27-.51-.19-1.14.2-1.57.43-.49 1.08-.69 1.69-.5.16.05.32.12.48.2.03.01.06.02.09.03.3.12.65.13.96.04.12-.04.23-.1.33-.18.04-.03.08-.06.12-.09.1-.08.2-.16.31-.22.22-.12.48-.16.73-.12.25.04.48.17.66.35.16.16.29.35.38.56.08.2.12.42.12.64 0 .22-.04.44-.12.64-.09.21-.22.4-.38.56-.18.18-.41.31-.66.35-.25.04-.51 0-.73-.12-.11-.06-.21-.14-.31-.22-.04-.03-.08-.06-.12-.09-.1-.08-.21-.14-.33-.18-.31-.09-.66-.08-.96.04-.03.01-.06.02-.09.03-.16.08-.32.15-.48.2-.61.19-1.26-.01-1.69-.5-.39-.43-.47-1.06-.2-1.57.01-.02.02-.03.03-.05.07-.12.15-.24.23-.36l.16-.23c.04-.09.08-.19-.01-.29-.27-.38-.6-.69-.99-.89.03-.09.05-.19.05-.29 0-.72-.59-1.31-1.31-1.31-.22 0-.43.06-.62.2-.43-.25-.91-.39-1.418-.39-.66 0-1.27.24-1.786.66-.15.13-.3.11-.48.03l-1.956-.99c-.11-.06-.29-.02-.35.14-.03.06.01.13.02.19l.39 1.48a.59.59 0 0 1-.213.665C1.17 13.733 0 15.724 0 17.936c0 4.055 3.891 7.343 8.691 7.343 3.19 0 5.97-1.44 7.35-3.59.16-.24.32-.49.46-.75.22-.39.42-.79.6-1.2.19-.41.35-.83.49-1.26.14-.42.26-.85.35-1.29.09-.43.16-.87.21-1.32.05-.44.08-.88.08-1.33 0-.15-.01-.3-.02-.45-.01-.15-.03-.3-.05-.45-.02-.15-.04-.3-.07-.45-.03-.15-.06-.3-.1-.45-.04-.15-.08-.3-.12-.45-.05-.15-.1-.3-.15-.45-.06-.15-.12-.3-.18-.45-.06-.15-.13-.3-.2-.45-.07-.15-.15-.3-.23-.45-.08-.15-.16-.3-.25-.45-.09-.15-.18-.3-.27-.45-.1-.15-.19-.3-.29-.45-.1-.15-.21-.3-.31-.45-.11-.15-.22-.3-.33-.45-.12-.15-.23-.3-.34-.45-.12-.14-.24-.29-.36-.43-.12-.14-.24-.28-.36-.42-.13-.14-.25-.28-.38-.42-.13-.14-.26-.27-.39-.41-.13-.14-.26-.27-.4-.4-.14-.13-.27-.26-.41-.39-.14-.13-.28-.26-.42-.38-.14-.13-.28-.25-.42-.37-.15-.12-.29-.24-.44-.36-.15-.12-.3-.24-.45-.35-.15-.12-.3-.23-.46-.34-.16-.11-.31-.22-.47-.33-.16-.11-.32-.22-.48-.32-.16-.1-.32-.2-.48-.3-.17-.1-.33-.19-.5-.28-.17-.09-.34-.18-.51-.27-.18-.09-.35-.17-.53-.25-.18-.08-.36-.16-.54-.24-.19-.08-.37-.15-.56-.22-.19-.07-.38-.14-.57-.21-.2-.07-.39-.13-.59-.19-.2-.06-.4-.12-.6-.17-.2-.06-.4-.11-.6-.16-.21-.05-.41-.1-.62-.14-.21-.04-.41-.08-.62-.12-.21-.04-.42-.07-.63-.1-.22-.03-.43-.06-.65-.08-.22-.02-.43-.04-.65-.06-.22-.02-.44-.03-.66-.04-.22-.01-.44-.02-.66-.02-.22-.01-.44-.01-.66-.01-.22 0-.44-.01-.66-.01-.23 0-.45.01-.66.01-.22 0-.44.01-.66.02-.22.01-.44.02-.66.04-.22.01-.43.03-.65.06-.21.02-.42.05-.63.1-.21.03-.41.06-.62.12-.21.04-.41.08-.62.14-.2.05-.4.1-.6.16-.2.06-.4.11-.6.17-.2.06-.39.13-.59.19-.19.07-.38.14-.57.21-.19.08-.37.15-.56.22-.18.08-.36.16-.54.24-.18.09-.35.17-.53.25-.17.09-.34.18-.51.27-.17.1-.33.19-.5.28-.17.1-.33.2-.5.3-.16.1-.32.2-.48.3-.16.11-.31.22-.47.33-.16.11-.31.23-.47.34-.15.12-.3.24-.45.35-.15.12-.29.24-.44.36-.14.12-.28.25-.42.37-.14.13-.27.26-.41.39-.14.13-.26.27-.39.41-.13.14-.25.28-.38.42-.13.14-.24.28-.36.42-.12.14-.24.29-.36.43-.12.15-.23.3-.34.45-.12.15-.22.3-.33.45-.11.15-.21.3-.31.45-.1.15-.2.3-.29.45-.1.15-.19.3-.27.45-.09.15-.18.3-.25.45-.08.15-.16.3-.23.45-.07.15-.15.3-.2.45-.07.15-.14.3-.2.45-.06.15-.12.3-.18.45-.06.15-.11.3-.16.45-.05.15-.1.3-.15.45-.05.15-.09.3-.14.45-.04.15-.08.3-.12.45-.04.15-.07.3-.11.45-.03.15-.06.3-.1.45-.03.15-.05.3-.08.45-.03.15-.04.3-.07.45-.02.15-.03.3-.05.45-.02.15-.02.3-.04.45-.01.15-.01.3-.02.45-.01.15-.01.3-.01.45V9.53c0-.15.01-.3.01-.45.01-.15.01-.3.02-.45.01-.15.02-.3.04-.45.02-.15.03-.3.05-.45.02-.15.04-.3.07-.45.03-.15.05-.3.08-.45.03-.15.06-.3.1-.45.04-.15.07-.3.11-.45.04-.15.08-.3.12-.45.05-.15.09-.3.14-.45.05-.15.1-.3.15-.45.06-.15.11-.3.16-.45.06-.15.12-.3.18-.45.07-.15.13-.3.2-.45.07-.15.14-.3.23-.45.08-.15.16-.3.25-.45.08-.15.17-.3.27-.45.09-.15.19-.3.29-.45.1-.15.2-.3.31-.45.1-.15.21-.3.33-.45.11-.15.22-.3.34-.45.12-.15.23-.3.36-.45.12-.14.24-.29.38-.42.12-.14.25-.28.39-.41.13-.14.26-.27.4-.4.13-.14.27-.26.41-.39.14-.13.28-.25.42-.37.14-.13.28-.24.42-.36.15-.12.29-.23.44-.34.15-.12.3-.22.45-.33.16-.11.31-.21.47-.32.16-.11.32-.2.48-.3.17-.1.33-.19.5-.28.17-.09.34-.17.51-.25.18-.08.36-.16.54-.24.18-.08.37-.15.55-.22.19-.07.38-.14.57-.21.19-.07.39-.13.59-.19.2-.06.4-.11.6-.16.2-.06.4-.12.6-.17.21-.05.41-.1.62-.14.21-.04.41-.08.62-.12.21-.04.42-.07.63-.1.21-.03.42-.05.63-.08.22-.03.43-.06.65-.08.22-.02.44-.04.66-.06.22-.02.44-.03.66-.04.22-.01.44-.02.66-.02.22-.01.44-.01.66-.01.22 0 .44-.01.66-.01.23 0 .45.01.66.01.22 0 .44.01.66.02.22.01.44.02.66.04.22.01.43.03.65.06z"/>
                </svg>
                微信登录
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-lg shadow-sm bg-white text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                onClick={() => alert('QQ登录功能开发中...')}
              >
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 2.12.66 4.08 1.79 5.69.5.71 1.12 1.31 1.83 1.78.7.46 1.48.8 2.31 1.01.83.2 1.69.28 2.56.23.87-.05 1.73-.22 2.54-.5.81-.29 1.57-.69 2.25-1.19.68-.5 1.28-1.1 1.78-1.83.5-.73.89-1.54 1.16-2.41.27-.87.41-1.79.41-2.73 0-5.5-4.46-9.96-9.96-9.96zm0 18.48c-1.11 0-2.17-.21-3.15-.6-.98-.4-1.86-.97-2.61-1.68-.75-.71-1.37-1.55-1.83-2.49-.46-.94-.73-1.96-.79-3.01-.06-1.05.09-2.11.43-3.11.34-1 .87-1.92 1.55-2.73.68-.81 1.51-1.49 2.45-2 .94-.51 1.97-.81 3.02-.89 1.05-.08 2.11.05 3.11.39 1 .34 1.92.85 2.73 1.51.81.66 1.49 1.47 2 2.39.51.92.81 1.93.89 2.96.08 1.03-.05 2.07-.39 3.05-.34.98-.85 1.88-1.51 2.68-.66.8-1.47 1.47-2.39 1.97-.92.5-1.93.79-2.96.86-1.03.07-2.07-.06-3.05-.4z"/>
                </svg>
                QQ登录
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                立即注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}