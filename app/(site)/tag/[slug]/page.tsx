import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import TagDetailClient from './TagDetailClient'
import { getSiteUrl } from '@/lib/seo'

export const revalidate = 3600 // ISR cache for 1 hour

// 声明为「按需生成 + ISR 缓存」：仅在首次访问时渲染并缓存，之后命中缓存
export function generateStaticParams() {
  return []
}

const tagDescriptions: Record<string, string> = {
  'java': 'Java视频教程合集，提供Java入门到精通的全套视频课程。涵盖Java基础、SpringBoot、SpringCloud、微服务架构等核心技术栈。课程由慕课网、黑马程序员等知名机构出品，全部支持免费下载。',
  'python': 'Python编程视频教程下载，包含Python基础、数据分析、机器学习、深度学习、人工智能等全套课程。适合零基础学习者入门Python编程，掌握自动化办公、数据科学等技能。',
  'javascript': 'JavaScript视频教程下载，涵盖JS基础、ES6+、Vue.js、React、Node.js等前端核心技术。所有课程均提供完整章节，支持高速下载和在线观看。',
  '前端': '前端开发视频教程合集，包括HTML/CSS、JavaScript、Vue.js、React、Angular等主流框架课程。课程来自慕课网、腾讯课堂等平台，帮助你从零基础到高级前端工程师。',
  '后端': '后端开发视频教程下载，涵盖Java、Python、Go、Node.js等后端语言课程。包含SpringBoot、SpringCloud、Django、Flask等主流框架教程，助力成为全栈工程师。',
  'ai': 'AI人工智能视频教程下载，包含机器学习、深度学习、神经网络、自然语言处理等课程。涵盖TensorFlow、PyTorch等框架使用，适合想进入AI领域的学习者。',
  'machine-learning': '机器学习视频教程下载，从基础数学到算法实现全覆盖。包含监督学习、无监督学习、深度学习等核心算法，配有完整的项目实战代码。',
  'react': 'React视频教程下载，涵盖React基础、Hooks、Redux、React Native等核心技术。课程由浅入深，配有大量实战项目，帮你快速掌握React开发。',
  'vue': 'Vue.js视频教程下载，包含Vue2/Vue3完整课程、Vuex状态管理、Vue Router路由等。课程内容详实，适合前端开发者学习Vue生态。',
  'springboot': 'SpringBoot视频教程下载，涵盖SpringBoot基础、自动配置、Web开发、数据访问微服务等核心技术。配有完整项目实战，助你快速上手SpringBoot开发。',
  'docker': 'Docker容器技术视频教程下载，包括Docker基础、镜像构建、容器编排Docker ComposeSwarmKubernetes等。适合运维工程师和后端开发者学习。',
  'kubernetes': 'Kubernetes视频教程下载，涵盖K8s集群搭建、Pod、Service、Deployment、ConfigMap等核心概念。配有生产环境实践案例，适合运维和DevOps工程师。',
  'linux': 'Linux运维视频教程下载，包含Linux基础、Shell脚本、系统运维、服务器集群等课程。适合运维工程师和后端开发者学习Linux系统管理。',
  'mysql': 'MySQL数据库视频教程下载，涵盖SQL基础、索引优化、事务锁机制、主从复制分库分表等。配有大量实战案例，帮你成为数据库高手。',
  'redis': 'Redis缓存技术视频教程下载，包含Redis数据类型、持久化、集群哨兵、Redis+SpringBoot实战等。适合后端开发者学习高性能缓存方案。',
  '大模型': '大模型教程下载，涵盖ChatGPT、GPT-4、Claude、文心一言、通义千问等大语言模型的使用教程。包含Prompt工程、大模型微调、LangChain开发等前沿技术。',
  'llm': 'LLM大语言模型视频教程，涵盖GPT系列、Llama、ChatGLM等开源大模型部署与微调。提供完整的学习路径，从理论到实践助你掌握大模型开发。',
  'deepseek': 'DeepSeek视频教程下载，DeepSeek是国产优秀大模型，本教程涵盖DeepSeek使用、API调用、Prompt技巧及垂直领域应用开发。',
  'chatgpt': 'ChatGPT使用教程下载，涵盖ChatGPT注册、API使用、Prompt工程、GPTs开发等。从入门到精通，助你充分利用AI提升工作效率。',
}

function generateTagDescription(tagName: string, slug: string): string {
  const lowerSlug = slug.toLowerCase()
  const lowerName = tagName.toLowerCase()
  if (tagDescriptions[lowerSlug]) return tagDescriptions[lowerSlug]
  if (tagDescriptions[lowerName]) return tagDescriptions[lowerName]
  return `${tagName}视频教程下载，涵盖${tagName}基础到高级应用的全套课程。课程来自慕课网、极客时间等知名平台，包含完整的项目实战代码和笔记。适合${tagName}学习者和开发者免费下载观看。`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tagSlug = decodeURIComponent(slug)

  const tag = await prisma.tag.findFirst({
    where: { slug: tagSlug },
  })

  if (!tag) return {}

  const description = generateTagDescription(tag.name, tagSlug)
  const title = `${tag.name}视频教程合集 - 免费下载 | 学好课`
  const siteUrl = getSiteUrl()

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/tag/${tagSlug}` },
    openGraph: {
      title,
      description,
      type: 'website',
    }
  }
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tagSlug = decodeURIComponent(slug)

  const tag = await prisma.tag.findFirst({
    where: { slug: tagSlug },
  })

  if (!tag) {
    return notFound()
  }

  let siteConfig = null
  try {
    const rows: any[] = await prisma.$queryRawUnsafe('SELECT hero_image FROM site_settings LIMIT 1')
    const r = rows?.[0]
    if (r) {
      siteConfig = { heroImage: r.hero_image ?? null }
    }
  } catch {}

  const page = 1
  const size = 6
  const where = {
    tags: { some: { tag: { slug: tagSlug } } }
  }

  const [total, resourcesRaw] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { id: 'desc' },
      take: size,
      include: {
        category: true,
        subcategory: true,
      }
    })
  ])

  const initialResources = resourcesRaw.map((r: any) => ({
    id: r.id,
    title: r.title,
    coverImage: r.cover || 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&h=600&fit=crop',
    category: r.subcategory?.name || r.category?.name || '其他',
    categorySlug: r.category?.slug || null,
    subcategorySlug: r.subcategory?.slug || null
  }))

  const description = generateTagDescription(tag.name, tagSlug)

  return (
    <TagDetailClient
      tagSlug={tagSlug}
      initialTagName={tag.name}
      initialDescription={description}
      initialResources={initialResources}
      initialTotal={total}
      initialSiteConfig={siteConfig}
    />
  )
}
