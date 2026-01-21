import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import LandingLogo from '@/components/features/LandingLogo'
import LandingNav from '@/components/layout/LandingNav'
import FeatureCards from '@/components/features/FeatureCards'
import FAQ from '@/components/features/FAQ'
import FooterLogo from '@/components/features/FooterLogo'
import Image from 'next/image'
import { getValidImageUrl } from '@/lib/utils/image-helpers'
import { cn } from '@/lib/utils'
import { 
  Ticket,
  Shield, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CheckCircle, 
  BarChart3,
  Smartphone,
  Lock,
  Zap,
  ArrowRight,
  Building2,
  Route,
  UserCheck,
  Hand,
  Eye,
  Star
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = createClient()
  
  // Get navigation bar logo URL from Supabase storage
  // Try nav-logo.png first, then fallback to logo.png
  // Add cache-busting to force reload when image is updated
  let navLogoUrl = getValidImageUrl(supabase, 'landing-images', 'logo/nav-logo.png', true)
  if (!navLogoUrl) {
    navLogoUrl = getValidImageUrl(supabase, 'landing-images', 'logo/logo.png', true)
  }

  // Get hero section logo URL from Supabase storage
  const heroLogoUrl = getValidImageUrl(supabase, 'landing-images', 'logo/foraypay-logo.png', true)

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Logo URLs ===')
    console.log('Nav Logo URL:', navLogoUrl)
    console.log('Hero Logo URL:', heroLogoUrl)
    console.log('================')
  }

  // Get hero picture URL from Supabase storage
  // Primary path: hero/hero-picture.jpg
  const { data: heroPictureData } = supabase.storage
    .from('landing-images')
    .getPublicUrl('hero/hero-picture.jpg')
  
  const heroPictureUrl = heroPictureData?.publicUrl || null
  
  // Get cash handling image URL from Supabase storage
  // Primary path: problems/cash-handling.jpg
  const cashHandlingImageUrl = getValidImageUrl(supabase, 'landing-images', 'problems/cash-handling.jpg', true) || '/cash-handling-image.jpg'
  
  // Get under-reporting image URL from Supabase storage
  // Primary path: problems/under-reporting.jpg
  const underReportingImageUrl = getValidImageUrl(supabase, 'landing-images', 'problems/under-reporting.jpg', true) || '/under-reporting-image.jpg'
  
  // Get no visibility image URL from Supabase storage
  // Primary path: problems/no-visibility.jpg
  const noVisibilityImageUrl = getValidImageUrl(supabase, 'landing-images', 'problems/no-visibility.jpg', true) || '/no-visibility-image.jpg'
  
  // If the image doesn't load, you can add a cache-busting query parameter
  // const heroPictureUrl = heroPictureData?.publicUrl ? `${heroPictureData.publicUrl}?t=${Date.now()}` : null

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <LandingNav logoUrl={navLogoUrl} />

      {/* Hero Section */}
      <section className="hero-section relative min-h-[500px] sm:min-h-[600px] md:min-h-[700px] lg:min-h-[800px] flex items-start justify-center overflow-x-hidden">
        {/* White background */}
        <div className="absolute inset-0 bg-white"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-8 md:-mt-12 pb-12 sm:pb-20 md:pb-24">
          <div className="grid lg:grid-cols-[60%_40%] gap-8 lg:gap-12 items-start">
            {/* Left side: Logo and content */}
            <div className="text-center lg:text-left relative w-full">
              {/* Logo as Background with Caption Overlay */}
              <div className="relative -mb-20 sm:-mb-14 md:mb-6 hero-logo-container overflow-visible w-full">
                <LandingLogo logoUrl={heroLogoUrl} />
                <div className="absolute top-20 sm:top-24 md:top-32 right-4 sm:right-8 md:right-12 lg:right-72 z-20">
                <div className="inline-flex items-center gap-1.5 md:gap-3.5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-7 md:py-3.5 rounded-lg md:rounded-2xl bg-white/90 backdrop-blur-xl border-2 border-primary-600/20 shadow-2xl animate-fade-in-up">
                  <div className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 md:w-7 md:h-7 rounded-md md:rounded-lg bg-primary-600 shadow-md flex-shrink-0">
                    <Zap className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-4 md:w-4 text-white" fill="currentColor" />
                  </div>
                  <span className="text-gray-900 text-[10px] xs:text-xs sm:text-sm md:text-base font-bold tracking-tight whitespace-nowrap">
                    Digital Transport Infrastructure for Africa
                  </span>
                </div>
              </div>
              <div className="relative -mt-24 sm:-mt-18 md:mt-2 lg:absolute lg:top-[65%] lg:left-0 lg:transform-none lg:w-full lg:px-0 z-20">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">
                  Stop Revenue Leakage.
                  <br />
                  <span className="text-primary-600">Start Digital Control.</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-gray-900 max-w-3xl mx-auto lg:mx-0 mb-6 md:mb-8">
                  Replace cash with verifiable digital payments.
                  <br />
                  Gain real-time visibility into every transaction.
                  <br />
                  Eliminate disputes and under-reporting.
                  <br />
                  <strong className="text-primary-600 block text-center lg:text-left">One Tap. One Ticket.</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6 md:mb-8">
                  <Link href="/setup">
                    <Button size="md" className="w-full sm:w-auto shadow-xl">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline" size="md" className="w-full sm:w-auto bg-white/90 backdrop-blur-sm shadow-xl">
                      See How It Works
                    </Button>
                  </Link>
                </div>

                {/* Icon-based Rating System */}
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-5 justify-start ml-6 sm:ml-0">
                  <div className="flex items-center gap-3">
                    {/* Star Icons */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-8 w-8 cursor-pointer transition-all duration-200',
                            'hover:scale-125 hover:rotate-12',
                            'animate-star-twinkle',
                            star <= 5 
                              ? 'fill-warning-500 text-warning-500 hover:fill-warning-600 hover:text-warning-600' 
                              : 'text-gray-300 hover:text-warning-400 hover:fill-warning-400'
                          )}
                          style={{
                            animationDelay: `${star * 0.2}s`,
                            animationDuration: `${2 + star * 0.3}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-success-600" />
                    <span className="font-medium">Trusted by 500+ companies</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
            
            {/* Right side: Picture */}
            <div className="hidden lg:block relative w-full flex items-center justify-end mt-32 lg:mt-40 -mr-24 lg:-mr-32">
              {heroPictureUrl ? (
                <div className="relative w-full max-w-[75%] aspect-[9/14] rounded-3xl p-2 shadow-2xl" style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #2563EB 33%, #F59E0B 66%, #FFFFFF 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-border 3s ease infinite, float 3s ease-in-out infinite'
                }}>
                  <div className="relative w-full h-full rounded-3xl overflow-hidden">
                    <Image
                      src={heroPictureUrl}
                      alt="Foraypay - Digital Transport Payment"
                      fill
                      className="object-cover"
                      priority
                      quality={80}
                      sizes="(max-width: 1024px) 0vw, 50vw"
                      loading="eager"
                    />
                  </div>
                  {/* Caption at top right corner */}
                  <div className="absolute top-12 -right-24 z-30">
                      <div className="inline-flex items-center gap-3.5 px-6 py-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-lg animate-fade-in-up">
                        <div className="flex flex-col leading-tight">
                          <span className="text-base font-bold text-gray-900">ONE TAP</span>
                          <span className="text-base font-bold text-gray-900">ONE TICKET</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Hand className="h-6 w-6 text-primary-600" />
                          <Ticket className="h-6 w-6 text-success-600" />
                        </div>
                      </div>
                  </div>
                  {/* Caption at bottom left corner */}
                  <div className="absolute bottom-6 -left-20 z-30">
                    <div className="flex flex-col gap-2.5 px-6 py-4 rounded-xl bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-lg animate-fade-in-up">
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-base font-bold text-gray-900">SIMPLE</span>
                        <CheckCircle className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-base font-bold text-gray-900">SECURE</span>
                        <Shield className="h-6 w-6 text-success-600" />
                      </div>
                      <div className="flex items-center justify-between gap-2.5">
                        <span className="text-base font-bold text-gray-900">TRANSPARENT</span>
                        <Eye className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-[9/14] rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm">Hero picture placeholder</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-sky-100">
        <div className="lg:container lg:mx-auto p-5 lg:px-14">
          <div className="text-center justify-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Transport Companies Lose Revenue Every Day
            </h2>
            <p className="mt-3 text-lg lg:w-1/2 lg:mx-auto text-gray-700">
              Cash handling creates opportunities for leakage, disputes, and lack of transparency
            </p>
          </div>
          <div className="overflow-hidden mt-6">
            <div className="border-2 border-white rounded-lg p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {cashHandlingImageUrl && (
                  <div className="border-2 border-white rounded-lg overflow-hidden">
                    <Image
                      src={cashHandlingImageUrl}
                      alt="Cash-based transport operations create daily revenue leakage"
                      width={2048}
                      height={1152}
                      className="w-full h-auto"
                      quality={80}
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                    />
                  </div>
                )}
                {underReportingImageUrl && (
                  <div className="border-2 border-white rounded-lg overflow-hidden">
                    <Image
                      src={underReportingImageUrl}
                      alt="Under-reporting problem - revenue tracking issues"
                      width={2048}
                      height={1152}
                      className="w-full h-auto"
                      quality={80}
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                    />
                  </div>
                )}
                {noVisibilityImageUrl && (
                  <div className="border-2 border-white rounded-lg overflow-hidden">
                    <Image
                      src={noVisibilityImageUrl}
                      alt="No visibility problem - lack of data and transparency"
                      width={2048}
                      height={1152}
                      className="w-full h-auto"
                      quality={80}
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <div className="text-center lg:text-start mt-4 lg:mt-0">
                  <DollarSign className="h-10 w-10 text-primary-600 mr-2 inline-block" aria-hidden="true" style={{ fontSize: '40px' }} />
                  <p className="mt-3 text-lg font-semibold text-gray-900">
                    Cash handling leakage
                  </p>
                  <p className="mt-3 text-gray-700">
                    Loose cash, manual counting, and paper tickets make it easy for money to
                    disappear before it ever reaches your bank account.
                  </p>
                </div>

                <div className="text-center lg:text-start mt-4 lg:mt-0">
                  <TrendingUp className="h-10 w-10 text-primary-600 mr-2 inline-block" aria-hidden="true" style={{ fontSize: '40px' }} />
                  <p className="mt-3 text-lg font-semibold text-gray-900">
                    Under-reported trips
                  </p>
                  <p className="mt-3 text-gray-700">
                    Without a digital trail, park operators can under-report passenger counts,
                    routes, and fares—eroding your daily revenue.
                  </p>
                </div>

                <div className="text-center lg:text-start mt-4 lg:mt-0">
                  <BarChart3 className="h-10 w-10 text-primary-600 mr-2 inline-block" aria-hidden="true" style={{ fontSize: '40px' }} />
                  <p className="mt-3 text-lg font-semibold text-gray-900">
                    No real-time visibility
                  </p>
                  <p className="mt-3 text-gray-700">
                    When everything is offline and manual, you can&apos;t see what&apos;s
                    happening in your parks today—only what was reported yesterday.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-success-100 text-success-700 text-sm font-medium mb-4">
                <CheckCircle className="h-4 w-4 mr-2" />
                B2B Transport Infrastructure
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Digital Ticketing That Puts You in Control
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Foraypay is not a consumer app. It&apos;s infrastructure software built for transport companies 
                who need transparency, enforcement, and data integrity—not just convenience.
              </p>
              <ul className="space-y-4">
                {[
                  'Verifiable digital payments via MoniMe',
                  'Real-time revenue dashboards by route',
                  'Server-controlled ticket validation',
                  'Complete audit trail of all transactions',
                  'Multi-tenant architecture with strict data isolation',
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl p-4 md:p-8 shadow-xl">
                <div className="bg-white rounded-lg p-3 md:p-6 mb-3 md:mb-4 shadow-md">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Today&apos;s Revenue</p>
                      <p className="text-xl md:text-3xl font-bold text-gray-900">SLL 2,450,000</p>
                    </div>
                    <TrendingUp className="h-5 w-5 md:h-8 md:w-8 text-success-600" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Freetown - Bo</span>
                      <span className="font-semibold">SLL 850,000</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Freetown - Makeni</span>
                      <span className="font-semibold">SLL 1,200,000</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Freetown - Kenema</span>
                      <span className="font-semibold">SLL 400,000</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 md:p-6 shadow-md">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <p className="text-sm md:text-base font-semibold text-gray-900">Active Tickets</p>
                    <Ticket className="h-4 w-4 md:h-6 md:w-6 text-primary-600" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    {[
                      { order: 'ORD-A7B2F9', route: 'Freetown - Bo', fare: 'SLL 15,000' },
                      { order: 'ORD-C4E8D1', route: 'Freetown - Makeni', fare: 'SLL 20,000' },
                      { order: 'ORD-F3B6A2', route: 'Freetown - Kenema', fare: 'SLL 12,000' },
                    ].map((ticket, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary-50 hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary-200 border border-transparent group"
                      >
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">Order #: {ticket.order}</p>
                          <p className="text-[10px] md:text-xs text-gray-500 group-hover:text-gray-600 transition-colors">{ticket.route} • {ticket.fare}</p>
                        </div>
                        <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-warning-100 text-warning-700 text-[10px] md:text-xs font-medium rounded group-hover:bg-warning-200 group-hover:shadow-sm transition-all">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and transparent—from payment to validation
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-8">
            {[
              {
                step: '1',
                icon: Smartphone,
                title: 'Passenger Pays',
                description: 'Passenger pays fare using MoniMe and receives Order Number',
                color: 'text-primary-600',
                bgColor: 'bg-primary-50',
              },
              {
                step: '2',
                icon: Ticket,
                title: 'Ticket Generated',
                description: 'System creates verifiable digital ticket linked to transaction',
                color: 'text-success-600',
                bgColor: 'bg-success-50',
              },
              {
                step: '3',
                icon: UserCheck,
                title: 'Operator Validates',
                description: 'Park operator validates ticket using order number before boarding',
                color: 'text-warning-600',
                bgColor: 'bg-warning-50',
              },
              {
                step: '4',
                icon: BarChart3,
                title: 'Revenue Tracked',
                description: 'Real-time revenue data appears in company dashboard',
                color: 'text-error-600',
                bgColor: 'bg-error-50',
              },
            ].map((step, index) => {
              const Icon = step.icon
              const isPassengerPays = step.title === 'Passenger Pays'
              const isTicketGenerated = step.title === 'Ticket Generated'
              const isOperatorValidates = step.title === 'Operator Validates'
              const isRevenueTracked = step.title === 'Revenue Tracked'
              
              return (
                <div key={index} className="relative flex">
                  {index < 3 && (
                    <div className="absolute top-6 md:top-12 left-full w-full h-0.5 bg-gray-300 -z-10">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Vector Graphic for Passenger Pays Card */}
                  {isPassengerPays && (
                    <div className="absolute -top-8 md:-top-16 left-1/2 transform -translate-x-1/2 w-full max-w-[800px] h-40 md:h-80 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 280 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="phoneBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="100%" stopColor="#111827" />
                          </linearGradient>
                          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#F3F4F6" />
                          </linearGradient>
                          <linearGradient id="payButtonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <filter id="phoneShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="otpShadow3D">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="1" dy="3" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Realistic smartphone - 3D */}
                        <g className="passenger-phone-group group-hover:scale-105 transition-transform duration-300" transform="translate(60, 10)" filter="url(#phoneShadow3D)">
                          {/* Phone shadow for 3D depth */}
                          <ellipse 
                            cx="27.5" 
                            cy="100" 
                            rx="20" 
                            ry="3" 
                            fill="#000000" 
                            opacity="0.2"
                          />
                          {/* Phone frame/body - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="55" 
                            height="95" 
                            rx="8" 
                            fill="url(#phoneBodyGradient)" 
                            stroke="#030712" 
                            strokeWidth="2"
                          />
                          {/* Phone side highlight for 3D */}
                          <rect 
                            x="0" 
                            y="2" 
                            width="3" 
                            height="91" 
                            rx="1" 
                            fill="#FFFFFF" 
                            opacity="0.1"
                          />
                          
                          {/* Phone notch */}
                          <rect 
                            x="20" 
                            y="0" 
                            width="15" 
                            height="4" 
                            rx="2" 
                            fill="#111827"
                          />
                          
                          {/* Screen */}
                          <rect 
                            x="3" 
                            y="6" 
                            width="49" 
                            height="83" 
                            rx="5" 
                            fill="url(#screenGradient)" 
                            stroke="#E5E7EB" 
                            strokeWidth="1"
                          />
                          
                          {/* Status bar */}
                          <rect 
                            x="4" 
                            y="7" 
                            width="47" 
                            height="6" 
                            rx="4" 
                            fill="#F9FAFB"
                          />
                          
                          {/* Battery and signal icons */}
                          <rect x="42" y="9" width="4" height="2" rx="0.5" fill="#6B7280" />
                          <circle cx="39" cy="10" r="1" fill="#6B7280" />
                          
                          {/* App header */}
                          <rect 
                            x="5" 
                            y="15" 
                            width="45" 
                            height="12" 
                            rx="2" 
                            fill="#2563EB" 
                            opacity="0.1"
                          />
                          
                          {/* MoniMe logo circle */}
                          <circle cx="12" cy="21" r="4" fill="#2563EB" />
                          <text 
                            x="12" 
                            y="23" 
                            textAnchor="middle" 
                            fontSize="5" 
                            fill="#FFFFFF" 
                            fontWeight="bold"
                          >
                            MM
                          </text>
                          
                          {/* MoniMe text */}
                          <text 
                            x="20" 
                            y="22" 
                            fontSize="7" 
                            fill="#1F2937" 
                            fontWeight="bold"
                          >
                            MoniMe
                          </text>
                          
                          {/* Amount section */}
                          <text 
                            x="27.5" 
                            y="38" 
                            textAnchor="middle" 
                            fontSize="6" 
                            fill="#6B7280"
                          >
                            Amount
                          </text>
                          
                          {/* Amount value */}
                          <text 
                            x="27.5" 
                            y="50" 
                            textAnchor="middle" 
                            fontSize="12" 
                            fill="#1F2937" 
                            fontWeight="bold"
                            className="group-hover:fill-[#2563EB] transition-colors duration-300"
                          >
                            SLL 15,000
                          </text>
                          
                          {/* Payment button - 3D */}
                          <rect 
                            x="8" 
                            y="58" 
                            width="39" 
                            height="10" 
                            rx="5" 
                            fill="url(#payButtonGradient)" 
                            className="passenger-pay-button group-hover:opacity-90 transition-opacity duration-300"
                            filter="url(#phoneShadow3D)"
                          />
                          {/* Button highlight for 3D */}
                          <rect 
                            x="9" 
                            y="59" 
                            width="37" 
                            height="4" 
                            rx="4" 
                            fill="#FFFFFF" 
                            opacity="0.3"
                          />
                          <text 
                            x="27.5" 
                            y="64" 
                            textAnchor="middle" 
                            fontSize="7" 
                            fill="#FFFFFF" 
                            fontWeight="bold"
                          >
                            PAY
                          </text>
                          
                          {/* Home indicator */}
                          <rect 
                            x="20" 
                            y="88" 
                            width="15" 
                            height="2" 
                            rx="1" 
                            fill="#9CA3AF"
                          />
                        </g>
                        
                        {/* OTP notification card - 3D */}
                        <g className="passenger-otp-group group-hover:scale-110 transition-transform duration-300" transform="translate(160, 25)" filter="url(#otpShadow3D)">
                          {/* Notification shadow for 3D */}
                          <ellipse 
                            cx="42.5" 
                            cy="50" 
                            rx="40" 
                            ry="4" 
                            fill="#000000" 
                            opacity="0.15"
                          />
                          {/* Notification card background - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="85" 
                            height="46" 
                            rx="6" 
                            fill="#10B981" 
                            stroke="#047857" 
                            strokeWidth="2"
                            className="group-hover:fill-[#059669] transition-colors duration-300"
                          />
                          {/* Card highlight for 3D */}
                          <rect 
                            x="2" 
                            y="2" 
                            width="81" 
                            height="12" 
                            rx="5" 
                            fill="#FFFFFF" 
                            opacity="0.2"
                          />
                          
                          {/* Notification header */}
                          <rect 
                            x="2" 
                            y="2" 
                            width="81" 
                            height="10" 
                            rx="5" 
                            fill="#047857" 
                            opacity="0.3"
                          />
                          
                          {/* Notification icon */}
                          <circle cx="6" cy="7" r="2" fill="#FFFFFF" />
                          <path 
                            d="M 5 7 L 5.5 7.5 L 7 6" 
                            stroke="#10B981" 
                            strokeWidth="0.5" 
                            fill="none" 
                            strokeLinecap="round"
                          />
                          
                          {/* OTP label */}
                          <text 
                            x="42.5" 
                            y="9" 
                            textAnchor="middle" 
                            fontSize="6" 
                            fill="#FFFFFF" 
                            fontWeight="bold"
                          >
                            Your OTP Code
                          </text>
                          
                          {/* OTP digits box */}
                          <rect 
                            x="8" 
                            y="16" 
                            width="69" 
                            height="18" 
                            rx="4" 
                            fill="#FFFFFF" 
                            opacity="0.2"
                            className="group-hover:opacity-0.3 transition-opacity duration-300"
                          />
                          
                          {/* OTP digits */}
                          <text 
                            x="42.5" 
                            y="28" 
                            textAnchor="middle" 
                            fontSize="16" 
                            fill="#FFFFFF" 
                            fontWeight="bold" 
                            letterSpacing="2"
                            fontFamily="monospace"
                            className="passenger-otp-digits group-hover:letter-spacing-[3px] transition-all duration-300"
                          >
                            123456
                          </text>
                          
                          {/* Copy/expires text */}
                          <text 
                            x="42.5" 
                            y="38" 
                            textAnchor="middle" 
                            fontSize="5" 
                            fill="#D1FAE5" 
                            opacity="0.9"
                          >
                            Valid for 5 minutes
                          </text>
                        </g>
                        
                        {/* Payment flow indicator arrows */}
                        <g className="group-hover:opacity-80 transition-opacity duration-300" opacity="0.6">
                          <path 
                            d="M 120 55 L 155 55" 
                            stroke="#2563EB" 
                            strokeWidth="2" 
                            fill="none" 
                            markerEnd="url(#arrowBlue)"
                          />
                          <defs>
                            <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                              <polygon points="0 0, 10 3, 0 6" fill="#2563EB" />
                            </marker>
                          </defs>
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* Vector Graphic for Ticket Generated Card */}
                  {isTicketGenerated && (
                    <div className="absolute -top-8 md:-top-16 left-1/2 transform -translate-x-1/2 w-full max-w-[800px] h-40 md:h-80 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 280 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="ticketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#F0FDF4" />
                          </linearGradient>
                          <linearGradient id="ticketHeaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="100%" stopColor="#111827" />
                          </linearGradient>
                          <filter id="ticketShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <pattern id="qrPattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                            <rect width="2" height="2" fill="#1F2937" />
                            <rect x="2" y="2" width="2" height="2" fill="#1F2937" />
                          </pattern>
                        </defs>
                        
                        {/* Digital Ticket - 3D */}
                        <g className="ticket-ticket-group group-hover:scale-105 transition-transform duration-300" transform="translate(80, 8)" filter="url(#ticketShadow3D)">
                          {/* Ticket shadow for 3D depth */}
                          <ellipse 
                            cx="60" 
                            cy="85" 
                            rx="55" 
                            ry="4" 
                            fill="#000000" 
                            opacity="0.2"
                          />
                          {/* Ticket body - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="120" 
                            height="80" 
                            rx="6" 
                            fill="url(#ticketGradient)" 
                            stroke="#047857" 
                            strokeWidth="2.5"
                            className="group-hover:stroke-[#059669] transition-colors duration-300"
                          />
                          {/* Ticket side highlight for 3D */}
                          <rect 
                            x="0" 
                            y="2" 
                            width="4" 
                            height="76" 
                            rx="3" 
                            fill="#FFFFFF" 
                            opacity="0.3"
                          />
                          
                          {/* Ticket header */}
                          <rect 
                            x="2" 
                            y="2" 
                            width="116" 
                            height="18" 
                            rx="5" 
                            fill="url(#ticketHeaderGradient)" 
                            className="group-hover:opacity-90 transition-opacity duration-300"
                          />
                          
                          {/* Ticket title */}
                          <text 
                            x="60" 
                            y="14" 
                            textAnchor="middle" 
                            fontSize="8" 
                            fill="#FFFFFF" 
                            fontWeight="bold"
                          >
                            DIGITAL TICKET
                          </text>
                          
                          {/* QR Code section */}
                          <g transform="translate(15, 25)">
                            {/* QR Code background */}
                            <rect 
                              x="0" 
                              y="0" 
                              width="30" 
                              height="30" 
                              rx="2" 
                              fill="#FFFFFF" 
                              stroke="#E5E7EB" 
                              strokeWidth="1"
                            />
                            
                            {/* QR Code pattern */}
                            <g className="ticket-qr-pattern">
                              {/* Corner squares */}
                              <rect x="2" y="2" width="8" height="8" fill="#1F2937" />
                              <rect x="20" y="2" width="8" height="8" fill="#1F2937" />
                              <rect x="2" y="20" width="8" height="8" fill="#1F2937" />
                              
                              {/* Inner pattern */}
                              <rect x="4" y="4" width="4" height="4" fill="#FFFFFF" />
                              <rect x="22" y="4" width="4" height="4" fill="#FFFFFF" />
                              <rect x="4" y="22" width="4" height="4" fill="#FFFFFF" />
                              
                              {/* Data pattern */}
                              <rect x="12" y="4" width="2" height="2" fill="#1F2937" />
                              <rect x="16" y="4" width="2" height="2" fill="#1F2937" />
                              <rect x="4" y="12" width="2" height="2" fill="#1F2937" />
                              <rect x="8" y="12" width="4" height="4" fill="#1F2937" />
                              <rect x="14" y="12" width="2" height="2" fill="#1F2937" />
                              <rect x="18" y="12" width="2" height="2" fill="#1F2937" />
                              <rect x="12" y="16" width="2" height="2" fill="#1F2937" />
                              <rect x="16" y="16" width="2" height="2" fill="#1F2937" />
                              <rect x="20" y="16" width="2" height="2" fill="#1F2937" />
                              <rect x="4" y="20" width="2" height="2" fill="#1F2937" />
                              <rect x="8" y="20" width="2" height="2" fill="#1F2937" />
                              <rect x="12" y="22" width="4" height="4" fill="#1F2937" />
                              <rect x="18" y="22" width="2" height="2" fill="#1F2937" />
                              <rect x="22" y="22" width="2" height="2" fill="#1F2937" />
                            </g>
                          </g>
                          
                          {/* Transaction ID */}
                          <text 
                            x="60" 
                            y="65" 
                            textAnchor="middle" 
                            fontSize="6" 
                            fill="#6B7280"
                            fontWeight="500"
                          >
                            Transaction ID
                          </text>
                          <text 
                            x="60" 
                            y="73" 
                            textAnchor="middle" 
                            fontSize="7" 
                            fill="#1F2937" 
                            fontWeight="bold"
                            fontFamily="monospace"
                            className="group-hover:fill-[#10B981] transition-colors duration-300"
                          >
                            #TXN-12345
                          </text>
                          
                          {/* Verification badge */}
                          <g transform="translate(100, 25)">
                            <circle 
                              cx="0" 
                              cy="0" 
                              r="8" 
                              fill="#10B981" 
                              opacity="0.2"
                              className="group-hover:opacity-0.3 group-hover:r-9 transition-all duration-300"
                            />
                            <path 
                              d="M -3 0 L -1 2 L 3 -2" 
                              stroke="#10B981" 
                              strokeWidth="2" 
                              fill="none" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              className="group-hover:stroke-[#059669] transition-colors duration-300"
                            />
                          </g>
                        </g>
                        
                        {/* Processing indicator */}
                        <g className="ticket-processing-group" transform="translate(50, 45)">
                          {/* Spinning circle */}
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="10" 
                            fill="none" 
                            stroke="#10B981" 
                            strokeWidth="2" 
                            opacity="0.4"
                            strokeDasharray="6 3"
                            className="ticket-processing-spin"
                          />
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="6" 
                            fill="#10B981" 
                            opacity="0.2"
                            className="group-hover:opacity-0.4 transition-opacity duration-300"
                          />
                        </g>
                        
                        {/* Chain links representing transaction link */}
                        <g className="ticket-chain-group" transform="translate(210, 35)">
                          {/* Chain links */}
                          <ellipse 
                            cx="0" 
                            cy="8" 
                            rx="6" 
                            ry="4" 
                            fill="#10B981" 
                            opacity="0.3"
                            stroke="#059669" 
                            strokeWidth="1"
                            className="group-hover:opacity-0.5 transition-opacity duration-300"
                          />
                          <ellipse 
                            cx="12" 
                            cy="8" 
                            rx="6" 
                            ry="4" 
                            fill="#10B981" 
                            opacity="0.3"
                            stroke="#059669" 
                            strokeWidth="1"
                            className="group-hover:opacity-0.5 transition-opacity duration-300"
                          />
                          <ellipse 
                            cx="24" 
                            cy="8" 
                            rx="6" 
                            ry="4" 
                            fill="#10B981" 
                            opacity="0.3"
                            stroke="#059669" 
                            strokeWidth="1"
                            className="group-hover:opacity-0.5 transition-opacity duration-300"
                          />
                          {/* Connection lines */}
                          <line 
                            x1="6" 
                            y1="8" 
                            x2="6" 
                            y2="8" 
                            stroke="#059669" 
                            strokeWidth="1.5" 
                            opacity="0.5"
                          />
                          <line 
                            x1="18" 
                            y1="8" 
                            x2="18" 
                            y2="8" 
                            stroke="#059669" 
                            strokeWidth="1.5" 
                            opacity="0.5"
                          />
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* Vector Graphic for Operator Validates Card */}
                  {isOperatorValidates && (
                    <div className="absolute -top-6 md:-top-12 left-1/2 transform -translate-x-[40%] w-full max-w-[800px] h-40 md:h-80 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 280 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="operatorDeviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F9FAFB" />
                            <stop offset="100%" stopColor="#F3F4F6" />
                          </linearGradient>
                          <linearGradient id="operatorScreenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#F9FAFB" />
                          </linearGradient>
                          <linearGradient id="ticketValidateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#F0FDF4" />
                          </linearGradient>
                          <filter id="operatorShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Operator's device/tablet - 3D */}
                        <g className="operator-device-group group-hover:scale-105 transition-transform duration-300" transform="translate(40, 15)" filter="url(#operatorShadow3D)">
                          {/* Device shadow for 3D */}
                          <ellipse 
                            cx="35" 
                            cy="58" 
                            rx="30" 
                            ry="3" 
                            fill="#000000" 
                            opacity="0.15"
                          />
                          {/* Device frame - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="70" 
                            height="50" 
                            rx="4" 
                            fill="url(#operatorDeviceGradient)" 
                            stroke="#9CA3AF" 
                            strokeWidth="2"
                          />
                          {/* Device side highlight for 3D */}
                          <rect 
                            x="0" 
                            y="2" 
                            width="3" 
                            height="46" 
                            rx="2" 
                            fill="#FFFFFF" 
                            opacity="0.2"
                          />
                          
                          {/* Screen */}
                          <rect 
                            x="3" 
                            y="3" 
                            width="64" 
                            height="44" 
                            rx="3" 
                            fill="url(#operatorScreenGradient)" 
                            stroke="#E5E7EB" 
                            strokeWidth="1"
                          />
                          
                          {/* App header */}
                          <rect 
                            x="4" 
                            y="4" 
                            width="62" 
                            height="10" 
                            rx="2" 
                            fill="#F59E0B" 
                            opacity="0.1"
                          />
                          
                          {/* App title */}
                          <text 
                            x="35" 
                            y="11" 
                            textAnchor="middle" 
                            fontSize="7" 
                            fill="#F59E0B" 
                            fontWeight="bold"
                          >
                            Foraypay Validator
                          </text>
                          
                          {/* Ticket preview on screen - 3D */}
                          <g transform="translate(8, 18)">
                            {/* Ticket shadow */}
                            <rect 
                              x="1" 
                              y="1" 
                              width="48" 
                              height="20" 
                              rx="2" 
                              fill="#000000" 
                              opacity="0.1"
                            />
                            <rect 
                              x="0" 
                              y="0" 
                              width="48" 
                              height="20" 
                              rx="2" 
                              fill="url(#ticketValidateGradient)" 
                              stroke="#059669" 
                              strokeWidth="1.5"
                              opacity="0.9"
                            />
                            {/* Ticket highlight */}
                            <rect 
                              x="1" 
                              y="1" 
                              width="46" 
                              height="6" 
                              rx="1" 
                              fill="#FFFFFF" 
                              opacity="0.3"
                            />
                            <text 
                              x="24" 
                              y="8" 
                              textAnchor="middle" 
                              fontSize="5" 
                              fill="#059669" 
                              fontWeight="bold"
                            >
                              TICKET
                            </text>
                            <text 
                              x="24" 
                              y="15" 
                              textAnchor="middle" 
                              fontSize="6" 
                              fill="#1F2937" 
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              #TXN-12345
                            </text>
                          </g>
                        </g>
                        
                        {/* OTP input field - 3D */}
                        <g className="operator-otp-input-group" transform="translate(120, 20)">
                          {/* Input shadow for 3D */}
                          <ellipse 
                            cx="30" 
                            cy="28" 
                            rx="28" 
                            ry="2" 
                            fill="#000000" 
                            opacity="0.1"
                          />
                          {/* Input container - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="60" 
                            height="25" 
                            rx="4" 
                            fill="#FFFFFF" 
                            stroke="#D97706" 
                            strokeWidth="2.5"
                            className="group-hover:stroke-[#D97706] transition-colors duration-300"
                            filter="url(#operatorShadow3D)"
                          />
                          {/* Input highlight for 3D */}
                          <rect 
                            x="1" 
                            y="1" 
                            width="58" 
                            height="8" 
                            rx="3" 
                            fill="#FFFBEB" 
                            opacity="0.5"
                          />
                          
                          {/* Label */}
                          <text 
                            x="30" 
                            y="10" 
                            textAnchor="middle" 
                            fontSize="6" 
                            fill="#92400E" 
                            fontWeight="bold"
                          >
                            Enter OTP
                          </text>
                          
                          {/* OTP input boxes */}
                          <g transform="translate(8, 14)">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <g key={i} transform={`translate(${i * 7}, 0)`}>
                                <rect 
                                  x="0" 
                                  y="0" 
                                  width="6" 
                                  height="8" 
                                  rx="1" 
                                  fill="#FEF3C7" 
                                  stroke="#F59E0B" 
                                  strokeWidth="1"
                                  className="operator-otp-box"
                                />
                                <text 
                                  x="3" 
                                  y="6" 
                                  textAnchor="middle" 
                                  fontSize="5" 
                                  fill="#92400E" 
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  {i + 1}
                                </text>
                              </g>
                            ))}
                          </g>
                        </g>
                        
                        {/* Validation checkmark */}
                        <g className="operator-validate-check" transform="translate(190, 25)">
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="12" 
                            fill="#10B981" 
                            opacity="0.2"
                            className="group-hover:opacity-0.3 group-hover:r-14 transition-all duration-300"
                          />
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="10" 
                            fill="#10B981" 
                            opacity="0.3"
                            className="group-hover:opacity-0.5 transition-opacity duration-300"
                          />
                          <path 
                            d="M -4 0 L -1 3 L 4 -2" 
                            stroke="#FFFFFF" 
                            strokeWidth="2.5" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="group-hover:stroke-[#D1FAE5] transition-colors duration-300"
                          />
                        </g>
                        
                        {/* Boarding gate - 3D */}
                        <g className="operator-gate-group" transform="translate(230, 15)">
                          {/* Gate shadow for 3D */}
                          <ellipse 
                            cx="13" 
                            cy="42" 
                            rx="10" 
                            ry="2" 
                            fill="#000000" 
                            opacity="0.15"
                          />
                          {/* Gate structure - 3D */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="6" 
                            height="40" 
                            rx="1" 
                            fill="#D97706" 
                            opacity="0.6"
                            className="group-hover:opacity-0.8 transition-opacity duration-300"
                          />
                          {/* Gate side highlight */}
                          <rect 
                            x="0" 
                            y="2" 
                            width="2" 
                            height="36" 
                            rx="0.5" 
                            fill="#FFFFFF" 
                            opacity="0.2"
                          />
                          
                          {/* Gate barrier - 3D */}
                          <rect 
                            x="6" 
                            y="18" 
                            width="20" 
                            height="3" 
                            rx="1.5" 
                            fill="#F59E0B" 
                            opacity="0.7"
                            className="operator-gate-barrier group-hover:opacity-0.9 transition-opacity duration-300"
                            filter="url(#operatorShadow3D)"
                          />
                          {/* Barrier highlight */}
                          <rect 
                            x="7" 
                            y="19" 
                            width="18" 
                            height="1" 
                            rx="0.5" 
                            fill="#FFFFFF" 
                            opacity="0.3"
                          />
                          
                          {/* Gate indicator light */}
                          <circle 
                            cx="16" 
                            cy="10" 
                            r="3" 
                            fill="#10B981" 
                            opacity="0.7"
                            className="operator-gate-light group-hover:opacity-0.9 group-hover:r-4 transition-all duration-300"
                          />
                        </g>
                        
                        {/* Validation arrow */}
                        <g className="group-hover:opacity-80 transition-opacity duration-300" opacity="0.6">
                          <path 
                            d="M 115 42 L 185 42" 
                            stroke="#F59E0B" 
                            strokeWidth="2" 
                            fill="none" 
                            markerEnd="url(#arrowWarning)"
                          />
                          <defs>
                            <marker id="arrowWarning" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                              <polygon points="0 0, 10 3, 0 6" fill="#F59E0B" opacity="0.7" />
                            </marker>
                          </defs>
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* Vector Graphic for Revenue Tracked Card */}
                  {isRevenueTracked && (
                    <div className="absolute -top-6 md:-top-12 left-1/2 transform -translate-x-1/2 w-full max-w-[800px] h-40 md:h-80 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 280 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="monitorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="50%" stopColor="#111827" />
                            <stop offset="100%" stopColor="#030712" />
                          </linearGradient>
                          <linearGradient id="screenGradient3D" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#F9FAFB" />
                            <stop offset="50%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#F3F4F6" />
                          </linearGradient>
                          <linearGradient id="dashboardHeaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#DC2626" />
                            <stop offset="100%" stopColor="#B91C1C" />
                          </linearGradient>
                          <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#DC2626" />
                            <stop offset="100%" stopColor="#EF4444" />
                          </linearGradient>
                          <filter id="monitorShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          <filter id="cardShadow3D">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="1" dy="2" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* 3D Monitor/Dashboard */}
                        <g className="revenue-monitor-group group-hover:scale-105 transition-transform duration-300" transform="translate(50, 10)" filter="url(#monitorShadow3D)">
                          {/* Monitor base/stand - 3D perspective */}
                          <ellipse 
                            cx="40" 
                            cy="75" 
                            rx="25" 
                            ry="4" 
                            fill="#111827" 
                            opacity="0.6"
                          />
                          <rect 
                            x="20" 
                            y="70" 
                            width="40" 
                            height="8" 
                            rx="2" 
                            fill="url(#monitorGradient)" 
                            opacity="0.8"
                          />
                          
                          {/* Monitor frame - 3D with perspective */}
                          <rect 
                            x="0" 
                            y="0" 
                            width="80" 
                            height="60" 
                            rx="3" 
                            fill="url(#monitorGradient)" 
                            stroke="#030712" 
                            strokeWidth="1.5"
                          />
                          
                          {/* Screen with 3D depth */}
                          <rect 
                            x="3" 
                            y="3" 
                            width="74" 
                            height="54" 
                            rx="2" 
                            fill="url(#screenGradient3D)" 
                            stroke="#E5E7EB" 
                            strokeWidth="1"
                          />
                          
                          {/* Dashboard header */}
                          <rect 
                            x="4" 
                            y="4" 
                            width="72" 
                            height="10" 
                            rx="2" 
                            fill="url(#dashboardHeaderGradient)" 
                            opacity="0.9"
                          />
                          
                          {/* Dashboard title */}
                          <text 
                            x="40" 
                            y="11" 
                            textAnchor="middle" 
                            fontSize="7" 
                            fill="#FFFFFF" 
                            fontWeight="bold"
                          >
                            Revenue Dashboard
                          </text>
                          
                          {/* Bar chart with 3D effect */}
                          <g transform="translate(8, 18)">
                            {/* Chart background grid */}
                            <line x1="0" y1="20" x2="58" y2="20" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.5" />
                            <line x1="0" y1="15" x2="58" y2="15" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
                            <line x1="0" y1="10" x2="58" y2="10" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
                            <line x1="0" y1="5" x2="58" y2="5" stroke="#E5E7EB" strokeWidth="0.5" opacity="0.3" />
                            
                            {/* 3D bars with gradient and shadow */}
                            {[
                              { x: 2, h: 6, delay: 0 },
                              { x: 10, h: 8, delay: 0.1 },
                              { x: 18, h: 10, delay: 0.2 },
                              { x: 26, h: 12, delay: 0.3 },
                              { x: 34, h: 9, delay: 0.4 },
                              { x: 42, h: 14, delay: 0.5 },
                              { x: 50, h: 11, delay: 0.6 }
                            ].map((bar, i) => (
                              <g key={i} className="revenue-bar-group">
                                {/* Bar shadow for 3D effect */}
                                <rect 
                                  x={bar.x + 1} 
                                  y={20 - bar.h + 1} 
                                  width="5" 
                                  height={bar.h} 
                                  rx="1" 
                                  fill="#991B1B" 
                                  opacity="0.3"
                                />
                                {/* Main bar with gradient */}
                                <rect 
                                  x={bar.x} 
                                  y={20 - bar.h} 
                                  width="5" 
                                  height={bar.h} 
                                  rx="1" 
                                  fill="url(#barGradient)" 
                                  opacity="0.8"
                                  className="revenue-bar"
                                />
                                {/* Bar highlight for 3D shine */}
                                <rect 
                                  x={bar.x + 0.5} 
                                  y={20 - bar.h + 0.5} 
                                  width="2" 
                                  height={bar.h * 0.3} 
                                  rx="0.5" 
                                  fill="#FFFFFF" 
                                  opacity="0.3"
                                />
                              </g>
                            ))}
                          </g>
                          
                          {/* Revenue amount display - 3D card */}
                          <g transform="translate(8, 35)" filter="url(#cardShadow3D)">
                            <rect 
                              x="0" 
                              y="0" 
                              width="64" 
                              height="12" 
                              rx="2" 
                              fill="#DC2626" 
                              opacity="0.1"
                              className="group-hover:opacity-0.15 transition-opacity duration-300"
                            />
                            <text 
                              x="32" 
                              y="9" 
                              textAnchor="middle" 
                              fontSize="8" 
                              fill="#DC2626" 
                              fontWeight="bold"
                              className="group-hover:fill-[#B91C1C] transition-colors duration-300"
                            >
                              SLL 1,250,000
                            </text>
                          </g>
                        </g>
                        
                        {/* Real-time indicator with 3D effect */}
                        <g className="revenue-realtime-group" transform="translate(140, 30)">
                          {/* Outer pulsing ring */}
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="10" 
                            fill="#DC2626" 
                            opacity="0.2"
                            className="revenue-pulse-outer"
                          />
                          {/* Middle ring */}
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="7" 
                            fill="#DC2626" 
                            opacity="0.4"
                            className="revenue-pulse-middle"
                          />
                          {/* Inner dot */}
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="4" 
                            fill="#DC2626" 
                            opacity="0.8"
                            className="group-hover:opacity-1 transition-opacity duration-300"
                          />
                          {/* Real-time text */}
                          <text 
                            x="0" 
                            y="18" 
                            textAnchor="middle" 
                            fontSize="5" 
                            fill="#B91C1C" 
                            fontWeight="bold"
                            className="group-hover:fill-[#991B1B] transition-colors duration-300"
                          >
                            LIVE
                          </text>
                        </g>
                        
                        {/* Revenue stats cards - 3D stacked */}
                        <g className="revenue-stats-group" transform="translate(160, 15)">
                          {/* Today's Revenue card - 3D */}
                          <g filter="url(#cardShadow3D)">
                            <rect 
                              x="0" 
                              y="0" 
                              width="40" 
                              height="30" 
                              rx="3" 
                              fill="#FFFFFF" 
                              stroke="#DC2626" 
                              strokeWidth="1.5"
                              opacity="0.95"
                              className="group-hover:opacity-1 transition-opacity duration-300"
                            />
                            {/* Card shadow for depth */}
                            <rect 
                              x="1" 
                              y="1" 
                              width="40" 
                              height="30" 
                              rx="3" 
                              fill="#DC2626" 
                              opacity="0.1"
                            />
                            <text 
                              x="20" 
                              y="9" 
                              textAnchor="middle" 
                              fontSize="5" 
                              fill="#991B1B" 
                              fontWeight="bold"
                            >
                              TODAY
                            </text>
                            <text 
                              x="20" 
                              y="20" 
                              textAnchor="middle" 
                              fontSize="10" 
                              fill="#DC2626" 
                              fontWeight="bold"
                              className="group-hover:fill-[#B91C1C] transition-colors duration-300"
                            >
                              SLL 250K
                            </text>
                          </g>
                          
                          {/* Weekly Revenue card - 3D stacked */}
                          <g transform="translate(45, 3)" filter="url(#cardShadow3D)">
                            <rect 
                              x="0" 
                              y="0" 
                              width="40" 
                              height="30" 
                              rx="3" 
                              fill="#FFFFFF" 
                              stroke="#DC2626" 
                              strokeWidth="1.5"
                              opacity="0.95"
                              className="group-hover:opacity-1 transition-opacity duration-300"
                            />
                            {/* Card shadow for depth */}
                            <rect 
                              x="1" 
                              y="1" 
                              width="40" 
                              height="30" 
                              rx="3" 
                              fill="#DC2626" 
                              opacity="0.1"
                            />
                            <text 
                              x="20" 
                              y="9" 
                              textAnchor="middle" 
                              fontSize="5" 
                              fill="#991B1B" 
                              fontWeight="bold"
                            >
                              WEEK
                            </text>
                            <text 
                              x="20" 
                              y="20" 
                              textAnchor="middle" 
                              fontSize="10" 
                              fill="#DC2626" 
                              fontWeight="bold"
                              className="group-hover:fill-[#B91C1C] transition-colors duration-300"
                            >
                              SLL 1.2M
                            </text>
                          </g>
                        </g>
                        
                        {/* Growth indicator with 3D arrow */}
                        <g className="revenue-growth-group" transform="translate(250, 20)">
                          {/* Upward arrow with 3D effect */}
                          <path 
                            d="M 5 20 L 5 8 L 0 13 L 5 8 L 10 13 Z" 
                            fill="#10B981" 
                            opacity="0.8"
                            className="group-hover:opacity-1 transition-opacity duration-300"
                            filter="url(#cardShadow3D)"
                          />
                          {/* Arrow shadow */}
                          <path 
                            d="M 6 21 L 6 9 L 1 14 L 6 9 L 11 14 Z" 
                            fill="#10B981" 
                            opacity="0.3"
                          />
                          {/* Growth percentage */}
                          <text 
                            x="5" 
                            y="35" 
                            textAnchor="middle" 
                            fontSize="7" 
                            fill="#10B981" 
                            fontWeight="bold"
                            className="group-hover:fill-[#059669] transition-colors duration-300"
                          >
                            +15%
                          </text>
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  <div className="bg-white rounded-xl pt-24 md:pt-48 pb-3 md:pb-6 px-3 md:px-6 shadow-2xl border-2 border-gray-400 text-center relative hover:shadow-2xl hover:border-gray-500 transition-all h-full flex flex-col">
                    <div className="absolute -top-3 -right-3 w-8 h-8 md:w-10 md:h-10 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs md:text-base font-bold z-10 shadow-md">
                      {step.step}
                    </div>
                    <div className={`${step.bgColor} w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4 shadow-sm`}>
                      <Icon className={`h-6 w-6 md:h-8 md:w-8 ${step.color}`} />
                    </div>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-tight">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Transport Companies</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to eliminate revenue leakage and gain control
            </p>
          </div>
          <FeatureCards />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Transport Companies Choose Foraypay</h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Transparency over convenience. Enforcement over flexibility. Digital control. Full visibility.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-8">
            {[
              { stat: '100%', label: 'Digital Transactions', description: 'No cash handling' },
              { stat: 'Real-Time', label: 'Revenue Visibility', description: 'See every transaction' },
              { stat: 'Zero', label: 'Revenue Leakage', description: 'Verifiable payments' },
              { stat: '24/7', label: 'Access & Control', description: 'Dashboard anytime' },
            ].map((benefit, index) => {
              const isDigitalTransactions = benefit.label === 'Digital Transactions'
              const isRevenueVisibility = benefit.label === 'Revenue Visibility'
              const isRevenueLeakage = benefit.label === 'Revenue Leakage'
              const isAccessControl = benefit.label === 'Access & Control'
              
              return (
                <div key={index} className="text-center pt-8 md:pt-16 relative">
                  {/* 3D Vector Graphic for Digital Transactions Card */}
                  {isDigitalTransactions && (
                    <div className="absolute -top-12 md:-top-24 left-1/2 transform -translate-x-1/2 w-full max-w-[300px] h-24 md:h-48 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 300 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="cashEliminateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#6B7280" stopOpacity="0.2" />
                          </linearGradient>
                          <linearGradient id="digitalCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="50%" stopColor="#1D4ED8" />
                            <stop offset="100%" stopColor="#1E40AF" />
                          </linearGradient>
                          <linearGradient id="phonePaymentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="100%" stopColor="#111827" />
                          </linearGradient>
                          <linearGradient id="digitalFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <filter id="digitalShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Cash being eliminated/converted - 3D */}
                        <g className="digital-cash-eliminate" transform="translate(20, 30)" filter="url(#digitalShadow3D)">
                          {/* Cash bills fading out */}
                          <g opacity="0.4">
                            {/* First bill */}
                            <rect x="0" y="0" width="25" height="15" rx="2" fill="#F59E0B" opacity="0.5" />
                            <rect x="2" y="2" width="21" height="11" rx="1" fill="#D97706" opacity="0.3" />
                            <line x1="5" y1="7" x2="20" y2="7" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
                            {/* Second bill */}
                            <rect x="5" y="8" width="25" height="15" rx="2" fill="#F59E0B" opacity="0.4" transform="rotate(-10 17.5 15.5)" />
                            {/* Third bill */}
                            <rect x="10" y="16" width="25" height="15" rx="2" fill="#F59E0B" opacity="0.3" transform="rotate(15 22.5 23.5)" />
                          </g>
                          
                          {/* X mark indicating elimination */}
                          <g transform="translate(12.5, 7.5)">
                            <circle cx="0" cy="0" r="8" fill="#DC2626" opacity="0.3" />
                            <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                          </g>
                        </g>
                        
                        {/* Conversion arrow - 3D */}
                        <g className="digital-conversion-arrow" transform="translate(70, 40)">
                          <path 
                            d="M 0 0 L 40 0" 
                            stroke="url(#digitalFlowGradient)" 
                            strokeWidth="3" 
                            fill="none" 
                            markerEnd="url(#arrowDigital)"
                            filter="url(#digitalShadow3D)"
                          />
                          <defs>
                            <marker id="arrowDigital" markerWidth="12" markerHeight="12" refX="11" refY="4" orient="auto">
                              <polygon points="0 0, 12 4, 0 8" fill="#10B981" />
                            </marker>
                          </defs>
                        </g>
                        
                        {/* Digital payment cards - 3D stacked */}
                        <g className="digital-cards-group" transform="translate(120, 15)" filter="url(#digitalShadow3D)">
                          {/* Card shadow */}
                          <ellipse cx="30" cy="50" rx="25" ry="3" fill="#000000" opacity="0.2" />
                          
                          {/* Third card (back) */}
                          <rect x="5" y="5" width="50" height="30" rx="4" fill="url(#digitalCardGradient)" opacity="0.4" stroke="#1E40AF" strokeWidth="1.5" />
                          
                          {/* Second card (middle) */}
                          <rect x="2" y="2" width="50" height="30" rx="4" fill="url(#digitalCardGradient)" opacity="0.6" stroke="#1D4ED8" strokeWidth="1.5" />
                          
                          {/* First card (front) - 3D */}
                          <rect x="0" y="0" width="50" height="30" rx="4" fill="url(#digitalCardGradient)" stroke="#2563EB" strokeWidth="2" />
                          {/* Card side highlight */}
                          <rect x="0" y="2" width="3" height="26" rx="2" fill="#FFFFFF" opacity="0.3" />
                          
                          {/* Card chip */}
                          <rect x="8" y="8" width="6" height="5" rx="1" fill="#FBBF24" opacity="0.8" />
                          
                          {/* Card number */}
                          <text x="25" y="20" textAnchor="middle" fontSize="6" fill="#FFFFFF" fontWeight="bold" fontFamily="monospace">
                            •••• 1234
                          </text>
                          
                          {/* Card logo area */}
                          <circle cx="40" cy="10" r="4" fill="#FFFFFF" opacity="0.2" />
                        </g>
                        
                        {/* Mobile payment device - 3D */}
                        <g className="digital-mobile-group" transform="translate(180, 20)" filter="url(#digitalShadow3D)">
                          {/* Phone shadow */}
                          <ellipse cx="20" cy="60" rx="15" ry="2" fill="#000000" opacity="0.2" />
                          
                          {/* Phone body - 3D */}
                          <rect x="0" y="0" width="40" height="70" rx="5" fill="url(#phonePaymentGradient)" stroke="#030712" strokeWidth="2" />
                          {/* Phone side highlight */}
                          <rect x="0" y="2" width="2" height="66" rx="1" fill="#FFFFFF" opacity="0.15" />
                          
                          {/* Screen */}
                          <rect x="3" y="5" width="34" height="50" rx="3" fill="#FFFFFF" opacity="0.95" />
                          
                          {/* Payment interface */}
                          <rect x="6" y="8" width="28" height="8" rx="2" fill="#10B981" opacity="0.2" />
                          <text x="20" y="14" textAnchor="middle" fontSize="5" fill="#059669" fontWeight="bold">PAY</text>
                          
                          {/* Payment amount */}
                          <text x="20" y="30" textAnchor="middle" fontSize="8" fill="#1F2937" fontWeight="bold">SLL 15K</text>
                          
                          {/* NFC/Wave icon */}
                          <g transform="translate(20, 40)">
                            <path d="M -6 0 Q 0 -4, 6 0 Q 0 4, -6 0" fill="#2563EB" opacity="0.3" />
                            <path d="M -4 0 Q 0 -2, 4 0 Q 0 2, -4 0" fill="#2563EB" opacity="0.5" />
                          </g>
                        </g>
                        
                        {/* Digital flow particles - 3D */}
                        <g className="digital-particles" opacity="0.6">
                          <circle cx="100" cy="20" r="2" fill="#10B981" className="digital-particle-1" />
                          <circle cx="140" cy="15" r="1.5" fill="#2563EB" className="digital-particle-2" />
                          <circle cx="160" cy="25" r="2" fill="#10B981" className="digital-particle-3" />
                          <circle cx="200" cy="18" r="1.5" fill="#2563EB" className="digital-particle-4" />
                        </g>
                        
                        {/* Percentage badge - 3D */}
                        <g className="digital-percentage-badge" transform="translate(250, 10)" filter="url(#digitalShadow3D)">
                          {/* Badge shadow */}
                          <ellipse cx="0" cy="15" rx="20" ry="2" fill="#000000" opacity="0.15" />
                          
                          {/* Badge circle - 3D */}
                          <circle cx="0" cy="0" r="18" fill="url(#digitalFlowGradient)" stroke="#047857" strokeWidth="2" />
                          {/* Badge highlight */}
                          <circle cx="-5" cy="-5" r="8" fill="#FFFFFF" opacity="0.3" />
                          
                          {/* 100% text */}
                          <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="bold">100%</text>
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* 3D Vector Graphic for Revenue Visibility Card */}
                  {isRevenueVisibility && (
                    <div className="absolute -top-12 md:-top-24 left-1/2 transform -translate-x-1/2 w-full max-w-[300px] h-24 md:h-48 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 300 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="visibilityScreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="50%" stopColor="#111827" />
                            <stop offset="100%" stopColor="#030712" />
                          </linearGradient>
                          <linearGradient id="visibilityChartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#34D399" />
                          </linearGradient>
                          <linearGradient id="visibilityDataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
                          </linearGradient>
                          <filter id="visibilityShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Real-time dashboard screen - 3D */}
                        <g className="visibility-screen-group" transform="translate(50, 10)" filter="url(#visibilityShadow3D)">
                          {/* Screen shadow */}
                          <ellipse cx="50" cy="55" rx="40" ry="3" fill="#000000" opacity="0.3" />
                          
                          {/* Monitor frame - 3D */}
                          <rect x="0" y="0" width="100" height="70" rx="4" fill="url(#visibilityScreenGradient)" stroke="#030712" strokeWidth="2" />
                          {/* Frame side highlight */}
                          <rect x="0" y="2" width="3" height="66" rx="2" fill="#FFFFFF" opacity="0.1" />
                          
                          {/* Screen - 3D */}
                          <rect x="4" y="4" width="92" height="62" rx="3" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
                          
                          {/* Dashboard header */}
                          <rect x="6" y="6" width="88" height="12" rx="2" fill="#10B981" opacity="0.2" />
                          <text x="50" y="14" textAnchor="middle" fontSize="7" fill="#10B981" fontWeight="bold">REAL-TIME REVENUE</text>
                          
                          {/* Live chart - 3D */}
                          <g transform="translate(10, 22)">
                            {/* Chart background */}
                            <rect x="0" y="0" width="80" height="35" rx="2" fill="#1E293B" opacity="0.5" />
                            
                            {/* Chart grid lines */}
                            <line x1="0" y1="35" x2="80" y2="35" stroke="#334155" strokeWidth="0.5" />
                            <line x1="0" y1="28" x2="80" y2="28" stroke="#334155" strokeWidth="0.5" opacity="0.5" />
                            <line x1="0" y1="21" x2="80" y2="21" stroke="#334155" strokeWidth="0.5" opacity="0.5" />
                            
                            {/* Real-time line chart with 3D effect */}
                            <path 
                              d="M 5 30 Q 15 25, 25 20 T 45 15 Q 55 12, 65 10 T 75 8" 
                              stroke="url(#visibilityChartGradient)" 
                              strokeWidth="2.5" 
                              fill="none" 
                              className="visibility-chart-line"
                            />
                            {/* Chart fill gradient */}
                            <path 
                              d="M 5 30 Q 15 25, 25 20 T 45 15 Q 55 12, 65 10 T 75 8 L 75 35 L 5 35 Z" 
                              fill="url(#visibilityDataGradient)" 
                              opacity="0.4"
                            />
                            
                            {/* Data points - 3D */}
                            {[
                              { x: 15, y: 25 },
                              { x: 25, y: 20 },
                              { x: 35, y: 18 },
                              { x: 45, y: 15 },
                              { x: 55, y: 12 },
                              { x: 65, y: 10 },
                              { x: 75, y: 8 }
                            ].map((point, i) => (
                              <g key={i}>
                                {/* Point shadow */}
                                <circle cx={point.x} cy={point.y + 1} r="3" fill="#000000" opacity="0.3" />
                                {/* Point - 3D */}
                                <circle cx={point.x} cy={point.y} r="3" fill="#10B981" className="visibility-data-point" />
                                {/* Point highlight */}
                                <circle cx={point.x - 1} cy={point.y - 1} r="1" fill="#FFFFFF" opacity="0.6" />
                              </g>
                            ))}
                          </g>
                          
                          {/* Transaction counter - 3D */}
                          <g transform="translate(10, 50)">
                            <rect x="0" y="0" width="80" height="12" rx="2" fill="#10B981" opacity="0.15" />
                            <text x="40" y="9" textAnchor="middle" fontSize="6" fill="#10B981" fontWeight="bold" fontFamily="monospace">
                              Transactions: 1,247
                            </text>
                          </g>
                        </g>
                        
                        {/* Real-time indicator pulses - 3D */}
                        <g className="visibility-realtime-indicator" transform="translate(160, 35)">
                          {/* Outer pulse ring */}
                          <circle cx="0" cy="0" r="12" fill="#10B981" opacity="0.2" className="visibility-pulse-outer" />
                          {/* Middle ring */}
                          <circle cx="0" cy="0" r="9" fill="#10B981" opacity="0.3" className="visibility-pulse-middle" />
                          {/* Inner dot */}
                          <circle cx="0" cy="0" r="6" fill="#10B981" opacity="0.8" className="group-hover:opacity-1 transition-opacity duration-300" />
                          {/* LIVE text */}
                          <text x="0" y="20" textAnchor="middle" fontSize="6" fill="#10B981" fontWeight="bold">LIVE</text>
                        </g>
                        
                        {/* Data stream visualization - 3D */}
                        <g className="visibility-data-stream" transform="translate(220, 20)">
                          {/* Stream particles */}
                          {[0, 1, 2, 3, 4].map((i) => (
                            <g key={i} className={`visibility-stream-particle-${i}`} transform={`translate(${i * 8}, ${i * 3})`}>
                              <rect x="0" y="0" width="4" height="12" rx="2" fill="#10B981" opacity="0.6" />
                              <rect x="0.5" y="0.5" width="3" height="4" rx="1.5" fill="#FFFFFF" opacity="0.3" />
                            </g>
                          ))}
                        </g>
                        
                        {/* Eye icon representing visibility - 3D */}
                        <g className="visibility-eye-icon" transform="translate(250, 15)" filter="url(#visibilityShadow3D)">
                          {/* Eye shadow */}
                          <ellipse cx="0" cy="8" rx="12" ry="2" fill="#000000" opacity="0.2" />
                          {/* Eye shape - 3D */}
                          <ellipse cx="0" cy="0" rx="12" ry="8" fill="#10B981" opacity="0.2" stroke="#059669" strokeWidth="2" />
                          {/* Eye highlight */}
                          <ellipse cx="-3" cy="-2" rx="4" ry="3" fill="#FFFFFF" opacity="0.4" />
                          {/* Pupil */}
                          <circle cx="2" cy="0" r="3" fill="#059669" />
                          {/* Pupil highlight */}
                          <circle cx="3" cy="-1" r="1" fill="#FFFFFF" opacity="0.8" />
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* 3D Vector Graphic for Zero Revenue Leakage Card */}
                  {isRevenueLeakage && (
                    <div className="absolute -top-12 md:-top-24 left-1/2 transform -translate-x-1/2 w-full max-w-[300px] h-24 md:h-48 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 300 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="leakageShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="50%" stopColor="#D97706" />
                            <stop offset="100%" stopColor="#B45309" />
                          </linearGradient>
                          <linearGradient id="leakageVaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="50%" stopColor="#111827" />
                            <stop offset="100%" stopColor="#030712" />
                          </linearGradient>
                          <linearGradient id="leakageLockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                          <linearGradient id="leakageSealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <filter id="leakageShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Security shield - 3D */}
                        <g className="leakage-shield-group" transform="translate(60, 15)" filter="url(#leakageShadow3D)">
                          {/* Shield shadow */}
                          <ellipse cx="25" cy="35" rx="20" ry="3" fill="#000000" opacity="0.2" />
                          
                          {/* Shield shape - 3D */}
                          <path 
                            d="M 25 0 L 35 8 L 35 20 Q 35 30, 25 35 Q 15 30, 15 20 L 15 8 Z" 
                            fill="url(#leakageShieldGradient)" 
                            stroke="#B45309" 
                            strokeWidth="2.5"
                            className="group-hover:stroke-[#92400E] transition-colors duration-300"
                          />
                          {/* Shield highlight */}
                          <path 
                            d="M 25 2 L 32 9 L 32 18 Q 32 26, 25 30 Q 18 26, 18 18 L 18 9 Z" 
                            fill="#FFFFFF" 
                            opacity="0.2"
                          />
                          
                          {/* Lock icon inside shield */}
                          <g transform="translate(25, 18)">
                            {/* Lock body */}
                            <rect x="-6" y="0" width="12" height="10" rx="2" fill="#FFFFFF" opacity="0.9" />
                            {/* Lock shackle */}
                            <path 
                              d="M -6 0 Q -6 -4, -2 -4 Q 2 -4, 2 0" 
                              stroke="#F59E0B" 
                              strokeWidth="2" 
                              fill="none" 
                              strokeLinecap="round"
                            />
                            {/* Keyhole */}
                            <circle cx="0" cy="5" r="2" fill="#F59E0B" />
                            <rect x="-1" y="5" width="2" height="4" fill="#F59E0B" />
                          </g>
                        </g>
                        
                        {/* Secure vault/container - 3D */}
                        <g className="leakage-vault-group" transform="translate(120, 20)" filter="url(#leakageShadow3D)">
                          {/* Vault shadow */}
                          <ellipse cx="30" cy="40" rx="25" ry="3" fill="#000000" opacity="0.3" />
                          
                          {/* Vault body - 3D */}
                          <rect x="0" y="0" width="60" height="40" rx="3" fill="url(#leakageVaultGradient)" stroke="#030712" strokeWidth="2" />
                          {/* Vault side highlight */}
                          <rect x="0" y="2" width="3" height="36" rx="2" fill="#FFFFFF" opacity="0.1" />
                          
                          {/* Vault door */}
                          <rect x="5" y="5" width="50" height="30" rx="2" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />
                          
                          {/* Vault lock mechanism - 3D */}
                          <g transform="translate(30, 20)">
                            <circle cx="0" cy="0" r="8" fill="url(#leakageLockGradient)" stroke="#D97706" strokeWidth="2" />
                            {/* Lock center */}
                            <circle cx="0" cy="0" r="4" fill="#FFFFFF" opacity="0.3" />
                            {/* Lock keyhole */}
                            <rect x="-1" y="2" width="2" height="4" rx="0.5" fill="#1F2937" />
                          </g>
                          
                          {/* Vault handle */}
                          <rect x="52" y="18" width="4" height="4" rx="1" fill="#6B7280" />
                        </g>
                        
                        {/* Zero leakage indicator - 3D */}
                        <g className="leakage-zero-indicator" transform="translate(200, 25)">
                          {/* Zero circle - 3D */}
                          <circle cx="0" cy="0" r="15" fill="url(#leakageSealGradient)" stroke="#047857" strokeWidth="2.5" filter="url(#leakageShadow3D)" />
                          {/* Circle highlight */}
                          <circle cx="-4" cy="-4" r="6" fill="#FFFFFF" opacity="0.3" />
                          
                          {/* Zero text */}
                          <text x="0" y="6" textAnchor="middle" fontSize="14" fill="#FFFFFF" fontWeight="bold">0</text>
                          
                          {/* Checkmark seal */}
                          <g transform="translate(0, 20)">
                            <circle cx="0" cy="0" r="6" fill="#10B981" opacity="0.3" />
                            <path d="M -3 0 L -1 2 L 3 -2" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" />
                          </g>
                        </g>
                        
                        {/* Verification badges - 3D */}
                        <g className="leakage-verification-badges" transform="translate(40, 60)">
                          {[0, 1, 2].map((i) => (
                            <g key={i} transform={`translate(${i * 25}, 0)`} className={`leakage-badge-${i}`}>
                              {/* Badge shadow */}
                              <ellipse cx="0" cy="3" rx="8" ry="1" fill="#000000" opacity="0.2" />
                              {/* Badge - 3D */}
                              <circle cx="0" cy="0" r="8" fill="#10B981" opacity="0.4" stroke="#059669" strokeWidth="1.5" />
                              {/* Checkmark */}
                              <path d="M -3 0 L -1 2 L 3 -2" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </g>
                          ))}
                        </g>
                        
                        {/* Sealed connection lines - 3D */}
                        <g className="leakage-sealed-lines" opacity="0.5">
                          <path d="M 90 35 L 115 40" stroke="#F59E0B" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                          <path d="M 180 40 L 185 40" stroke="#10B981" strokeWidth="2" fill="none" strokeDasharray="3 3" />
                        </g>
                      </svg>
                    </div>
                  )}
                  
                  {/* 3D Vector Graphic for 24/7 Access & Control Card */}
                  {isAccessControl && (
                    <div className="absolute -top-12 md:-top-24 left-1/2 transform -translate-x-1/2 w-full max-w-[300px] h-24 md:h-48 z-20 group cursor-pointer">
                      <svg 
                        viewBox="0 0 300 96" 
                        className="w-full h-full"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="accessClockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#DC2626" />
                            <stop offset="50%" stopColor="#B91C1C" />
                            <stop offset="100%" stopColor="#991B1B" />
                          </linearGradient>
                          <linearGradient id="accessDashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1F2937" />
                            <stop offset="100%" stopColor="#111827" />
                          </linearGradient>
                          <linearGradient id="accessGlobeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                          </linearGradient>
                          <linearGradient id="accessDeviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F9FAFB" />
                            <stop offset="100%" stopColor="#F3F4F6" />
                          </linearGradient>
                          <filter id="accessShadow3D">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feOffset in="coloredBlur" dx="2" dy="4" result="offsetBlur"/>
                            <feMerge>
                              <feMergeNode in="offsetBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* 24/7 Clock - 3D */}
                        <g className="access-clock-group" transform="translate(40, 20)" filter="url(#accessShadow3D)">
                          {/* Clock shadow */}
                          <ellipse cx="20" cy="30" rx="18" ry="2" fill="#000000" opacity="0.2" />
                          
                          {/* Clock face - 3D */}
                          <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2.5" />
                          {/* Clock side highlight */}
                          <ellipse cx="12" cy="20" rx="3" ry="18" fill="#FFFFFF" opacity="0.3" />
                          
                          {/* Clock numbers */}
                          <text x="20" y="8" textAnchor="middle" fontSize="5" fill="#DC2626" fontWeight="bold">12</text>
                          <text x="32" y="22" textAnchor="middle" fontSize="5" fill="#DC2626" fontWeight="bold">3</text>
                          <text x="20" y="34" textAnchor="middle" fontSize="5" fill="#DC2626" fontWeight="bold">6</text>
                          <text x="8" y="22" textAnchor="middle" fontSize="5" fill="#DC2626" fontWeight="bold">9</text>
                          
                          {/* Clock hands - showing 24/7 */}
                          <g className="access-clock-hands">
                            {/* Hour hand */}
                            <line x1="20" y1="20" x2="20" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
                            {/* Minute hand */}
                            <line x1="20" y1="20" x2="28" y2="20" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
                            {/* Center dot */}
                            <circle cx="20" cy="20" r="2" fill="#DC2626" />
                          </g>
                          
                          {/* 24/7 text badge */}
                          <rect x="8" y="30" width="24" height="8" rx="2" fill="url(#accessClockGradient)" />
                          <text x="20" y="36" textAnchor="middle" fontSize="5" fill="#FFFFFF" fontWeight="bold">24/7</text>
                        </g>
                        
                        {/* Global access globe - 3D */}
                        <g className="access-globe-group" transform="translate(120, 15)" filter="url(#accessShadow3D)">
                          {/* Globe shadow */}
                          <ellipse cx="25" cy="35" rx="20" ry="3" fill="#000000" opacity="0.2" />
                          
                          {/* Globe sphere - 3D */}
                          <circle cx="25" cy="25" r="20" fill="url(#accessGlobeGradient)" stroke="#1E40AF" strokeWidth="2" />
                          {/* Globe highlight */}
                          <ellipse cx="18" cy="18" rx="8" ry="12" fill="#FFFFFF" opacity="0.3" />
                          
                          {/* Globe grid lines */}
                          <ellipse cx="25" cy="25" rx="20" ry="10" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.4" />
                          <ellipse cx="25" cy="25" rx="20" ry="6" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.4" />
                          <line x1="5" y1="25" x2="45" y2="25" stroke="#3B82F6" strokeWidth="1" opacity="0.4" />
                          <line x1="15" y1="15" x2="35" y2="35" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
                          <line x1="35" y1="15" x2="15" y2="35" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
                          
                          {/* Access points on globe */}
                          <circle cx="20" cy="20" r="2" fill="#10B981" className="access-point-1" />
                          <circle cx="30" cy="30" r="2" fill="#10B981" className="access-point-2" />
                          <circle cx="25" cy="15" r="2" fill="#10B981" className="access-point-3" />
                        </g>
                        
                        {/* Dashboard/Control panel - 3D */}
                        <g className="access-dashboard-group" transform="translate(180, 20)" filter="url(#accessShadow3D)">
                          {/* Dashboard shadow */}
                          <ellipse cx="30" cy="30" rx="25" ry="2" fill="#000000" opacity="0.2" />
                          
                          {/* Dashboard frame - 3D */}
                          <rect x="0" y="0" width="60" height="40" rx="3" fill="url(#accessDashboardGradient)" stroke="#030712" strokeWidth="2" />
                          {/* Frame side highlight */}
                          <rect x="0" y="2" width="3" height="36" rx="2" fill="#FFFFFF" opacity="0.1" />
                          
                          {/* Dashboard screen */}
                          <rect x="3" y="3" width="54" height="34" rx="2" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
                          
                          {/* Dashboard header */}
                          <rect x="4" y="4" width="52" height="8" rx="1" fill="#DC2626" opacity="0.2" />
                          <text x="30" y="10" textAnchor="middle" fontSize="5" fill="#DC2626" fontWeight="bold">DASHBOARD</text>
                          
                          {/* Control buttons - 3D */}
                          <g transform="translate(8, 16)">
                            <rect x="0" y="0" width="8" height="6" rx="1" fill="#10B981" opacity="0.3" className="access-control-btn-1" />
                            <rect x="10" y="0" width="8" height="6" rx="1" fill="#2563EB" opacity="0.3" className="access-control-btn-2" />
                            <rect x="20" y="0" width="8" height="6" rx="1" fill="#F59E0B" opacity="0.3" className="access-control-btn-3" />
                          </g>
                          
                          {/* Status indicator */}
                          <g transform="translate(45, 20)">
                            <circle cx="0" cy="0" r="4" fill="#10B981" opacity="0.6" className="access-status-indicator" />
                            <text x="0" y="12" textAnchor="middle" fontSize="4" fill="#10B981" fontWeight="bold">ONLINE</text>
                          </g>
                        </g>
                        
                        {/* Access arrows connecting elements - 3D */}
                        <g className="access-arrows" opacity="0.6">
                          <path d="M 60 50 L 115 50" stroke="#DC2626" strokeWidth="2" fill="none" markerEnd="url(#arrowAccess)" />
                          <path d="M 145 50 L 175 50" stroke="#2563EB" strokeWidth="2" fill="none" markerEnd="url(#arrowAccess)" />
                          <defs>
                            <marker id="arrowAccess" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                              <polygon points="0 0, 10 3, 0 6" fill="#DC2626" opacity="0.7" />
                            </marker>
                          </defs>
                        </g>
                      </svg>
                    </div>
                  )}
                  
                <div className="text-xl md:text-4xl font-bold mb-1 md:mb-2">{benefit.stat}</div>
                <div className="text-xs md:text-lg font-semibold mb-0.5 md:mb-1">{benefit.label}</div>
                <div className="text-primary-100 text-[10px] md:text-sm leading-tight">{benefit.description}</div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about Foraypay and how it helps transport companies eliminate revenue leakage.
            </p>
          </div>
          
          <FAQ items={[
            {
              question: "What is Foraypay and how does it work?",
              answer: "ForayPay is a B2B transport infrastructure,digital ticketing and revenue control platform that enables transport companies to replace cash-based fare collection with verifiable, digital ticket issuance and real-time operational visibility.\n\nForayPay does not process payments.\nAll monetary transactions are handled by licensed payment service providers (MoniMe).\nForayPay provides the control, validation, and reporting layer on top of those payments."
            },
            {
              question: "How does Foraypay prevent revenue leakage?",
              answer: "Foraypay eliminates cash transactions entirely, ensuring all payments go through verified digital channels. Every transaction is linked to a unique digital ticket with an order number that must be validated by operators before boarding. This creates a complete audit trail, making it impossible for revenue to be lost or unaccounted for. Real-time dashboards allow company admins to see every transaction as it happens."
            },
            {
              question: "What payment methods does Foraypay support?",
              answer: "Foraypay currently integrates with MoniMe mobile money, which is widely used in Sierra Leone. Passengers can pay for their tickets directly through the MoniMe platform, and the payment is immediately verified and linked to a digital ticket."
            },
            {
              question: "Do passengers need internet access to use Foraypay?",
              answer: "Passengers do not need internet access to buy tickets. They use MoniMe's offline payment system to buy tickets and receive their order number via SMS. Once they receive the order number, they can present it to the operator for validation. The operator's device needs internet connectivity to validate tickets in real-time."
            },
            {
              question: "How do operators validate tickets?",
              answer: "When a passenger arrives at the park, they provide their order number to the operator. The operator enters this number into the Foraypay validation system, which verifies the ticket's authenticity, checks if it's already been used, and confirms the passenger can board. Once validated, the ticket is marked as used and cannot be reused."
            },
            {
              question: "Can I track revenue in real-time?",
              answer: "Yes! Foraypay provides real-time revenue visibility through comprehensive dashboards. Company admins can see every transaction as it happens, view revenue by route, track daily, weekly, and monthly performance, and access detailed analytics. All data is updated in real-time, giving you complete transparency over your revenue."
            },
            {
              question: "What happens if a passenger loses their Order Number?",
              answer: "Passengers can retrieve their ticket information using their phone number through the Retrieve Ticket link on the navigation bar. This allows them to access their order number again if needed. The system maintains a complete record of all transactions for easy retrieval."
            },
            {
              question: "Is Foraypay secure?",
              answer: "Absolutely. Foraypay uses secure authentication, encrypted transactions, and maintains a complete audit trail of all activities. All payments are processed through MoniMe's secure platform, and the order number validation system ensures tickets cannot be duplicated or fraudulently used. Access is role-based, ensuring only authorized personnel can view sensitive data."
            },
            {
              question: "How do I get started with Foraypay?",
              answer: "Getting started is easy! Click the 'Get Started' button to begin the setup process. You'll need to provide your company information and configure your MoniMe account integration. Once set up, you can create routes, add operators, and start accepting digital payments immediately."
            },
            {
              question: "What kind of support does Foraypay offer?",
              answer: "Foraypay provides 24/7 access to your dashboard and control panel, allowing you to manage your operations anytime. The platform is designed to be intuitive, but if you need assistance, you can contact our support team through the contact page. We're committed to helping transport companies eliminate revenue leakage and streamline their operations."
            },
            {
              question: "Can I customize routes and pricing?",
              answer: "Yes, company admins have full control over route management. You can create new routes, edit existing ones, set pricing for each route, and assign operators to specific routes. All changes are reflected immediately in the system, and operators will see updated route information in real-time."
            },
            {
              question: "Does Foraypay work offline?",
              answer: "Foraypay requires internet connectivity for real-time transaction processing and validation. Operators need internet access to validate tickets and update the system. However, the platform is optimized to work efficiently even with limited connectivity, and all data is synced when connection is restored."
            }
          ]} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-4 md:p-12 text-center shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 md:w-40 md:h-40 bg-primary-400 rounded-full -mr-10 md:-mr-20 -mt-10 md:-mt-20 opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 md:w-32 md:h-32 bg-primary-500 rounded-full -ml-8 md:-ml-16 -mb-8 md:-mb-16 opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-24 md:h-24 bg-white rounded-full opacity-10"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
            Ready to Eliminate Revenue Leakage?
          </h2>
              <p className="text-sm md:text-xl text-primary-100 mb-4 md:mb-8">
                Join transport companies in Africa who are taking control of their revenue
          </p>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 justify-center">
            <Link href="/setup">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-primary-50 shadow-lg font-semibold text-sm md:text-base py-2 md:py-3 px-4 md:px-6">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary-600 transition-all shadow-lg font-semibold text-sm md:text-base py-2 md:py-3 px-4 md:px-6">
                    Sign In
              </Button>
            </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg p-3 md:p-6 shadow-lg">
              <div className="flex items-center space-x-1 md:space-x-2 mb-2 md:mb-4">
                <FooterLogo logoUrl={navLogoUrl} />
                <span className="text-sm md:text-xl font-bold">
                  <span className="text-primary-600 font-extrabold">Foray</span>
                  <span className="text-success-600">pay</span>
                </span>
                </div>
              <p className="text-gray-600 text-[10px] md:text-sm font-bold">
                One Tap. One Ticket.
              </p>
              <p className="text-gray-600 text-[10px] md:text-sm mt-1 md:mt-2 font-bold leading-tight">
                Digital transport ticketing infrastructure for Africa.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/passenger/retrieve" className="hover:text-white transition-colors">Retrieve Ticket</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Foraypay. Built for Africa&apos;s transport industry.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

