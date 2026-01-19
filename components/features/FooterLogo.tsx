'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getValidImageUrl, isValidImageUrl, addCacheBuster } from '@/lib/utils/image-helpers'

interface FooterLogoProps {
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function FooterLogo({ logoUrl: propLogoUrl, size = 'sm' }: FooterLogoProps) {
  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'h-6 w-6', image: '40px' },
    md: { container: 'w-16 h-16', icon: 'h-8 w-8', image: '64px' },
    lg: { container: 'w-20 h-20', icon: 'h-10 w-10', image: '80px' },
    xl: { container: 'w-24 h-24', icon: 'h-12 w-12', image: '96px' }
  }
  
  const currentSize = sizes[size]
  const [logoError, setLogoError] = useState(false)
  const [useImgTag, setUseImgTag] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(propLogoUrl || null)

  // Update logoUrl when prop changes
  useEffect(() => {
    if (propLogoUrl && isValidImageUrl(propLogoUrl)) {
      const urlWithCacheBust = addCacheBuster(propLogoUrl)
      setLogoUrl(urlWithCacheBust)
      setLogoError(false)
      setUseImgTag(false)
      return
    }

    // Only fetch if no prop provided or prop is invalid
    const supabase = createClient()
    
    // Try to get navigation logo from Supabase storage
    // First try nav-logo.png, then fallback to logo.png
    let fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/nav-logo.png', true)
    if (!fetchedUrl) {
      fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/logo.png', true)
    }
    
    if (fetchedUrl) {
      setLogoUrl(fetchedUrl)
    } else {
      // Fallback to public folder
      setLogoUrl('/logo.png')
    }
  }, [propLogoUrl])

  // Use the current logoUrl state, validate it
  const logoPath = useMemo(() => {
    if (logoUrl && isValidImageUrl(logoUrl)) {
      return logoUrl
    }
    return '/logo.png'
  }, [logoUrl])

  if (!logoError && logoPath && logoPath !== '/logo.png') {
    if (useImgTag) {
      return (
        <img
          key={logoPath}
          src={logoPath}
          alt="Foraypay Logo"
          className={`${currentSize.container} object-contain flex-shrink-0`}
          loading="eager"
          decoding="async"
          onError={() => {
            setLogoError(true)
          }}
          style={{ display: 'block' }}
        />
      )
    } else {
      return (
        <div key={logoPath} className={`relative ${currentSize.container} flex-shrink-0`}>
          <Image
            src={logoPath}
            alt="Foraypay Logo"
            fill
            className="object-contain"
            onError={() => {
              setUseImgTag(true)
            }}
            priority
            quality={85}
            sizes={currentSize.image}
            loading="eager"
          />
        </div>
      )
    }
  } else {
    return (
      <div className={`flex items-center justify-center ${currentSize.container} rounded-lg bg-primary-600 flex-shrink-0`}>
        <Ticket className={`${currentSize.icon} text-white`} />
      </div>
    )
  }
}

