'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function NewCompanyPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    monime_account_id: '',
    commission_rate: '5.00',
    status: 'active' as 'active' | 'suspended',
    admin_email: '',
    admin_password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Company name is required')
        setLoading(false)
        return
      }

      if (!formData.admin_email.trim()) {
        setError('Company admin email is required')
        setLoading(false)
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.admin_email.trim())) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      if (!formData.admin_password.trim()) {
        setError('Company admin password is required')
        setLoading(false)
        return
      }

      if (formData.admin_password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      const commissionRate = parseFloat(formData.commission_rate)
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        setError('Commission rate must be between 0 and 100')
        setLoading(false)
        return
      }

      // Convert percentage to decimal (e.g., 5% -> 0.05)
      const commissionRateDecimal = commissionRate / 100

      // Create company
      const { data: companyData, error: insertError } = await supabase
        .from('companies')
        .insert({
          name: formData.name.trim(),
          monime_account_id: formData.monime_account_id.trim() || null,
          commission_rate: commissionRateDecimal,
          status: formData.status,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Create company admin user via API route
      const createUserResponse = await fetch('/api/users/create-company-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.admin_email.trim(),
          password: formData.admin_password,
          company_id: companyData.id,
        }),
      })

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json()
        // If user creation fails, delete the company
        await supabase.from('companies').delete().eq('id', companyData.id)
        throw new Error(errorData.error || 'Failed to create company admin user')
      }

      // Log audit action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'company_created',
          details: {
            company_id: companyData.id,
            company_name: companyData.name,
            admin_email: formData.admin_email.trim(),
          },
        })
      }

      // Redirect to companies list
      router.push('/platform/companies')
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Failed to create company. Please try again.')
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')
          
          // Check if user is platform admin
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile?.role !== 'platform_admin') {
            router.push('/unauthorized')
            return
          }
        } else {
          router.push('/login')
          return
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }
    fetchUser()
  }, [supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (checkingAuth) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="platform_admin"
      userEmail={userEmail}
      userName="Platform Admin"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/platform/companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Company</h1>
            <p className="text-gray-600 mt-2">Create a new transport company account</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Company Name *"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="MoniMe Account ID"
                    name="monime_account_id"
                    type="text"
                    value={formData.monime_account_id}
                    onChange={handleChange}
                    placeholder="Enter MoniMe account ID (optional)"
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    The MoniMe account ID associated with this company for payment processing
                  </p>
                </div>

                <div>
                  <Input
                    label="Commission Rate (%) *"
                    name="commission_rate"
                    type="number"
                    value={formData.commission_rate}
                    onChange={handleChange}
                    placeholder="5.00"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Platform commission percentage (e.g., 5.00 for 5%)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Company account status
                  </p>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Admin Account</h3>
                </div>

                <div>
                  <Input
                    label="Admin Email *"
                    name="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    placeholder="admin@company.com"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Email address for the company admin account
                  </p>
                </div>

                <div>
                  <Input
                    label="Admin Password *"
                    name="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    placeholder="Enter password (min. 6 characters)"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Password for the company admin account (minimum 6 characters)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Link href="/platform/companies">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

