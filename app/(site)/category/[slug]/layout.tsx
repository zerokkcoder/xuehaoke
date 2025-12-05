import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const c = await prisma.category.findUnique({ where: { slug }, select: { name: true } })
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

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
