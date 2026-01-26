'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from "motion/react"

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
  const categoryHref = resource.categorySlug 
    ? (resource.subcategorySlug 
        ? `/category/${resource.categorySlug}/${resource.subcategorySlug}` 
        : `/category/${resource.categorySlug}`)
    : null

  return (
    <motion.div 
      className="card group flex flex-col h-full bg-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      {/* Image Container */}
      <Link href={`/resource/${resource.id}`} className="block relative w-full aspect-16/10 overflow-hidden bg-muted">
        <Image
          src={resource.coverImage}
          alt={resource.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={true} // Fix preview image issue and hydration mismatch
        />
        {/* Optional: Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </Link>

      {/* Content Container */}
      <div className="flex flex-col p-4 gap-3 grow">
        {/* Category Badge */}
        <div className="flex items-start">
            {categoryHref ? (
                <Link 
                    href={categoryHref}
                    target="_blank"
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                    {resource.category}
                </Link>
            ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {resource.category}
                </span>
            )}
        </div>

        {/* Title */}
        <Link href={`/resource/${resource.id}`} target="_blank" className="block">
          <h2 className="text-base font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={resource.title}>
            {resource.title}
          </h2>
        </Link>
        
        {/* Spacer to push content up if we had a footer, but for now just nice padding */}
      </div>
    </motion.div>
  )
}
