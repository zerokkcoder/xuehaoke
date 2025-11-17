'use client'

import { useEffect, useState } from 'react'

type Settings = {
  id?: number
  alipayAppId?: string | null
  alipayPrivateKey?: string | null
  alipayPublicKey?: string | null
  alipayGateway?: string | null
  alipayNotifyUrl?: string | null
  siteSubtitle?: string | null
  siteName?: string | null
  siteLogo?: string | null
  siteSlogan?: string | null
  siteKeywords?: string | null
  siteDescription?: string | null
  heroImage?: string | null
  footerText?: string | null
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<{ logo?: boolean; hero?: boolean }>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')
      try {
        const res = await fetch('/api/admin/settings', { method: 'GET', cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success) {
          setSettings(json.data || {})
        } else {
          setMessage(json?.message || '加载失败')
        }
      } catch (e: any) {
        setMessage(e?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...(prev || {}), [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const uploadFile = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.success) throw new Error(json?.message || '上传失败')
    return String(json.url)
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(prev => ({ ...prev, logo: true }))
    try {
      const url = await uploadFile(file)
      setSettings(prev => ({ ...(prev || {}), siteLogo: url }))
    } catch (err: any) {
      setMessage(err?.message || 'Logo 上传失败')
    } finally {
      setUploading(prev => ({ ...prev, logo: false }))
      e.target.value = ''
    }
  }

  const handleUploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(prev => ({ ...prev, hero: true }))
    try {
      const url = await uploadFile(file)
      setSettings(prev => ({ ...(prev || {}), heroImage: url }))
    } catch (err: any) {
      setMessage(err?.message || 'Hero 上传失败')
    } finally {
      setUploading(prev => ({ ...prev, hero: false }))
      e.target.value = ''
    }
  }

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setMessage('')
    // client-side required validation
    const pub = (settings.alipayPublicKey || '').trim()
    if (!pub) {
      setErrors(prev => ({ ...prev, alipayPublicKey: '请填写支付宝公钥' }))
      setMessage('请填写支付宝公钥')
      setSaving(false)
      return
    }
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success) {
        setSettings(json.data)
        setMessage('保存成功')
        // 保存后重载页面，确保各处（含服务端渲染）读取到最新站点设置
        setTimeout(() => {
          try { window.location.reload() } catch {}
        }, 300)
      } else {
        setMessage(json?.message || '保存失败')
      }
    } catch (e: any) {
      setMessage(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-4">站点设置</h1>
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-lg font-medium text-foreground">支付宝配置</legend>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">App ID</label>
              <input name="alipayAppId" value={settings?.alipayAppId || ''} onChange={handleChange} className="input w-full" placeholder="如：202100111164XXXX" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Private Key (PKCS8)</label>
              <textarea name="alipayPrivateKey" value={settings?.alipayPrivateKey || ''} onChange={handleChange} rows={4} className="input w-full h-auto" placeholder="请输入私钥（PKCS8）" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Alipay Public Key <span className="text-destructive">*</span></label>
              <textarea name="alipayPublicKey" value={settings?.alipayPublicKey || ''} onChange={handleChange} rows={3} className="input w-full h-auto" placeholder="请粘贴支付宝公钥" />
              {errors.alipayPublicKey && <p className="text-xs text-destructive mt-1">{errors.alipayPublicKey}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Gateway</label>
                <input name="alipayGateway" value={settings?.alipayGateway || ''} onChange={handleChange} className="input w-full" placeholder="https://openapi.alipay.com/gateway.do" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Notify URL</label>
                <input name="alipayNotifyUrl" value={settings?.alipayNotifyUrl || ''} onChange={handleChange} className="input w-full" placeholder="https://your.domain/api/pay/alipay/notify" />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-lg font-medium text-foreground">站点展示配置</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">网站名称</label>
                <input name="siteName" value={settings?.siteName || ''} onChange={handleChange} className="input w-full" placeholder="如：骇课网" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">站点副标题（首页 H1）</label>
                <input name="siteSubtitle" value={settings?.siteSubtitle || ''} onChange={handleChange} className="input w-full" placeholder="如：骇课网，学习更高效" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">网站 Slogan</label>
                <input name="siteSlogan" value={settings?.siteSlogan || ''} onChange={handleChange} className="input w-full" placeholder="一句话口号" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded bg-white border border-border overflow-hidden">
                    {settings?.siteLogo ? (<img src={settings.siteLogo} alt="logo" className="w-full h-full object-contain" />) : (<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">无</div>)}
                  </div>
                  <label className="btn btn-primary inline-block cursor-pointer">
                    {uploading.logo ? '上传中...' : '上传 Logo'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUploadLogo} className="hidden" />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">首页 Hero 图</label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-16 rounded bg-white border border-border overflow-hidden">
                    {settings?.heroImage ? (<img src={settings.heroImage} alt="hero" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">无</div>)}
                  </div>
                  <label className="btn btn-primary inline-block cursor-pointer">
                    {uploading.hero ? '上传中...' : '上传 Hero'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleUploadHero} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">关键词（逗号分隔）</label>
              <input name="siteKeywords" value={settings?.siteKeywords || ''} onChange={handleChange} className="input w-full" placeholder="如：学习,资源下载,课程,模板" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">网站描述</label>
              <textarea name="siteDescription" value={settings?.siteDescription || ''} onChange={handleChange} rows={3} className="input w-full h-auto" placeholder="用于 SEO 的简要描述" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Footer 文本</label>
              <textarea name="footerText" value={settings?.footerText || ''} onChange={handleChange} rows={2} className="input w-full h-auto" placeholder="页脚显示的版权或标语" />
            </div>
          </fieldset>

          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving} className="btn btn-primary">{saving ? '保存中...' : '保存设置'}</button>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>
      )}
    </div>
  )
}