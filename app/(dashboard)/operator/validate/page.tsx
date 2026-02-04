'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { CheckCircle2, XCircle, Ticket, Wifi, WifiOff, Clock, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ValidateTicketsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [todayCount, setTodayCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [recentValidations, setRecentValidations] = useState<any[]>([])
  const otpInputRef = useRef<HTMLInputElement>(null)

  const loadTodayCount = useCallback(async () => {
    if (!operatorId || !companyId) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', today.toISOString())

    setTodayCount(count || 0)

    // Load recent validations
    const { data: recent } = await supabase
      .from('tickets')
      .select(`
        *,
        routes(name, origin, destination, fare)
      `)
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .order('used_at', { ascending: false })
      .limit(5)

    setRecentValidations(recent || [])
  }, [supabase, operatorId, companyId])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-focus OTP input after successful validation
  useEffect(() => {
    if (result?.success && otpInputRef.current) {
      // Small delay to ensure input is cleared
      setTimeout(() => {
        otpInputRef.current?.focus()
      }, 100)
    }
  }, [result])

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
          .select('id, status, company_id')
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
          await loadTodayCount()
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
  }, [supabase, router, loadTodayCount])

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get operator info
      const { data: operator } = await supabase
        .from('park_operators')
        .select('id, company_id, assigned_routes')
        .eq('user_id', user.id)
        .single()

      if (!operator) throw new Error('Operator not found')

      // CRITICAL: Ensure operator has a company_id
      if (!operator.company_id) {
        throw new Error('No company assigned to your operator account')
      }

      // Find ticket by OTP - MUST be from operator's company
      // This ensures Company A operators can NEVER validate Company B tickets
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          routes(name, origin, destination, fare),
          companies(name)
        `)
        .eq('company_id', operator.company_id) // CRITICAL: Filter by operator's company_id
        .eq('monime_otp', otp)
        .eq('status', 'pending')
        .single()

      if (ticketError || !ticket) {
        // More specific error messages for real-world scenarios
        if (ticketError?.code === 'PGRST116') {
          throw new Error('OTP code not found. Please check the code and try again.')
        }
        throw new Error('Invalid OTP code or ticket already validated. Please verify the code with the passenger.')
      }

      // ADDITIONAL SECURITY: Double-check ticket belongs to operator's company
      if (ticket.company_id !== operator.company_id) {
        console.error('SECURITY ALERT: Cross-company ticket validation attempt', {
          operator_company: operator.company_id,
          ticket_company: ticket.company_id,
        })
        throw new Error('Unauthorized: Ticket does not belong to your company')
      }

      // Check if operator is assigned to this route
      if (operator.assigned_routes && !operator.assigned_routes.includes(ticket.route_id)) {
        throw new Error('Not authorized to validate tickets for this route')
      }

      // Validate ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          validated_by: operator.id,
        })
        .eq('id', ticket.id)

      if (updateError) throw updateError

      // Create audit log
      await supabase.from('audit_logs').insert({
        company_id: operator.company_id,
        user_id: user.id,
        action: 'ticket_validated',
        details: { ticket_id: ticket.id, otp },
      })

      setResult({
        success: true,
        ticket: {
          ...ticket,
          routes: ticket.routes,
          companies: ticket.companies,
        },
      })

      setOtp('')
      await loadTodayCount()
    } catch (err: any) {
      setError(err.message || 'Validation failed')
    } finally {
      setLoading(false)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Validate Tickets</h1>
            <p className="text-gray-600 mt-2">Validate passenger tickets using OTP code</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-success-600" />
                <span className="text-sm text-gray-700">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-error-600" />
                <span className="text-sm text-error-700">Offline</span>
              </>
            )}
          </div>
        </div>

        {error && !operatorId && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Validation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary-600" />
                  Validate Ticket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidate} className="space-y-4">
                  <div>
                    <Input
                      ref={otpInputRef}
                      label="OTP Code"
                      value={otp}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '')
                        setOtp(value)
                        setError('') // Clear error when typing
                      }}
                      placeholder="Enter 6-digit OTP"
                      required
                      maxLength={6}
                      disabled={loading || !operatorId || !isOnline}
                      autoFocus
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-digit code from passenger
                    </p>
                  </div>

                  {error && (
                    <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  {result?.success && (
                    <div className="bg-success-50 border-2 border-success-300 text-success-700 px-4 py-4 rounded-lg animate-fade-in-up">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-success-600" />
                        <span className="font-bold text-lg">✓ Ticket Validated Successfully</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Route:</span>
                          <span className="font-semibold text-gray-900">{result.ticket.routes?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Route:</span>
                          <span className="font-semibold text-gray-900">{result.ticket.routes?.origin} → {result.ticket.routes?.destination}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fare:</span>
                          <span className="font-semibold text-gray-900">{result.ticket.routes?.fare} SLL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Passenger:</span>
                          <span className="font-semibold text-gray-900">{result.ticket.passenger_phone}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-semibold text-gray-900">{formatDate(new Date())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full text-lg py-3" 
                    disabled={loading || !operatorId || !isOnline}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : !isOnline ? (
                      'Offline - Cannot Validate'
                    ) : (
                      'Validate Ticket (Enter)'
                    )}
                  </Button>
                  {!isOnline && (
                    <p className="text-xs text-error-600 text-center">
                      Please check your internet connection to validate tickets
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{todayCount}</p>
                <p className="text-sm text-gray-600 mt-2">Validations Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Validations */}
        {recentValidations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                Recent Validations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentValidations.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ticket.routes?.name || 'Unknown Route'}</p>
                      <p className="text-sm text-gray-600">
                        {ticket.routes?.origin || 'N/A'} → {ticket.routes?.destination || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {ticket.used_at && formatDate(ticket.used_at)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">{ticket.routes?.fare || 0} SLL</p>
                      <p className="text-xs text-gray-500">{ticket.passenger_phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

