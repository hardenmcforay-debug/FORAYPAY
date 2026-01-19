'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Ticket, ArrowLeft, Building2, Mail, Phone, MapPin, Send, CheckCircle, FileText, Hash, Globe, Share2 } from 'lucide-react'

const contactSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  legal_name: z.string().min(2, 'Legal name must be at least 2 characters'),
  business_registration_number: z.string().min(1, 'Business registration number is required'),
  contact_person: z.string().min(2, 'Contact person name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  number_of_routes: z.string().min(1, 'Please specify number of routes'),
  website: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true
    try {
      new URL(val)
      return true
    } catch {
      return false
    }
  }, { message: 'Invalid website URL' }),
  socials: z.string().optional(),
  additional_info: z.string().optional(),
})

type ContactForm = z.infer<typeof contactSchema>

export default function SetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit contact form')
      }

      setIsSuccess(true)
      reset()
      
      // Redirect to landing page after 3 seconds
      setTimeout(() => {
        router.push('/landing')
      }, 3000)
    } catch (err: any) {
      console.error('Contact form error:', err)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
        <Card className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success-600">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            We&apos;ve received your request to set up a company space. Our team will contact you shortly.
          </p>
          <Link href="/landing">
            <Button>Return to Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Foraypay</span>
              </Link>
            </div>
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
              <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/landing">
                <Button variant="ghost">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/landing">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group mb-4">
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Landing Page</span>
            </button>
          </Link>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-600">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Request Company Space Setup
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fill out the form below and our team will contact you to set up your company space on Foraypay.
            </p>
          </div>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Company Name"
                  {...register('company_name')}
                  error={errors.company_name?.message}
                  required
                  placeholder="Enter your company name"
                />
              </div>
              <div>
                <div className="relative">
                  <FileText className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Legal Name"
                    {...register('legal_name')}
                    error={errors.legal_name?.message}
                    required
                    placeholder="Legal registered name"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative">
                  <Hash className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Business Registration Number"
                    {...register('business_registration_number')}
                    error={errors.business_registration_number?.message}
                    required
                    placeholder="Registration number"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Input
                  label="Contact Person"
                  {...register('contact_person')}
                  error={errors.contact_person?.message}
                  required
                  placeholder="Full name of contact person"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Email Address"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    required
                    placeholder="company@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Phone className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Phone Number"
                    type="tel"
                    {...register('phone')}
                    error={errors.phone?.message}
                    required
                    placeholder="+232 XX XXX XXXX"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                <Input
                  label="Company Address"
                  {...register('address')}
                  error={errors.address?.message}
                  required
                  placeholder="Street address, city, country"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative">
                  <Globe className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Website"
                    type="url"
                    {...register('website')}
                    error={errors.website?.message}
                    placeholder="https://www.example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Share2 className="absolute left-3 top-[38px] h-5 w-5 text-gray-400" />
                  <Input
                    label="Social Media Handles"
                    {...register('socials')}
                    error={errors.socials?.message}
                    placeholder="Facebook, Twitter, Instagram, etc."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Number of Routes <span className="text-error-500">*</span>
              </label>
              <select
                {...register('number_of_routes')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                <option value="">Select number of routes</option>
                <option value="1-5">1-5 routes</option>
                <option value="6-10">6-10 routes</option>
                <option value="11-20">11-20 routes</option>
                <option value="21-50">21-50 routes</option>
                <option value="50+">50+ routes</option>
              </select>
              {errors.number_of_routes && (
                <p className="mt-1 text-sm text-error-600">{errors.number_of_routes.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Information
              </label>
              <textarea
                {...register('additional_info')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                placeholder="Tell us about your transport company, routes, or any specific requirements..."
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isLoading}
              >
                <Send className="mr-2 h-5 w-5" />
                Submit Request
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By submitting this form, you agree to be contacted by our team regarding your company space setup.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

