import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Ticket, ArrowLeft, ArrowRight, Target, Users, Globe, Shield, Zap, CheckCircle, Building2, TrendingUp, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getValidImageUrl } from '@/lib/utils/image-helpers'
import LandingNav from '@/components/layout/LandingNav'
import FooterLogo from '@/components/features/FooterLogo'

export default async function AboutPage() {
  const supabase = createClient()
  
  // Get navigation bar logo URL from Supabase storage
  // Try nav-logo.png first, then fallback to logo.png
  let navLogoUrl = getValidImageUrl(supabase, 'landing-images', 'logo/nav-logo.png', true)
  if (!navLogoUrl) {
    navLogoUrl = getValidImageUrl(supabase, 'landing-images', 'logo/logo.png', true)
  }

  // Get hero section logo URL (same as nav logo for now)
  const heroLogoUrl = navLogoUrl

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <LandingNav logoUrl={navLogoUrl} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/landing">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group">
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Landing Page</span>
            </button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <FooterLogo logoUrl={heroLogoUrl} size="xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About Foraypay
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Digital Transport Infrastructure for Africa
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 md:p-12">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Foraypay is dedicated to transforming Africa&apos;s transport sector by eliminating revenue leakage 
                  and providing transparent, digital payment solutions. We empower transport companies to replace 
                  cash transactions with verifiable digital payments, ensuring every transaction is tracked, 
                  secure, and transparent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="h-6 w-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                To become the leading digital transport infrastructure platform across Africa, enabling 
                seamless, secure, and transparent transactions for millions of passengers and thousands 
                of transport companies.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We envision a future where every bus, taxi, and transport vehicle operates with complete 
                digital transparency, eliminating disputes, reducing fraud, and maximizing revenue for 
                transport operators.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">One Tap. One Ticket.</h3>
                    <p className="text-sm text-gray-600">Simple, fast, and secure digital ticketing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Real-Time Visibility</h3>
                    <p className="text-sm text-gray-600">Track every transaction as it happens</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Zero Revenue Leakage</h3>
                    <p className="text-sm text-gray-600">Eliminate cash handling and disputes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100">
                  <Shield className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Security</h3>
              <p className="text-gray-600">
                We prioritize the security and integrity of every transaction, ensuring your data and 
                revenue are protected at all times.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-100">
                  <Zap className="h-8 w-8 text-success-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Simplicity</h3>
              <p className="text-gray-600">
                Our platform is designed to be intuitive and easy to use, making digital transformation 
                accessible to everyone.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-warning-100">
                  <TrendingUp className="h-8 w-8 text-warning-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600">
                Complete visibility into your operations with real-time data and comprehensive reporting 
                for informed decision-making.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="mb-16">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">For Transport Companies</h3>
                  <p className="text-gray-700">
                    We provide a comprehensive B2B platform that helps transport companies eliminate cash 
                    handling, reduce revenue leakage, and gain real-time visibility into their operations. 
                    Our multi-tenant system ensures complete data isolation and security.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">For Park Operators</h3>
                  <p className="text-gray-700">
                    Our platform empowers park operators with a simple, mobile-friendly interface to validate 
                    tickets, track passenger counts, and manage routes efficiently. No more manual counting or 
                    disputes.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Ticket className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">For Passengers</h3>
                  <p className="text-gray-700">
                    Passengers can purchase tickets digitally and retrieve them easily using their phone number 
                    or transaction ID. Every ticket is verifiable and secure, eliminating the risk of fraud.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
                  <p className="text-gray-700">
                    Comprehensive dashboards and reports provide insights into revenue, route performance, 
                    passenger counts, and more. Make data-driven decisions with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Transport Business?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join transport companies across Africa who are eliminating revenue leakage and gaining 
            complete control over their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/setup">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/landing#how-it-works">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

