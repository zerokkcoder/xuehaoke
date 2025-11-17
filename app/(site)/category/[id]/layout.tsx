import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idNum = Number(params.id)
  try {
    const c = await prisma.category.findUnique({ where: { id: idNum }, select: { name: true } })
    const name = c?.name || '分类'
    const title = `${name} - 分类资源`
    const description = `浏览 ${name} 分类下的精选资源，支持按子分类与热度筛选。`
    return {
      title,
      description,
      alternates: { canonical: `/category/${params.id}` },
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'zh_CN',
      },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: '分类', alternates: { canonical: `/category/${params.id}` } }
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children
}