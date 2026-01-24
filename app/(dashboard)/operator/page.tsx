'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Ticket, TrendingUp, Calendar, DollarSign, Route, QrCode, CheckCircle2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function OperatorDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [operatorId, setOperatorId] = useState<string | null>(null)
  
  // Statistics
  const [todayCount, setTodayCount] = useState(0)
  const [weekCount, setWeekCount] = useState(0)
  const [monthCount, setMonthCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  
  // Tickets Generated Statistics
  const [todayGenerated, setTodayGenerated] = useState(0)
  const [weekGenerated, setWeekGenerated] = useState(0)
  const [monthGenerated, setMonthGenerated] = useState(0)
  const [totalGenerated, setTotalGenerated] = useState(0)
  const [todayGeneratedTickets, setTodayGeneratedTickets] = useState(0)
  const [weekGeneratedTickets, setWeekGeneratedTickets] = useState(0)
  const [monthGeneratedTickets, setMonthGeneratedTickets] = useState(0)
  const [totalGeneratedTickets, setTotalGeneratedTickets] = useState(0)
  const [recentGeneratedCodes, setRecentGeneratedCodes] = useState<any[]>([])

  const loadStatistics = useCallback(async () => {
    if (!operatorId || !companyId) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)

    // Today's validations
    const { count: todayCountValue } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', today.toISOString())
    setTodayCount(todayCountValue || 0)

    // Week's validations
    const { count: weekCountValue } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', weekAgo.toISOString())
    setWeekCount(weekCountValue || 0)

    // Month's validations
    const { count: monthCountValue } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', monthAgo.toISOString())
    setMonthCount(monthCountValue || 0)

    // Total validations
    const { count: totalCountValue } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
    setTotalCount(totalCountValue || 0)

    // Revenue calculations
    const { data: todayTickets } = await supabase
      .from('tickets')
      .select(`
        route_id,
        routes(fare)
      `)
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', today.toISOString())

    const { data: weekTickets } = await supabase
      .from('tickets')
      .select(`
        route_id,
        routes(fare)
      `)
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', weekAgo.toISOString())

    const { data: monthTickets } = await supabase
      .from('tickets')
      .select(`
        route_id,
        routes(fare)
      `)
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .gte('used_at', monthAgo.toISOString())

    const todayRev = todayTickets?.reduce((sum, t: any) => sum + (Number(t.routes?.fare) || 0), 0) || 0
    const weekRev = weekTickets?.reduce((sum, t: any) => sum + (Number(t.routes?.fare) || 0), 0) || 0
    const monthRev = monthTickets?.reduce((sum, t: any) => sum + (Number(t.routes?.fare) || 0), 0) || 0

    setTodayRevenue(todayRev)
    setWeekRevenue(weekRev)
    setMonthRevenue(monthRev)

    // Recent validations
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
      .limit(10)

    setRecentTickets(recent || [])

    // Tickets Generated Statistics (Payment Codes)
    // Today's generated codes
    const { count: todayGeneratedCount } = await supabase
      .from('payment_codes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('operator_id', operatorId)
      .gte('created_at', today.toISOString())
    
    setTodayGenerated(todayGeneratedCount || 0)

    // Week's generated codes
    const { count: weekGeneratedCount } = await supabase
      .from('payment_codes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('operator_id', operatorId)
      .gte('created_at', weekAgo.toISOString())
    
    setWeekGenerated(weekGeneratedCount || 0)

    // Month's generated codes
    const { count: monthGeneratedCount } = await supabase
      .from('payment_codes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('operator_id', operatorId)
      .gte('created_at', monthAgo.toISOString())
    
    setMonthGenerated(monthGeneratedCount || 0)

    // Total generated codes
    const { count: totalGeneratedCount } = await supabase
      .from('payment_codes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('operator_id', operatorId)
    
    setTotalGenerated(totalGeneratedCount || 0)

    // Get all payment codes for ticket count calculations
    const { data: allPaymentCodes } = await supabase
      .from('payment_codes')
      .select('total_tickets, used_tickets, created_at')
      .eq('company_id', companyId)
      .eq('operator_id', operatorId)

    if (allPaymentCodes) {
      // Calculate total tickets that can be generated from codes
      const todayCodes = allPaymentCodes.filter((pc: any) => 
        new Date(pc.created_at) >= today
      )
      const weekCodes = allPaymentCodes.filter((pc: any) => 
        new Date(pc.created_at) >= weekAgo
      )
      const monthCodes = allPaymentCodes.filter((pc: any) => 
        new Date(pc.created_at) >= monthAgo
      )

      const todayTickets = todayCodes.reduce((sum: number, pc: any) => sum + (pc.total_tickets || 0), 0)
      const weekTickets = weekCodes.reduce((sum: number, pc: any) => sum + (pc.total_tickets || 0), 0)
      const monthTickets = monthCodes.reduce((sum: number, pc: any) => sum + (pc.total_tickets || 0), 0)
      const totalTickets = allPaymentCodes.reduce((sum: number, pc: any) => sum + (pc.total_tickets || 0), 0)

      setTodayGeneratedTickets(todayTickets)
      setWeekGeneratedTickets(weekTickets)
      setMonthGeneratedTickets(monthTickets)
      setTotalGeneratedTickets(totalTickets)

      // Recent generated codes with route info
      const { data: recentCodes } = await supabase
        .from('payment_codes')
        .select(`
          *,
          routes(name, origin, destination, fare)
        `)
        .eq('company_id', companyId)
        .eq('operator_id', operatorId)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentGeneratedCodes(recentCodes || [])
    }
  }, [supabase, operatorId, companyId])

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
          await loadStatistics()
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
  }, [supabase, router, loadStatistics])

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
            <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">View your statistics and recent activity</p>
          </div>
          <Button
            onClick={() => router.push('/operator/validate')}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Validate Tickets
          </Button>
        </div>

        {error && !operatorId && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today&apos;s Validations</p>
                  <p className="text-3xl font-bold text-gray-900">{todayCount}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(todayRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Week</p>
                  <p className="text-3xl font-bold text-gray-900">{weekCount}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(weekRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{monthCount}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(monthRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Validations</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Issued Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tickets Issued Today</p>
                  <p className="text-3xl font-bold text-gray-900">{todayGenerated}</p>
                  <p className="text-xs text-gray-500 mt-1">{todayGeneratedTickets} tickets</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tickets Issued This Week</p>
                  <p className="text-3xl font-bold text-gray-900">{weekGenerated}</p>
                  <p className="text-xs text-gray-500 mt-1">{weekGeneratedTickets} tickets</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tickets Issued This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{monthGenerated}</p>
                  <p className="text-xs text-gray-500 mt-1">{monthGeneratedTickets} tickets</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Tickets Issued</p>
                  <p className="text-3xl font-bold text-gray-900">{totalGenerated}</p>
                  <p className="text-xs text-gray-500 mt-1">{totalGeneratedTickets} tickets</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tickets Issued */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary-600" />
                Recent Tickets Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTickets.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ticket.routes?.name}</p>
                        <p className="text-sm text-gray-600">
                          {ticket.routes?.origin} → {ticket.routes?.destination}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.used_at && formatDate(ticket.used_at)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(ticket.routes?.fare || 0)}</p>
                        <p className="text-xs text-gray-500">{ticket.passenger_phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No tickets issued yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Generated Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary-600" />
                Recent Generated Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentGeneratedCodes.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentGeneratedCodes.map((code: any) => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{code.routes?.name || 'Unknown Route'}</p>
                        <p className="text-sm text-gray-600">
                          {code.routes?.origin || 'N/A'} → {code.routes?.destination || 'N/A'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-gray-500">
                            Code: <span className="font-mono font-semibold">{code.monime_code}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {code.created_at && formatDate(code.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">
                          {code.used_tickets} / {code.total_tickets}
                        </p>
                        <p className="text-xs text-gray-500">
                          {code.status === 'active' ? 'Active' : code.status === 'expired' ? 'Expired' : 'Cancelled'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No codes generated yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
