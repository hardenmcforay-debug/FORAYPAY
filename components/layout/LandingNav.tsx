'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Ticket, Menu, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getValidImageUrl, isValidImageUrl, addCacheBuster } from '@/lib/utils/image-helpers'

interface LandingNavProps {
  logoUrl?: string | null
}

export default function LandingNav({ logoUrl: propLogoUrl }: LandingNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [useImgTag, setUseImgTag] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(propLogoUrl || null)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Update logoUrl when prop changes
  useEffect(() => {
    if (propLogoUrl && isValidImageUrl(propLogoUrl)) {
      // Add cache-busting to force reload when image changes
      const urlWithCacheBust = addCacheBuster(propLogoUrl)
      setLogoUrl(urlWithCacheBust)
      setLogoError(false) // Reset error when new URL is provided
      setUseImgTag(false) // Reset img tag fallback
      console.log('Nav logo URL updated:', urlWithCacheBust)
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
      console.log('Nav logo fetched from Supabase:', fetchedUrl)
    } else {
      // Fallback to public folder
      setLogoUrl('/logo.png')
      console.log('Nav logo using fallback')
    }
  }, [propLogoUrl])

  // Use the current logoUrl state, validate it
  // Memoize to prevent unnecessary recalculations
  const logoPath = useMemo(() => {
    if (logoUrl && isValidImageUrl(logoUrl)) {
      return logoUrl
    }
    return '/logo.png'
  }, [logoUrl])

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              {!logoError && logoPath && logoPath !== '/logo.png' ? (
                useImgTag ? (
                  <img
                    key={logoPath} // Force re-render when path changes
                    src={logoPath}
                    alt="Foraypay Logo"
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
                    loading="eager"
                    decoding="async"
                    onError={() => {
                      console.error('Nav logo image failed to load:', logoPath)
                      setLogoError(true)
                    }}
                    onLoad={() => {
                      console.log('Nav logo loaded successfully (img tag):', logoPath)
                    }}
                    style={{ display: 'block' }}
                  />
                ) : (
                  <div key={logoPath} className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <Image
                      src={logoPath}
                      alt="Foraypay Logo"
                      fill
                      className="object-contain"
                      onError={() => {
                        console.warn('Nav Next.js Image failed, trying regular img tag:', logoPath)
                        setUseImgTag(true)
                      }}
                      onLoad={() => {
                        console.log('Nav logo loaded successfully (Next.js Image):', logoPath)
                      }}
                      priority
                      quality={85}
                      sizes="(max-width: 640px) 32px, 40px"
                      loading="eager"
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-600 flex-shrink-0">
                  <Ticket className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              )}
              <span className="text-lg sm:text-xl font-bold">
                <span className="text-primary-600 font-bold">Foray</span>
                <span className="text-success-600">pay</span>
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              About
            </Link>
            <Link href="/landing#how-it-works" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              How It Works
            </Link>
            <Link href="/landing#features" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Features
            </Link>
            <Link href="/passenger/retrieve" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Retrieve Ticket
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
              Contact
            </Link>
          </div>
          
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/setup">
              <Button>Get Started</Button>
            </Link>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/login" className="flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1.5 text-sm font-semibold border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 transition-all"
              >
                Sign In
              </Button>
            </Link>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/landing#how-it-works" 
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/landing#features" 
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/passenger/retrieve" 
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Retrieve Ticket
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-primary-600 transition-colors font-medium px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </Link>
                <Link href="/setup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

