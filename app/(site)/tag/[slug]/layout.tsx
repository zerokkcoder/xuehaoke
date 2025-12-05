import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const rows: Array<{ name: string }> = await prisma.$queryRawUnsafe('SELECT name FROM tags WHERE slug = ? LIMIT 1', slug)
    const t = rows?.[0] || null
    const name = t?.name || '标签'
    const title = `${name} - 标签资源`
    const description = `查看与「${name}」相关的资源合集。`
    return {
      title,
      description,
      keywords: [name],
      alternates: { canonical: `/tag/${slug}` },
      openGraph: { title: name, description, type: 'website', locale: 'zh_CN' },
      twitter: { card: 'summary', title: name, description },
    }
  } catch {
    return { title: '标签', alternates: { canonical: `/tag/${slug}` } }
  }
}

export default function TagLayout({ children }: { children: React.ReactNode }) {
  return children
}
