import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
// Root layout: keep minimal to allow route groups to define their own layouts

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
