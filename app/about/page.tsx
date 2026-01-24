import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Shield, Target, Users, Heart } from 'lucide-react'
import Button from '@/components/ui/button'
import { getImageUrl } from '@/lib/supabase/storage'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden relative">
              <Image 
                src={getImageUrl('logo.png')} 
                alt="ForayPay Logo" 
                width={80} 
                height={80} 
                quality={100}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-primary-600">Foray</span>
              <span className="text-success-600">Pay</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About ForayPay
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transforming transport ticketing in Sierra Leone through innovative digital solutions
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600">
                To empower transport companies in Sierra Leone with digital infrastructure that eliminates revenue leakage, 
                provides complete transparency, and enables data-driven decision making.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-gradient-to-br from-primary-50 to-white p-8 rounded-xl border border-primary-100">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Vision</h3>
                <p className="text-gray-600">
                  To become the leading digital ticketing platform in Sierra Leone, enabling every transport company 
                  to operate efficiently, transparently, and profitably.
                </p>
              </div>

              <div className="bg-gradient-to-br from-success-50 to-white p-8 rounded-xl border border-success-100">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Values</h3>
                <p className="text-gray-600">
                  Transparency, integrity, and innovation drive everything we do. We believe in empowering 
                  transport companies with tools that create real value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What We Do</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Ticketing Platform</h3>
                    <p className="text-gray-600">
                      We provide a complete B2B digital ticketing and revenue-control platform that replaces 
                      cash transactions with verifiable digital payments. Our system integrates seamlessly with 
                      MoniMe mobile money to ensure secure, instant transactions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Built for Transport Companies</h3>
                    <p className="text-gray-600">
                      ForayPay is designed specifically for transport companies in Sierra Leone. We understand 
                      the unique challenges you face - from revenue leakage to operator management - and have 
                      built solutions that address these pain points directly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-warning-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Revenue Control</h3>
                    <p className="text-gray-600">
                      Our platform provides real-time visibility into revenue, automated commission settlement, 
                      and complete audit trails. Every transaction is tracked, verified, and reported - giving 
                      you complete control over your finances.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Transport Business?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join transport companies across Sierra Leone using ForayPay
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-gray-50">
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

