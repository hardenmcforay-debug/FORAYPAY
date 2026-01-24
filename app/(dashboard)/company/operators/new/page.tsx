'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Users, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Route {
  id: string
  name: string
  origin: string
  destination: string
}

export default function NewOperatorPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [routes, setRoutes] = useState<Route[]>([])
  const [fetchingRoutes, setFetchingRoutes] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    status: 'active' as 'active' | 'suspended',
    assigned_routes: [] as string[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
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
            setCheckingAuth(false)
            return
          }

          setCompanyId(profile.company_id)

          // Fetch all park operators to get their assigned routes
          const { data: operatorsData, error: operatorsError } = await supabase
            .from('park_operators')
            .select('assigned_routes')
            .eq('company_id', profile.company_id)
            .eq('status', 'active')

          // Collect all route IDs that are already assigned to any operator
          const assignedRouteIds = new Set<string>()
          if (operatorsData) {
            operatorsData.forEach((operator) => {
              if (operator.assigned_routes && Array.isArray(operator.assigned_routes)) {
                operator.assigned_routes.forEach((routeId: string) => {
                  assignedRouteIds.add(routeId)
                })
              }
            })
          }

          // Fetch routes for this company
          const { data: routesData, error: routesError } = await supabase
            .from('routes')
            .select('id, name, origin, destination')
            .eq('company_id', profile.company_id)
            .eq('status', 'active')
            .order('name', { ascending: true })

          if (routesError) {
            console.error('Error fetching routes:', routesError)
          } else {
            // Filter out routes that are already assigned to any operator
            const unassignedRoutes = (routesData || []).filter(
              (route) => !assignedRouteIds.has(route.id)
            )
            setRoutes(unassignedRoutes)
          }
        } else {
          router.push('/login')
          return
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        router.push('/login')
      } finally {
        setCheckingAuth(false)
        setFetchingRoutes(false)
      }
    }
    fetchData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError('Operator name is required')
        setLoading(false)
        return
      }

      if (!formData.phone.trim()) {
        setError('Phone number is required')
        setLoading(false)
        return
      }

      if (!formData.email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      if (!formData.password.trim()) {
        setError('Password is required')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(false)
        return
      }

      if (!companyId) {
        setError('Company ID not found')
        setLoading(false)
        return
      }

      // Create park operator user via API route
      const createUserResponse = await fetch('/api/users/create-park-operator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          company_id: companyId,
        }),
      })

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json()
        throw new Error(errorData.error || 'Failed to create park operator user')
      }

      const userData = await createUserResponse.json()

      // Create park operator record
      const { error: insertError } = await supabase
        .from('park_operators')
        .insert({
          company_id: companyId,
          user_id: userData.user_id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
          assigned_routes: formData.assigned_routes.length > 0 ? formData.assigned_routes : null,
        })

      if (insertError) {
        // If park operator creation fails, try to clean up the user
        try {
          await fetch(`/api/users/${userData.user_id}`, { method: 'DELETE' })
        } catch (cleanupError) {
          console.error('Error cleaning up user:', cleanupError)
        }
        throw insertError
      }

      // Log audit action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          company_id: companyId,
          action: 'park_operator_created',
          details: {
            operator_name: formData.name.trim(),
            operator_email: formData.email.trim(),
            operator_phone: formData.phone.trim(),
            status: formData.status,
            assigned_routes_count: formData.assigned_routes.length,
          },
        })
      }

      // Redirect to operators list
      router.push('/company/operators')
    } catch (err: any) {
      console.error('Error creating park operator:', err)
      setError(err.message || 'Failed to create park operator. Please try again.')
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

  const handleRouteToggle = (routeId: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_routes: prev.assigned_routes.includes(routeId)
        ? prev.assigned_routes.filter((id) => id !== routeId)
        : [...prev.assigned_routes, routeId],
    }))
  }

  if (checkingAuth || fetchingRoutes) {
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
          <Link href="/company/operators">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Park Operator</h1>
            <p className="text-gray-600 mt-2">Create a new park operator account</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Operator Information
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
                    label="Operator Name *"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., John Doe"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Full name of the park operator
                  </p>
                </div>

                <div>
                  <Input
                    label="Phone Number *"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +232 76 123 456"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Contact phone number
                  </p>
                </div>

                <div>
                  <Input
                    label="Email *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="operator@example.com"
                    required
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Email address for login
                  </p>
                </div>

                <div>
                  <Input
                    label="Password *"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password (min. 6 characters)"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Password for the operator account (minimum 6 characters)
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
                    Operator account status
                  </p>
                </div>

                {routes.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Routes (Optional)
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {routes.map((route) => (
                          <label
                            key={route.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.assigned_routes.includes(route.id)}
                              onChange={() => handleRouteToggle(route.id)}
                              disabled={loading}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {route.name}
                              </span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({route.origin} → {route.destination})
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500">
                      Select routes this operator can validate tickets for
                    </p>
                  </div>
                )}

                {routes.length === 0 && (
                  <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      No active routes available. Create routes first to assign them to operators.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Link href="/company/operators">
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
                    'Create Operator'
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

