'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Route, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function EditRoutePage() {
  const router = useRouter()
  const params = useParams()
  const routeId = params.id as string
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    fare: '',
    status: 'active' as 'active' | 'inactive',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')
          
          // Check if user is company admin and get company_id
          const { data: profile } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', user.id)
            .single()
          
          if (profile?.role !== 'company_admin') {
            router.push('/unauthorized')
            return
          }

          if (!profile.company_id) {
            setError('No company assigned to your account')
            setFetching(false)
            return
          }

          setCompanyId(profile.company_id)

          // Fetch route data
          const { data: route, error: fetchError } = await supabase
            .from('routes')
            .select('*')
            .eq('id', routeId)
            .eq('company_id', profile.company_id)
            .single()

          if (fetchError) {
            throw fetchError
          }

          if (route) {
            setFormData({
              name: route.name || '',
              origin: route.origin || '',
              destination: route.destination || '',
              fare: route.fare?.toString() || '',
              status: route.status || 'active',
            })
          }
        } else {
          router.push('/login')
          return
        }
      } catch (err: any) {
        console.error('Error fetching route:', err)
        setError(err.message || 'Failed to load route data')
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [supabase, router, routeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Route name is required')
        setLoading(false)
        return
      }

      if (!formData.origin.trim()) {
        setError('Origin is required')
        setLoading(false)
        return
      }

      if (!formData.destination.trim()) {
        setError('Destination is required')
        setLoading(false)
        return
      }

      if (!formData.fare.trim()) {
        setError('Fare is required')
        setLoading(false)
        return
      }

      const fare = parseFloat(formData.fare)
      if (isNaN(fare) || fare <= 0) {
        setError('Fare must be a positive number')
        setLoading(false)
        return
      }

      if (!companyId) {
        setError('Company ID not found')
        setLoading(false)
        return
      }

      // Update route
      const { error: updateError } = await supabase
        .from('routes')
        .update({
          name: formData.name.trim(),
          origin: formData.origin.trim(),
          destination: formData.destination.trim(),
          fare: fare,
          status: formData.status,
        })
        .eq('id', routeId)
        .eq('company_id', companyId)

      if (updateError) {
        throw updateError
      }

      // Log audit action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          company_id: companyId,
          action: 'route_updated',
          details: {
            route_id: routeId,
            route_name: formData.name.trim(),
            origin: formData.origin.trim(),
            destination: formData.destination.trim(),
            fare: fare,
            status: formData.status,
          },
        })
      }

      // Redirect to routes list
      router.push('/company/routes')
    } catch (err: any) {
      console.error('Error updating route:', err)
      setError(err.message || 'Failed to update route. Please try again.')
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
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!companyId) {
    return (
      <DashboardLayout
        role="company_admin"
        userEmail={userEmail}
      >
        <div className="space-y-6">
          <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{error || 'No company assigned to your account'}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="company_admin"
      companyId={companyId}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/company/routes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Route</h1>
            <p className="text-gray-600 mt-2">Update route information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-primary-600" />
              Route Information
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
                    label="Route Name *"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Freetown to Makeni"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    A descriptive name for this route
                  </p>
                </div>

                <div>
                  <Input
                    label="Origin *"
                    name="origin"
                    type="text"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="e.g., Freetown"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Starting point of the route
                  </p>
                </div>

                <div>
                  <Input
                    label="Destination *"
                    name="destination"
                    type="text"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="e.g., Makeni"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    End point of the route
                  </p>
                </div>

                <div>
                  <Input
                    label="Fare (SLL) *"
                    name="fare"
                    type="number"
                    value={formData.fare}
                    onChange={handleChange}
                    placeholder="50000"
                    min="0"
                    step="0.01"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Ticket price in Sierra Leone Leones
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
                    <option value="inactive">Inactive</option>
                  </select>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Route availability status
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Link href="/company/routes">
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

