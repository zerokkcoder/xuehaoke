import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import prisma from "@/lib/prisma";
import Footer from "@/components/Footer";
import FloatingActions from "@/components/FloatingActions";

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
    const s = await prisma.siteSetting.findFirst()
    const title = (s?.siteName ? `${s.siteName} - 专业资源下载平台` : '酷库下载 - 专业资源下载平台')
    const description = s?.siteDescription || "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。"
    const keywords = s?.siteKeywords || "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计"
    return { title, description, keywords }
  } catch {
    return {
      title: "酷库下载 - 专业资源下载平台",
      description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
      keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
    }
  }
}

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cats = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'desc' }],
    select: {
      id: true,
      name: true,
      subcategories: { orderBy: [{ sort: 'asc' }, { id: 'asc' }], select: { id: true, name: true } },
    },
  })
  const initialCategories = cats.map(c => ({ id: c.id, name: c.name, subcategories: c.subcategories.map(s => ({ id: s.id, name: s.name })) }))
  const s = await prisma.siteSetting.findFirst()
  const initialSiteConfig = s ? { siteName: s.siteName || null, siteLogo: s.siteLogo || null } : null

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
      <Header initialCategories={initialCategories} initialSiteConfig={initialSiteConfig} />
      <main className="flex-1">{children}</main>
      <FloatingActions />
      <Footer />
    </div>
  )
}