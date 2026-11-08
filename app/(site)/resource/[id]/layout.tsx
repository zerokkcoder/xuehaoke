import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

// 仅做资源存在性校验；结构化数据（Course/FAQ/Breadcrumb）统一由 page.tsx 输出，
// 避免同一 URL 出现 Product 与 Course 两套互相打架的数据。
export default async function ResourceLayout(props: any) {
  const { children, params } = props
  const { id } = await params
  const idNum = Number(id)

  if (isNaN(idNum)) {
    notFound()
  }

  const exists = await prisma.resource.count({ where: { id: idNum } })
  if (exists === 0) {
    notFound()
  }

  return <>{children}</>
}
