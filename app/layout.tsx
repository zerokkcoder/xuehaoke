import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { getCachedSiteSettings } from "@/lib/cache";
import { getSiteUrl, getOrganizationSameAs } from "@/lib/seo";

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
  const siteUrl = getSiteUrl()
  try {
    const r = await getCachedSiteSettings()
    const title = (r?.siteName ? `${r.siteName} - 专业资源下载平台` : '学好课 - 专业资源下载平台')
    const description = r?.siteDescription || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = r?.siteKeywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    return { title, description, keywords, metadataBase: new URL(siteUrl), alternates: { canonical: './' } }
  } catch {
    return {
      title: "学好课 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
      metadataBase: new URL(siteUrl),
      alternates: { canonical: './' },
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
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl()
  const sameAs = getOrganizationSameAs()
  return (
    <html lang="zh">
      <head>
        <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLMs.txt" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "学好课",
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              ...(sameAs.length ? { sameAs } : {}),
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
