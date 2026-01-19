'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Ticket } from 'lucide-react'

interface LandingLogoProps {
  logoUrl: string | null
}

export default function LandingLogo({ logoUrl }: LandingLogoProps) {
  const [imageError, setImageError] = useState(false)
  const [useImgTag, setUseImgTag] = useState(false)

  // Fallback component for text logo
  const TextLogo = () => (
    <div className="text-center w-full">
      <div className="flex items-center justify-center mb-6 md:mb-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-success-500 via-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
            <Ticket className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-white" />
          </div>
        </div>
      </div>
      <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-3 md:mb-4">
        <span className="text-primary-600 font-bold">Foray</span>
        <span className="text-success-600">pay</span>
      </h2>
      <p className="text-gray-600 text-xl md:text-2xl lg:text-3xl font-semibold">One Tap. One Ticket.</p>
    </div>
  )

  if (!logoUrl || imageError) {
    return <TextLogo />
  }

  // If Next.js Image fails, fallback to regular img tag
  if (useImgTag) {
    return (
      <div className="w-full max-w-4xl h-96 md:h-[32rem] lg:h-[40rem] flex items-center justify-center mx-auto">
        <img
          src={logoUrl}
          alt="Foraypay Logo - One Tap. One Ticket."
          className="w-full h-full object-contain"
          style={{ imageRendering: 'auto', outline: 'none', border: 'none' }}
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-4xl h-96 md:h-[32rem] lg:h-[40rem] mx-auto" style={{ outline: 'none' }}>
      <Image
        src={logoUrl}
        alt="Foraypay Logo - One Tap. One Ticket."
        fill
        className="object-contain"
        style={{ outline: 'none', border: 'none' }}
        priority
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
        loading="eager"
        onError={() => {
          // Try regular img tag as fallback
          setUseImgTag(true)
        }}
      />
    </div>
  )
}

