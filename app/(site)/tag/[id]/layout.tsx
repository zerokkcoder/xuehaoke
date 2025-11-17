import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const idNum = Number(params.id)
  try {
    const t = await prisma.tag.findUnique({ where: { id: idNum }, select: { name: true } })
    const name = t?.name || '标签'
    const title = `${name} - 标签资源`
    const description = `查看与「${name}」相关的资源合集。`
    return {
      title,
      description,
      alternates: { canonical: `/tag/${params.id}` },
      openGraph: { title, description, type: 'website', locale: 'zh_CN' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return { title: '标签', alternates: { canonical: `/tag/${params.id}` } }
  }
}

export default function TagLayout({ children }: { children: React.ReactNode }) {
  return children
}