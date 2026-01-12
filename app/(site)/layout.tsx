import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { headers } from "next/headers";

// 强制此布局动态渲染，避免首页等使用旧的站点设置缓存
export const dynamic = 'force-dynamic'
export const revalidate = 0

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const rows: { site_name: string | null; site_keywords: string | null; site_description: string | null; site_logo: string | null }[] = await prisma.$queryRawUnsafe('SELECT site_name, site_keywords, site_description, site_logo FROM site_settings LIMIT 1')
    const r = rows?.[0]
    const title = (r?.site_name ? `${r.site_name} - 专业资源下载平台` : '学好课 - 专业资源下载平台')
    const description = r?.site_description || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = r?.site_keywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    const logo = r?.site_logo || '/logo.png'
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    // const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    // 强制使用生产环境域名作为 Canonical URL，避免 HTTP/HTTPS 重复收录
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
    return {
      title,
      description,
      keywords,
      metadataBase: new URL(siteUrl),
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        siteName: r?.site_name || '学好课',
        images: [{ url: logo }],
        type: 'website',
        locale: 'zh_CN',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [logo],
      },
    }
  } catch {
    const hs = await headers()
    const proto = hs.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    // const host = hs.get('x-forwarded-host') || hs.get('host') || ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xuehaoke.top'
    return {
      title: "学好课 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
      metadataBase: new URL(siteUrl),
      robots: { index: true, follow: true },
    }
  }
}

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let initialCategories: { id: number; name: string; slug?: string | null; subcategories: { id: number; name: string; slug?: string | null }[] }[] = []
  try {
    const cats = await prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'desc' }],
      include: {
        subcategories: { orderBy: [{ sort: 'asc' }, { id: 'asc' }] },
      },
    })
    initialCategories = cats.map((c: any) => ({ id: c.id, name: c.name, slug: (c as any).slug || null, subcategories: (c.subcategories || []).map((s: any) => ({ id: s.id, name: s.name, slug: (s as any).slug || null })) }))
  } catch {}
  let initialSiteConfig: { siteName?: string | null; siteLogo?: string | null } | null = null
  try {
    const sRows: { site_name: string | null; site_logo: string | null }[] = await prisma.$queryRawUnsafe('SELECT site_name, site_logo FROM site_settings LIMIT 1')
    const sr = sRows?.[0]
    initialSiteConfig = sr ? { siteName: sr.site_name || null, siteLogo: sr.site_logo || null } : null
  } catch {}

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
      <Header initialCategories={initialCategories} initialSiteConfig={initialSiteConfig} />
      <main className="flex-1">{children}</main>
      <FloatingActions />
      <Footer />
    </div>
  )
}
