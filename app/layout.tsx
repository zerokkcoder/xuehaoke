import type { Metadata, Viewport } from "next";
import prisma from "@/lib/prisma";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { headers } from "next/headers";
// Root layout: keep minimal to allow route groups to define their own layouts

export const dynamic = 'force-dynamic'

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
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT site_name, site_description, site_keywords FROM site_settings LIMIT 1')
    const r = rows?.[0]
    const title = (r?.site_name ? `${r.site_name} - 专业资源下载平台` : '骇课网 - 专业资源下载平台')
    const description = r?.site_description || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = r?.site_keywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    return { title, description, keywords }
  } catch {
    return {
      title: "骇课网 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
    }
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hs = await headers()
  const nonce = hs.get('x-nonce') || undefined
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
              name: "骇课网",
              url: "/",
              logo: "/logo.png",
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
