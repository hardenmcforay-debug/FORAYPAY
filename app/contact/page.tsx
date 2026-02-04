'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { getImageUrl } from '@/lib/supabase/storage'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    legalName: '',
    businessRegistrationNumber: '',
    phone: '',
    address: '',
    website: '',
    socials: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.legalName.trim() || !formData.businessRegistrationNumber.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError('Please fill in all required fields: Full Name, Email, Company Legal Name, Business Registration Number, Phone Number, and Address')
      return
    }
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/contact-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', legalName: '', businessRegistrationNumber: '', phone: '', address: '', website: '', socials: '', message: '' })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      console.error('Error submitting contact request:', err)
    } finally {
      setSubmitting(false)
    }
  }

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
              <span className="text-gray-900 dark:text-gray-100">Foray</span>
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
              Set Up Your Company Space
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to get started? Fill out the form below and we&apos;ll help you set up your company space on ForayPay. We&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Contact Form */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Company Setup</h2>
                
                {submitted ? (
                  <div className="bg-success-50 border border-success-200 rounded-xl p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-success-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-success-900 mb-2">Message Sent!</h3>
                    <p className="text-success-700">
                      Thank you for contacting us. We&apos;ll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                        <p className="text-error-700 text-sm">{error}</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mb-4">
                      <span className="text-error-600">*</span> Required fields
                    </p>
                    <Input
                      label="Full Name *"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="John Doe"
                    />

                    <Input
                      label="Email *"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@company.com"
                    />

                    <Input
                      label="Company Legal Name *"
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      required
                      placeholder="Legal business name as registered"
                    />

                    <Input
                      label="Business Registration Number *"
                      type="text"
                      value={formData.businessRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                      required
                      placeholder="Business registration number"
                    />

                    <Input
                      label="Phone Number *"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+232 XXX XXX XXX"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Address <span className="text-error-600">*</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        placeholder="Company address"
                      />
                    </div>

                    <Input
                      label="Website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.example.com"
                    />

                    <Input
                      label="Socials"
                      type="text"
                      value={formData.socials}
                      onChange={(e) => setFormData({ ...formData, socials: e.target.value })}
                      placeholder="Facebook, Twitter, LinkedIn, etc."
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message <span className="text-error-600">*</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        placeholder="Tell us about your transport company and how we can help set up your space..."
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                      <Send className="w-5 h-5 mr-2" />
                      {submitting ? 'Submitting...' : 'Send Message'}
                    </Button>
                    
                    <p className="text-sm text-gray-600 text-center mt-4">
                      We&apos;ll review your request and get back to you within <span className="font-semibold text-gray-900">24-48 hours</span> via email or phone.
                    </p>
                  </form>
                )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

