'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function ContactPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText('阿呆的资料铺')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen w-full bg-background selection:bg-yellow-400 selection:text-yellow-950">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/5 blur-[120px]" />
      </div>

      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/5 px-4 py-1.5 text-sm font-bold text-yellow-600 backdrop-blur-sm">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            在线支持
          </div>
          <h1 className="text-5xl font-black tracking-tighter sm:text-7xl md:text-8xl">
            联系 <span className="bg-linear-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent">我们.</span>
          </h1>
        </div>

        {/* The Card */}
        <div className="group relative w-full max-w-md perspective-1000">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/40 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-yellow-400/20">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 z-0 bg-linear-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
            
            {/* Card Header */}
            <div className="relative z-10 mb-8 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-2xl font-black text-yellow-950 shadow-lg shadow-yellow-400/20">
                闲
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">平台</p>
                <p className="font-bold text-foreground/80">闲鱼 APP</p>
              </div>
            </div>

            {/* Shop Name & Copy */}
            <div className="relative z-10 mb-8 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">官方店铺</p>
              <button 
                onClick={handleCopy}
                className="group/btn relative mx-auto flex items-center gap-3 rounded-2xl bg-black/5 px-6 py-3 transition-all hover:bg-black/10 active:scale-95"
              >
                <span className="text-2xl font-black tracking-wider text-foreground">阿呆的资料铺</span>
                {copied ? (
                  <span className="text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
                ) : (
                  <span className="text-muted-foreground opacity-0 transition-opacity group-hover/btn:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </span>
                )}
              </button>
              <p className="mt-2 text-[10px] text-muted-foreground/60">{copied ? '已复制店铺名' : '点击复制店铺名'}</p>
            </div>

            {/* QR Code */}
            <div className="relative z-10 flex justify-center">
              <div className="relative overflow-hidden rounded-2xl border-4 border-border/50 bg-white shadow-2xl">
                <Image 
                  src="/xianyu.png" 
                  alt="闲鱼店铺二维码" 
                  width={240} 
                  height={300}
                  className="h-auto w-auto max-w-[260px] object-contain"
                  priority
                  unoptimized
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-8 flex items-center justify-between border-t border-border/50 pt-6">
              <div className="text-xs text-muted-foreground">
                <p>响应时间</p>
                <p className="font-bold text-green-400">即时</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>状态</p>
                <p className="font-bold text-green-400">在线</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 max-w-sm text-center text-sm text-muted-foreground/60">
          请打开闲鱼 APP 扫描二维码，或搜索店铺名称联系我们。
        </p>
      </main>
    </div>
  )
}
