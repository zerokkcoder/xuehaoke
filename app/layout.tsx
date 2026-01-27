import type { Metadata, Viewport } from "next";
import prisma from "@/lib/prisma";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { getCachedSiteSettings } from "@/lib/cache";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** 生成站点全局默认元数据配置 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const r = await getCachedSiteSettings()
    const title = (r?.siteName ? `${r.siteName} - 专业资源下载平台` : '学好课 - 专业资源下载平台')
    const description = r?.siteDescription || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = r?.siteKeywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    // const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    // 强制使用生产环境域名作为 metadataBase，解决 canonical 和索引问题
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
    if (process.env.NODE_ENV === 'production' && siteUrl.startsWith('http://') && !siteUrl.includes('localhost')) {
      siteUrl = siteUrl.replace('http://', 'https://')
    }
    return { title, description, keywords, metadataBase: new URL(siteUrl) }
  } catch {
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    // const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
    if (process.env.NODE_ENV === 'production' && siteUrl.startsWith('http://') && !siteUrl.includes('localhost')) {
      siteUrl = siteUrl.replace('http://', 'https://')
    }
    return {
      title: "学好课 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
      metadataBase: new URL(siteUrl),
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
}

/** 根布局组件，挂载全局样式与结构化数据 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hs = await headers()
  const nonce = hs.get('x-nonce') || undefined
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
  if (process.env.NODE_ENV === 'production' && siteUrl.startsWith('http://') && !siteUrl.includes('localhost')) {
    siteUrl = siteUrl.replace('http://', 'https://')
  }
  const organizationLogo = `${siteUrl}/logo.png`
  return (
    <html lang="zh">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "学好课",
              url: siteUrl,
              logo: organizationLogo,
            }),
          }}
        />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
