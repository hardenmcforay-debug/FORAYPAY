'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { QrCode, CheckCircle2, XCircle, Loader2, Copy, CopyCheck } from 'lucide-react'

export default function GenerateTicketsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    route_id: '',
    amount: '',
    quantity: '1',
  })
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [codeInfo, setCodeInfo] = useState<{ total_tickets: number; used_tickets: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'park_operator') {
          router.push('/unauthorized')
          return
        }

        if (!profile.company_id) {
          setError('No company assigned to your account')
          setFetching(false)
          return
        }

        // Get company_id from profile or operator table
        let companyIdValue = profile.company_id

        // Get operator info
        const { data: operator } = await supabase
          .from('park_operators')
          .select('id, status, company_id, assigned_routes')
          .eq('user_id', user.id)
          .single()

        if (operator) {
          // Use company_id from operator if not in profile
          if (!companyIdValue) {
            companyIdValue = operator.company_id
          }

          // Check if company is suspended
          if (companyIdValue) {
            const { data: company } = await supabase
              .from('companies')
              .select('status, name')
              .eq('id', companyIdValue)
              .single()

            if (company && company.status === 'suspended') {
              setError(`Your company account "${company.name}" has been suspended. You cannot access the platform at this time. Please contact the platform administrator for assistance.`)
              await supabase.auth.signOut()
              setTimeout(() => {
                router.push('/login')
              }, 2000)
              setFetching(false)
              return
            }
          }

          // Check if operator is suspended
          if (operator.status === 'suspended') {
            setError('Your operator account has been suspended. You cannot access the platform at this time. Please contact your company administrator for assistance.')
            await supabase.auth.signOut()
            setTimeout(() => {
              router.push('/login')
            }, 2000)
            setFetching(false)
            return
          }
          setCompanyId(companyIdValue || operator.company_id)
          setOperatorId(operator.id)
          
          // Get ONLY assigned routes - park operators can only see routes assigned by company admin
          if (operator.assigned_routes && operator.assigned_routes.length > 0) {
            const { data: routesData, error: routesError } = await supabase
              .from('routes')
              .select('id, name, origin, destination, fare')
              .eq('company_id', companyIdValue || operator.company_id)
              .in('id', operator.assigned_routes) // Only routes in assigned_routes array
              .eq('status', 'active')
              .order('name', { ascending: true })

            if (routesError) {
              console.error('Error fetching assigned routes:', routesError)
              setError('Failed to load assigned routes')
            } else if (routesData && routesData.length > 0) {
              // Double-check: filter out any routes not in assigned_routes (extra safety)
              const filteredRoutes = routesData.filter(route => 
                operator.assigned_routes?.includes(route.id)
              )
              setRoutes(filteredRoutes)
            } else {
              setError('No active routes assigned to you. Please contact your company admin.')
            }
          } else {
            setError('No routes assigned to you. Please contact your company admin.')
          }
        } else {
          setError('Operator profile not found. Please contact your company admin.')
        }
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load data')
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    setGeneratedCode(null)
    setCodeInfo(null)
    setRouteInfo(null)

    try {
      if (!formData.route_id) {
        throw new Error('Please select a route')
      }

      // Get route details - amount is fixed from route fare
      // Verify route is in the assigned routes list (security check)
      // The routes array already contains only assigned routes, so this is a double-check
      const selectedRoute = routes.find(r => r.id === formData.route_id)
      if (!selectedRoute) {
        throw new Error('Selected route not found or not assigned to you. Please select a route from the list.')
      }

      // Additional security: Verify route exists in the routes array (which only contains assigned routes)
      const isRouteAssigned = routes.some(r => r.id === formData.route_id)
      if (!isRouteAssigned) {
        throw new Error('You are not authorized to generate tickets for this route. Only assigned routes are allowed.')
      }

      if (!selectedRoute.fare || selectedRoute.fare <= 0) {
        throw new Error('Route fare is not set. Please contact your company admin.')
      }

      // Request codes from MoniMe API
      // Amount is always taken from route fare (set by company admin)
      const response = await fetch('/api/tickets/request-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_id: formData.route_id,
          amount: selectedRoute.fare, // Use route fare directly (fixed by company admin)
          quantity: parseInt(formData.quantity) || 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request codes from MoniMe')
      }

      if (data.success && data.code) {
        setGeneratedCode(data.code)
        setCodeInfo({
          total_tickets: data.total_tickets || 1,
          used_tickets: data.used_tickets || 0,
        })
        setRouteInfo(data.route)
        setSuccess(`Payment code generated successfully. This code can be used ${data.total_tickets} time(s) for ticket payments.`)
        
        // Reset form after successful request (but keep route if operator wants to generate more)
        setFormData({
          route_id: formData.route_id, // Keep route selected for quick re-generation
          amount: '',
          quantity: '1',
        })
        
        // Scroll to the generated code section
        setTimeout(() => {
          const codeSection = document.getElementById('generated-code-section')
          if (codeSection) {
            codeSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        throw new Error('No code received from MoniMe')
      }
    } catch (err: any) {
      console.error('Error requesting codes:', err)
      setError(err.message || 'Failed to request payment codes')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (fetching) {
    return (
      <DashboardLayout
        role="park_operator"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="park_operator"
      companyId={companyId || undefined}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Tickets</h1>
          <p className="text-gray-600 mt-2">Create tickets for passengers</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Payment Code Generated Successfully</span>
            </div>
            <p className="text-sm">{success}</p>
          </div>
        )}

        {generatedCode && routeInfo && codeInfo && (
          <Card id="generated-code-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary-600" />
                Payment Code for Passengers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Route Information</p>
                  <p className="font-semibold text-gray-900">{routeInfo.name}</p>
                  <p className="text-sm text-gray-700">{routeInfo.origin} → {routeInfo.destination}</p>
                  <p className="text-sm text-gray-700 mt-1">Amount per ticket: {routeInfo.fare} SLL</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Reusable Payment Code - This single code can be used {codeInfo.total_tickets} time(s)
                  </p>
                  <div className="flex items-center justify-between p-4 bg-white border-2 border-primary-200 rounded-lg hover:border-primary-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">Payment Code:</span>
                      <span className="font-mono font-bold text-2xl text-primary-600">{generatedCode}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedCode)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === generatedCode ? (
                        <CopyCheck className="w-5 h-5 text-success-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Usage Status:</span>
                      <span className="text-sm font-bold text-blue-900">
                        {codeInfo.used_tickets} / {codeInfo.total_tickets} tickets used
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(codeInfo.used_tickets / codeInfo.total_tickets) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Code will expire after {codeInfo.total_tickets} ticket(s) are paid for
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Important Instructions:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Give this payment code to passengers (can be used {codeInfo.total_tickets} time(s))</li>
                    <li>• Each passenger uses the same code to pay via USSD</li>
                    <li>• After each payment, MoniMe confirms via webhook</li>
                    <li>• Tickets are automatically created in the system</li>
                    <li>• Each passenger receives a unique OTP code after payment</li>
                    <li>• Park inspectors validate tickets using the OTP code before boarding</li>
                    <li>• Code expires automatically after {codeInfo.total_tickets} ticket(s) are paid for</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary-600" />
              Generate New Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Route *
                </label>
                <select
                  value={formData.route_id}
                  onChange={(e) => {
                    // Only allow selection of routes in the assigned routes list
                    const selectedRoute = routes.find(r => r.id === e.target.value)
                    if (selectedRoute) {
                      setFormData({
                        ...formData,
                        route_id: e.target.value,
                        amount: selectedRoute.fare?.toString() || '',
                      })
                    }
                  }}
                  required
                  disabled={loading || routes.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select an assigned route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.origin} → {route.destination}) - {route.fare} SLL
                    </option>
                  ))}
                </select>
                {routes.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No routes assigned to you. Please contact your company admin to assign routes.
                  </p>
                )}
                {routes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Only routes assigned by your company admin are shown
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (SLL) *
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.amount ? (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Route Fare:</span>
                      <span className="text-2xl font-bold text-primary-600">{formData.amount} SLL</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Select a route to see amount</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Amount is fixed by company admin and cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount of Tickets *
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numbers between 1 and 100
                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
                      setFormData({ ...formData, quantity: value })
                    }
                  }}
                  placeholder="Enter number of tickets (1-100)"
                  required
                  min="1"
                  max="100"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Number of times this payment code can be used (1-100 tickets). Code expires after limit is reached.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || routes.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Select the route - amount is automatically set from route fare (fixed by company admin)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Request one reusable payment code from MoniMe (for offline USSD use case)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Give the same payment code to multiple passengers (up to the amount set)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>The code expires automatically after the full amount of tickets is used</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Passengers pay using the code via USSD</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>MoniMe confirms payment via webhook - ticket is automatically created</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Passengers receive OTP code after payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Park inspectors validate tickets using the OTP code before boarding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span className="font-medium">The database is the source of truth - not SMS messages</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

