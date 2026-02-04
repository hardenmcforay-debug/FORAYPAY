'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Building2, ArrowLeft, Loader2, Save, RefreshCw, Info } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function EditCompanyPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    monime_account_id: '',
    commission_rate: '5.00',
    status: 'active' as 'active' | 'suspended',
  })

  const fetchCompanyData = async () => {
    try {
      setFetching(true)
      setError(null)
      
      // Fetch company data (always get latest)
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (company) {
        setFormData({
          name: company.name || '',
          monime_account_id: company.monime_account_id || '',
          commission_rate: ((company.commission_rate || 0) * 100).toFixed(2),
          status: company.status || 'active',
        })
      }
    } catch (err: any) {
      console.error('Error fetching company:', err)
      setError(err.message || 'Failed to load company data')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
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

        // Fetch company data
        await fetchCompanyData()
      } catch (err: any) {
        console.error('Error initializing:', err)
        setError(err.message || 'Failed to load data')
        setFetching(false)
      }
    }

    initialize()
  }, [supabase, router, companyId])

  // Refresh data when page becomes visible (in case company admin updated it)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !fetching) {
        fetchCompanyData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also refresh periodically (every 30 seconds) to catch updates
    const refreshInterval = setInterval(() => {
      if (!fetching) {
        fetchCompanyData()
      }
    }, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [companyId, fetching, fetchCompanyData])

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

      const commissionRate = parseFloat(formData.commission_rate)
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        setError('Commission rate must be between 0 and 100')
        setLoading(false)
        return
      }

      // Convert percentage to decimal (e.g., 5% -> 0.05)
      const commissionRateDecimal = commissionRate / 100

      // Update company
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: formData.name.trim(),
          monime_account_id: formData.monime_account_id.trim() || null,
          commission_rate: commissionRateDecimal,
          status: formData.status,
        })
        .eq('id', companyId)

      if (updateError) {
        throw updateError
      }

      // Log audit action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'company_updated',
          details: {
            company_id: companyId,
            company_name: formData.name.trim(),
          },
        })
      }

      // Trigger router refresh to update server components
      router.refresh()
      
      // Redirect to company details
      router.push(`/platform/companies/${companyId}`)
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError(err.message || 'Failed to update company. Please try again.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (fetching) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/platform/companies/${companyId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
              <p className="text-gray-600 mt-2">Update company information</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCompanyData}
            disabled={fetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-900 dark:text-gray-100 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Note:</strong> Company admins can also edit the company name from their settings page. 
                        Click &quot;Refresh&quot; to see the latest updates.
                      </p>
                    </div>
                  </div>
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
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Link href={`/platform/companies/${companyId}`}>
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
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

