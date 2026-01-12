import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    // 查找标签并统计关联资源数
    const tag = await prisma.tag.findFirst({
      where: { slug },
      include: { _count: { select: { resources: true } } }
    })
    
    if (!tag) {
      return { title: '标签未找到' }
    }

    const name = tag.name || '标签'
    const title = `${name} - 标签资源`
    const description = `查看与「${name}」相关的资源合集。`
    const count = tag._count.resources

    // 如果没有资源，添加 noindex 防止软 404
    const robots = count > 0 
      ? { index: true, follow: true }
      : { index: false, follow: true }

    return {
      title,
      description,
      keywords: [name],
      alternates: { canonical: `/tag/${slug}` },
      openGraph: { title: name, description, type: 'website', locale: 'zh_CN' },
      twitter: { card: 'summary', title: name, description },
      robots,
    }
  } catch {
    return { title: '标签', alternates: { canonical: `/tag/${slug}` } }
  }
}

export default async function TagLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // 验证标签是否存在，不存在则返回 404
  const count = await prisma.tag.count({ where: { slug } })
  if (count === 0) {
    notFound()
  }

  return children
}
