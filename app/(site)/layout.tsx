import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { currentUser } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "酷库下载 - 专业资源下载平台",
  description: "提供高质量的学习资料、开发工具、设计素材等资源下载服务，助力您的学习和工作。",
  keywords: "资源下载,学习资料,开发工具,设计素材,编程教程,UI设计",
};

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
      <Header currentUser={currentUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}