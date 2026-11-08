import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";
import { getCachedCategories, getCachedSiteSettings } from '@/lib/cache';
import { resolveAdsenseScriptSrc } from '@/lib/adsense';
import { getSiteUrl } from '@/lib/seo';
import UnpaidOrderReminder from "@/components/UnpaidOrderReminder";

// ISR：站点设置与分类都走缓存，页面可静态化并每小时后台再生（原来是 force-dynamic，导致全站不可缓存）
export const revalidate = 3600

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  try {
    const r = await getCachedSiteSettings()
    const title = (r?.siteName ? `${r.siteName} - 专业资源下载平台` : '学好课 - 专业资源下载平台')
    const description = r?.siteDescription || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = r?.siteKeywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    const logo = r?.siteLogo || '/logo.png'
    return {
      title,
      description,
      keywords,
      metadataBase: new URL(siteUrl),
      alternates: { canonical: './' },
      robots: { index: true, follow: true },
      openGraph: {
        title,
        description,
        siteName: r?.siteName || '学好课',
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
    return {
      title: "学好课 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
      metadataBase: new URL(siteUrl),
      alternates: { canonical: './' },
      robots: { index: true, follow: true },
    }
  }
}

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let initialCategories: { id: number; name: string; slug?: string | null; subcategories: { id: number; name: string; slug?: string | null }[] }[] = []
  try {
    const cats = await getCachedCategories()
    initialCategories = cats.map((c: any) => ({ id: c.id, name: c.name, slug: (c as any).slug || null, subcategories: (c.subcategories || []).map((s: any) => ({ id: s.id, name: s.name, slug: (s as any).slug || null })) }))
  } catch {}
  let initialSiteConfig: { siteName?: string | null; siteLogo?: string | null } | null = null
  let adScriptSrc: string | null = null
  try {
    const sr = await getCachedSiteSettings()
    initialSiteConfig = sr ? { siteName: sr.siteName || null, siteLogo: sr.siteLogo || null } : null
    // 后台填了发布商 ID 就加载，没填就不输出任何标签
    adScriptSrc = resolveAdsenseScriptSrc(sr?.adsenseCode)
  } catch {}

  return (
    <>
      {/* Google AdSense：由后台「站点设置」控制，只挂载在公开站点，不进入 /admin 后台 */}
      {adScriptSrc && <script async src={adScriptSrc} crossOrigin="anonymous" />}
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Header initialCategories={initialCategories} initialSiteConfig={initialSiteConfig} />
        <main className="flex-1">{children}</main>
        <FloatingActions />
        <Footer />
        <UnpaidOrderReminder />
      </div>
    </>
  )
}
