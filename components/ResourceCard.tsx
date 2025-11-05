'use client'

import Image from 'next/image'
import Link from 'next/link'

type ResourceCardData = {
  id: number | string
  coverImage: string
  title: string
  category: string
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
      <Link href={`/resource/${resource.id}`} className="block">
        {/* Split layout: image top, text bottom */}
        <div className="flex flex-col h-40 md:h-48">
          <div className="relative flex-1 overflow-hidden">
            <Image
              src={resource.coverImage}
              alt={resource.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="flex-1 pl-3 flex flex-col justify-center gap-1">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full border border-red-500 mr-2"></span>
              {resource.category}
            </div>
            <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {resource.title}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  )
}