'use client'

import { useState } from 'react'
import Image from 'next/image'

interface HeroBackgroundProps {
  logoUrl: string | null
}

export default function HeroBackground({ logoUrl }: HeroBackgroundProps) {
  const [imageError, setImageError] = useState(false)

  if (!logoUrl || imageError) {
    // Fallback gradient background
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50" />
    )
  }

  return (
    <>
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={logoUrl}
          alt="Foraypay Background"
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
          loading="eager"
          onError={() => setImageError(true)}
        />
      </div>
      {/* Light overlay for minimal text readability - reduced opacity for clearer image */}
      <div className="absolute inset-0 bg-white/20" />
      {/* Subtle gradient overlay only at bottom for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/30" />
    </>
  )
}

