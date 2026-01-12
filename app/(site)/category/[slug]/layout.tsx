import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const rows: Array<{ name: string }> = await prisma.$queryRawUnsafe('SELECT name FROM categories WHERE slug = ? LIMIT 1', slug)
    const c = rows?.[0] || null
    if (!c) {
      return { title: '分类未找到' }
    }
    const name = c?.name || '分类'
    const title = `${name} - 分类资源`
    const description = `浏览 ${name} 分类下的精选资源，支持按子分类与热度筛选。`
    return {
      title,
      description,
      alternates: { canonical: `/category/${slug}` },
      openGraph: { title, description, type: 'website', locale: 'zh_CN' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: '分类', alternates: { canonical: `/category/${slug}` } }
  }
}

export default async function CategoryLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const count = await prisma.category.count({ where: { slug } })
  if (count === 0) {
    notFound()
  }
  return children
}
