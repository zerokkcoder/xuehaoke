'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

const STEPS = [
  '点击下方「下载扩展包」，得到一个 zip 文件，解压到本地任意目录（记住这个目录）。',
  '打开浏览器扩展管理页 chrome://extensions ，并开启右上角的「开发者模式」。',
  '点击「加载已解压的扩展程序」，选择第 1 步解压出来的文件夹（里面有 manifest.json 的那个目录）。',
  '在同一个浏览器里登录闲鱼（goofish.com），回到「资源管理」即可使用「上架闲鱼」。',
]

export default function XianyuExtensionPage() {
  const { toast } = useToast()
  const [installed, setInstalled] = useState<boolean | null>(null)

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d: any = e?.data
      if (!d || typeof d !== 'object' || d.source !== 'xuehaoke-xianyu-ext') return
      if (d.type === 'READY' || d.type === 'PONG') setInstalled(true)
    }
    window.addEventListener('message', onMsg)
    const ping = () => window.postMessage({ source: 'xuehaoke-admin', type: 'PING' }, '*')
    ping()
    const timer = setInterval(ping, 2000)
    const timeout = setTimeout(() => setInstalled((v) => (v === null ? false : v)), 3000)
    return () => {
      window.removeEventListener('message', onMsg)
      clearInterval(timer)
      clearTimeout(timeout)
    }
  }, [])

  const copyExtensionsUrl = async () => {
    try {
      await navigator.clipboard.writeText('chrome://extensions')
      toast('已复制 chrome://extensions，粘贴到地址栏打开即可', 'success')
    } catch {
      toast('复制失败，请手动输入 chrome://extensions', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">闲鱼上架扩展</h2>
        <a className="btn btn-primary" href="/api/admin/xianyu-extension" download>
          下载扩展包
        </a>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">安装状态：</span>
          {installed === true ? (
            <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">已安装并已连接</span>
          ) : installed === false ? (
            <span className="inline-block px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">未检测到</span>
          ) : (
            <span className="inline-block px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">检测中…</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          该扩展用于「资源管理」里的闲鱼一键上架：自动把标题、描述、价格、封面图填进闲鱼发布页，并把上架状态回写到资源。
          浏览器不允许网页自动安装扩展，所以需要按下面的步骤手动加载一次（仅首次）。
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 space-y-4">
        <div className="text-sm font-semibold text-foreground">安装步骤</div>
        <ol className="space-y-3">
          {STEPS.map((text, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-secondary text-xs flex items-center justify-center text-foreground">{i + 1}</span>
              <span className="text-sm text-foreground leading-6">{text}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href="/api/admin/xianyu-extension" download>下载扩展包（zip）</a>
          <button className="btn btn-secondary" onClick={copyExtensionsUrl}>复制 chrome://extensions</button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm p-4 space-y-2">
        <div className="text-sm font-semibold text-foreground">常见问题</div>
        <div className="text-xs text-muted-foreground leading-6">
          · 安装后状态仍显示「未检测到」：刷新本页面，或到 chrome://extensions 确认扩展已启用。<br />
          · 点击「一键上架」无反应：确认扩展已启用，且当前浏览器已登录闲鱼。<br />
          · 扩展更新：重新下载 zip，在 chrome://extensions 里点该扩展的「重新加载」，或删掉旧的重新加载文件夹。
        </div>
      </div>
    </div>
  )
}
