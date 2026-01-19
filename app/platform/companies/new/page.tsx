'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, Building2, User, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const companySchema = z.object({
  // Company Information
  companyName: z.string().min(1, 'Company name is required'),
  companyEmail: z.string().email('Invalid email address'),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  monimeAccountId: z.string().optional(),
  commissionRate: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0 && num <= 100
  }, 'Commission rate must be between 0 and 100'),
  
  // Admin User Information
  adminFullName: z.string().min(1, 'Full name is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

type CompanyForm = z.infer<typeof companySchema>

export default function NewCompanyPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      commissionRate: '2.5',
    },
  })

  const onSubmit = async (data: CompanyForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/companies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: data.companyName,
          companyEmail: data.companyEmail,
          companyPhone: data.companyPhone,
          companyAddress: data.companyAddress,
          monimeAccountId: data.monimeAccountId,
          commissionRate: data.commissionRate,
          adminFullName: data.adminFullName,
          adminEmail: data.adminEmail,
          adminPassword: data.adminPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create company')
      }

      // Success - redirect to companies page
      router.push('/platform/companies')
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Failed to create company. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientLayout role="platform_admin">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/platform/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Company</h1>
            <p className="text-gray-600 mt-1">Add a new transport company and create an admin account</p>
          </div>
        </div>

        {error && (
          <Card className="bg-error-50 border-error-200">
            <p className="text-error-700">{error}</p>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Company Information */}
            <Card>
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Company Name"
                    {...register('companyName')}
                    error={errors.companyName?.message}
                    required
                    placeholder="Enter company name"
                  />

                  <Input
                    label="Company Email"
                    type="email"
                    {...register('companyEmail')}
                    error={errors.companyEmail?.message}
                    required
                    placeholder="company@example.com"
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    {...register('companyPhone')}
                    error={errors.companyPhone?.message}
                    placeholder="+232 XX XXX XXXX"
                  />

                  <Input
                    label="Commission Rate (%)"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register('commissionRate')}
                    error={errors.commissionRate?.message}
                    required
                    placeholder="2.5"
                  />

                  <Input
                    label="MoniMe Account ID"
                    {...register('monimeAccountId')}
                    error={errors.monimeAccountId?.message}
                    placeholder="Optional - MoniMe account identifier"
                  />

                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      {...register('companyAddress')}
                      error={errors.companyAddress?.message}
                      placeholder="Company address (optional)"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Admin Account Information */}
            <Card>
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                  <User className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Company Admin Account</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    {...register('adminFullName')}
                    error={errors.adminFullName?.message}
                    required
                    placeholder="Enter admin full name"
                  />

                  <Input
                    label="Email"
                    type="email"
                    {...register('adminEmail')}
                    error={errors.adminEmail?.message}
                    required
                    placeholder="admin@example.com"
                  />

                  <div className="md:col-span-2">
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('adminPassword')}
                        error={errors.adminPassword?.message}
                        required
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      This will be the login credentials for the company admin
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href="/platform/companies">
                <Button variant="ghost" type="button" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isLoading}>
                Create Company
              </Button>
            </div>
          </div>
        </form>
      </div>
    </ClientLayout>
  )
}

