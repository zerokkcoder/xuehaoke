'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CarouselSlide {
  id: number
  title: string
  subtitle: string
  image: string
  buttonText: string
}

interface CarouselProps {
  slides: CarouselSlide[]
  autoPlay?: boolean
  interval?: number
}

export default function Carousel({ slides, autoPlay = true, interval = 5000 }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  return (
    <div className="relative w-full h-72 overflow-hidden card">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="w-full h-full shrink-0 relative">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
              suppressHydrationWarning
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full text-white px-4">
                <div className="max-w-2xl animate-fadeIn">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {slide.title}
                  </h2>
                  <p className="text-xl md:text-2xl mb-8 opacity-90">
                    {slide.subtitle}
                  </p>
                  <Link
                    href="#"
                    className="inline-block btn btn-primary px-6 py-2"
                  >
                    {slide.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-background border border-border text-foreground p-2 rounded-full hover:bg-secondary"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-background border border-border text-foreground p-2 rounded-full hover:bg-secondary"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-white'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {autoPlay && (
        <div className="absolute top-4 right-4">
          <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>
      )}
    </div>
  )
}