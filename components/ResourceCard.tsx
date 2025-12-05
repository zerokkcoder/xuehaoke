'use client'

import Image from 'next/image'
import Link from 'next/link'

type ResourceCardData = {
  id: number | string
  coverImage: string
  title: string
  category: string
  categorySlug?: string | null
  subcategorySlug?: string | null
}

interface ResourceCardProps {
  resource: ResourceCardData
  index?: number
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {

  return (
    <div 
      className="card cursor-pointer animate-fadeIn"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Split layout: image top, text bottom */}
      <div className="flex flex-col h-48 md:h-56">
        <Link href={`/resource/${resource.id}`} className="block relative h-2/3 overflow-hidden bg-white">
          <Image
            src={resource.coverImage}
            alt={resource.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
        <div className="h-1/3 pl-3 pt-3 flex flex-col justify-start gap-1">
          {resource.categorySlug ? (
            <Link
              href={resource.subcategorySlug ? `/category/${resource.categorySlug}/${resource.subcategorySlug}` : `/category/${resource.categorySlug}`}
              className="flex items-center text-xs md:text-sm text-muted-foreground hover:text-violet-500"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full border border-red-500 mr-2"></span>
              {resource.category}
            </Link>
          ) : (
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full border border-red-500 mr-2"></span>
              {resource.category}
            </div>
          )}
          <Link href={`/resource/${resource.id}`} className="text-foreground hover:text-primary">
            <h3 className="text-sm md:text-base font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-colors" title={resource.title}>
              {resource.title}
            </h3>
          </Link>
        </div>
      </div>
    </div>
  )
}
