'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Users, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Route {
  id: string
  name: string
  origin: string
  destination: string
}

export default function EditOperatorPage() {
  const router = useRouter()
  const params = useParams()
  const operatorId = params.id as string
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [operatorEmail, setOperatorEmail] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    status: 'active' as 'active' | 'suspended',
    assigned_routes: [] as string[],
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

          // Fetch operator data
          const { data: operator, error: fetchError } = await supabase
            .from('park_operators')
            .select(`
              *,
              users(email)
            `)
            .eq('id', operatorId)
            .eq('company_id', profile.company_id)
            .single()

          if (fetchError) {
            throw fetchError
          }

          if (operator) {
            setOperatorEmail(operator.users?.email || '')
            setFormData({
              name: operator.name || '',
              phone: operator.phone || '',
              status: operator.status || 'active',
              assigned_routes: operator.assigned_routes || [],
            })
          }

          // Fetch all park operators to get their assigned routes
          const { data: operatorsData, error: operatorsError } = await supabase
            .from('park_operators')
            .select('id, assigned_routes')
            .eq('company_id', profile.company_id)
            .eq('status', 'active')

          // Collect all route IDs that are assigned to OTHER operators (not the current one being edited)
          const assignedRouteIds = new Set<string>()
          if (operatorsData) {
            operatorsData.forEach((op) => {
              // Skip the current operator being edited
              if (op.id === operatorId) return
              
              if (op.assigned_routes && Array.isArray(op.assigned_routes)) {
                op.assigned_routes.forEach((routeId: string) => {
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
            // Filter to show only routes that are:
            // 1. Currently assigned to THIS operator, OR
            // 2. Not assigned to any other operator
            const currentOperatorRoutes = operator?.assigned_routes || []
            const availableRoutes = (routesData || []).filter(
              (route) => 
                currentOperatorRoutes.includes(route.id) || // Show routes assigned to this operator
                !assignedRouteIds.has(route.id) // Show routes not assigned to other operators
            )
            setRoutes(availableRoutes)
          }
        } else {
          router.push('/login')
          return
        }
      } catch (err: any) {
        console.error('Error fetching operator:', err)
        setError(err.message || 'Failed to load operator data')
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [supabase, router, operatorId])

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

      if (!companyId) {
        setError('Company ID not found')
        setLoading(false)
        return
      }

      // Update park operator
      const { error: updateError } = await supabase
        .from('park_operators')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
          assigned_routes: formData.assigned_routes.length > 0 ? formData.assigned_routes : null,
        })
        .eq('id', operatorId)
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
          action: 'park_operator_updated',
          details: {
            operator_id: operatorId,
            operator_name: formData.name.trim(),
            operator_phone: formData.phone.trim(),
            status: formData.status,
            assigned_routes_count: formData.assigned_routes.length,
          },
        })
      }

      // Redirect to operators list
      router.push('/company/operators')
    } catch (err: any) {
      console.error('Error updating operator:', err)
      setError(err.message || 'Failed to update operator. Please try again.')
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
          <Link href="/company/operators">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Park Operator</h1>
            <p className="text-gray-600 mt-2">Update operator information</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={operatorEmail}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-sm text-gray-500">
                    Email cannot be changed. Contact administrator if email needs to be updated.
                  </p>
                </div>

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

