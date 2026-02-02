'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { TrendingUp, Calendar, DollarSign, Ticket, Filter, Loader2, Download } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function TripsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [operatorId, setOperatorId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Statistics
  const [todayCount, setTodayCount] = useState(0)
  const [weekCount, setWeekCount] = useState(0)
  const [monthCount, setMonthCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [monthRevenue, setMonthRevenue] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  
  // Tickets data
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])

  const loadStatistics = useCallback(async () => {
    if (!operatorId || !companyId) return

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
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
      .gte('used_at', todayDate.toISOString())
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

    // Get all tickets for revenue and route calculations
    const { data: allTickets } = await supabase
      .from('tickets')
      .select(`
        *,
        routes(name, origin, destination, fare)
      `)
      .eq('company_id', companyId)
      .eq('validated_by', operatorId)
      .eq('status', 'used')
      .order('used_at', { ascending: false })

    if (allTickets) {
      setRecentTickets(allTickets)
      
      // Calculate revenue
      const todayTickets = allTickets.filter((t: any) => 
        t.used_at && new Date(t.used_at) >= todayDate
      )
      const weekTickets = allTickets.filter((t: any) => 
        t.used_at && new Date(t.used_at) >= weekAgo
      )
      const monthTickets = allTickets.filter((t: any) => 
        t.used_at && new Date(t.used_at) >= monthAgo
      )

      const todayRev = todayTickets.reduce((sum: number, t: any) => 
        sum + (Number(t.routes?.fare) || 0), 0
      )
      const weekRev = weekTickets.reduce((sum: number, t: any) => 
        sum + (Number(t.routes?.fare) || 0), 0
      )
      const monthRev = monthTickets.reduce((sum: number, t: any) => 
        sum + (Number(t.routes?.fare) || 0), 0
      )
      const totalRev = allTickets.reduce((sum: number, t: any) => 
        sum + (Number(t.routes?.fare) || 0), 0
      )

      setTodayRevenue(todayRev)
      setWeekRevenue(weekRev)
      setMonthRevenue(monthRev)
      setTotalRevenue(totalRev)
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

  // Filter tickets based on selected filter
  useEffect(() => {
    if (!recentTickets.length) {
      setFilteredTickets([])
      return
    }

    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)

    let filtered = recentTickets

    switch (filter) {
      case 'today':
        filtered = recentTickets.filter((t: any) => 
          t.used_at && new Date(t.used_at) >= todayDate
        )
        break
      case 'week':
        filtered = recentTickets.filter((t: any) => 
          t.used_at && new Date(t.used_at) >= weekAgo
        )
        break
      case 'month':
        filtered = recentTickets.filter((t: any) => 
          t.used_at && new Date(t.used_at) >= monthAgo
        )
        break
      default:
        filtered = recentTickets
    }

    setFilteredTickets(filtered)
  }, [filter, recentTickets])

  const handleExport = () => {
    try {
      console.log('Export button clicked')
      console.log('Filtered tickets:', filteredTickets.length)
      
      if (!filteredTickets || filteredTickets.length === 0) {
        alert('No tickets to export. Please select a filter that has tickets.')
        return
      }

      // Helper function to escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }

      // Create summary statistics section
      const summaryHeaders = ['Period', 'Validations', 'Revenue']
      const summaryRows = [
        ['Today', (todayCount || 0).toString(), formatCurrency(todayRevenue || 0)],
        ['This Week', (weekCount || 0).toString(), formatCurrency(weekRevenue || 0)],
        ['This Month', (monthCount || 0).toString(), formatCurrency(monthRevenue || 0)],
        ['Total', (totalCount || 0).toString(), formatCurrency(totalRevenue || 0)],
      ]

      // Create ticket details section
      const ticketHeaders = ['Date', 'Route', 'Origin → Destination', 'Passenger Phone', 'Fare', 'Ticket Code']
      const ticketRows = filteredTickets.map((ticket: any) => {
        const route = ticket.routes || {}
        return [
          ticket.used_at ? formatDate(ticket.used_at) : 'N/A',
          route.name || 'N/A',
          `${route.origin || 'N/A'} → ${route.destination || 'N/A'}`,
          ticket.passenger_phone || 'N/A',
          formatCurrency(route.fare || 0),
          ticket.code || ticket.id || 'N/A',
        ]
      })

      // Combine all sections
      const csvRows = [
        'Trip Dashboard Report',
        `Filter: ${filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '=== SUMMARY STATISTICS ===',
        summaryHeaders.map(escapeCSV).join(','),
        ...summaryRows.map(row => row.map(escapeCSV).join(',')),
        '',
        '=== TICKET DETAILS ===',
        ticketHeaders.map(escapeCSV).join(','),
        ...ticketRows.map(row => row.map(escapeCSV).join(','))
      ]

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF'
      const csvContent = BOM + csvRows.join('\n')

      console.log('CSV content length:', csvContent.length)

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      const filterStr = filter === 'all' ? 'all' : filter
      link.download = `trip-dashboard-${filterStr}-${dateStr}.csv`
      
      // Append to body and trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(url)
      }, 200)
      
      console.log('Export completed successfully')
    } catch (error: any) {
      console.error('Error exporting CSV:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Failed to export CSV: ${error.message || 'Unknown error'}. Please check the console for details.`)
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
            <p className="text-gray-600">Loading trip dashboard...</p>
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
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trip Dashboard</h1>
            <p className="text-gray-600 mt-2">View your validation activity and trip statistics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={filteredTickets.length === 0}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Export CSV</span>
            </Button>
          </div>
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
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Tickets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary-600" />
                Trip History
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'today' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('today')}
                  >
                    Today
                  </Button>
                  <Button
                    variant={filter === 'week' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={filter === 'month' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('month')}
                  >
                    Month
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTickets.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ticket.routes?.name || 'Unknown Route'}</p>
                      <p className="text-sm text-gray-600">
                        {ticket.routes?.origin || 'N/A'} → {ticket.routes?.destination || 'N/A'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-gray-500">
                          {ticket.used_at && formatDate(ticket.used_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Passenger: {ticket.passenger_phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(ticket.routes?.fare || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Fare</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">
                {recentTickets.length === 0 
                  ? 'No validations yet' 
                  : `No validations found for ${filter === 'all' ? 'all time' : filter}`
                }
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
