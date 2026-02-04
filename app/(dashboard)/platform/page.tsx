'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Building2, TrendingUp, DollarSign, Ticket, RefreshCw, Wifi, WifiOff, Calendar, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function PlatformDashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Date range filter
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d')
  
  // Statistics
  const [stats, setStats] = useState({
    activeCompanies: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalTickets: 0,
  })
  
  // Company statistics
  const [companyTicketStats, setCompanyTicketStats] = useState<any[]>([])
  const [companyRevenueStats, setCompanyRevenueStats] = useState<any[]>([])

  const loadData = useCallback(async () => {
    try {
      let startDate: Date | null = null
      const endDate = new Date()

      switch (dateRange) {
        case '24h':
          startDate = new Date()
          startDate.setHours(startDate.getHours() - 24)
          break
        case '7d':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 90)
          break
        case 'all':
          startDate = null
          break
      }

      // Get active companies
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')

      // Get total transactions
      let transactionsQuery = supabase
        .from('transactions')
        .select('amount, commission, company_id')
      
      if (startDate) {
        transactionsQuery = transactionsQuery.gte('created_at', startDate.toISOString())
      }
      
      const { data: totalTransactions } = await transactionsQuery

      // Get total tickets
      let ticketsQuery = supabase
        .from('tickets')
        .select('company_id', { count: 'exact', head: true })
      
      if (startDate) {
        ticketsQuery = ticketsQuery.gte('created_at', startDate.toISOString())
      }
      
      const { count: totalTickets } = await ticketsQuery

      const totalRevenue = totalTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalCommission = totalTransactions?.reduce((sum, t) => sum + (t.commission || 0), 0) || 0

      setStats({
        activeCompanies: companies?.length || 0,
        totalRevenue,
        totalCommission,
        totalTickets: totalTickets || 0,
      })

      // Get tickets by company
      let ticketsByCompanyQuery = supabase
        .from('tickets')
        .select('company_id')
      
      if (startDate) {
        ticketsByCompanyQuery = ticketsByCompanyQuery.gte('created_at', startDate.toISOString())
      }
      
      const { data: tickets30d } = await ticketsByCompanyQuery

      const ticketsByCompany = new Map<string, number>()
      tickets30d?.forEach((ticket) => {
        if (ticket.company_id) {
          ticketsByCompany.set(ticket.company_id, (ticketsByCompany.get(ticket.company_id) || 0) + 1)
        }
      })

      // Get revenue by company
      let revenueByCompanyQuery = supabase
        .from('transactions')
        .select('company_id, commission')
        .eq('status', 'completed')
      
      if (startDate) {
        revenueByCompanyQuery = revenueByCompanyQuery.gte('created_at', startDate.toISOString())
      }
      
      const { data: transactions30d } = await revenueByCompanyQuery

      const revenueByCompany = new Map<string, number>()
      transactions30d?.forEach((transaction) => {
        if (transaction.company_id && transaction.commission) {
          revenueByCompany.set(
            transaction.company_id,
            (revenueByCompany.get(transaction.company_id) || 0) + transaction.commission
          )
        }
      })

      // Create stats arrays
      const ticketStats = companies?.map((company) => ({
        id: company.id,
        name: company.name || 'Unknown Company',
        tickets: ticketsByCompany.get(company.id) || 0,
      })).sort((a, b) => b.tickets - a.tickets) || []

      const revenueStats = companies?.map((company) => ({
        id: company.id,
        name: company.name || 'Unknown Company',
        revenue: revenueByCompany.get(company.id) || 0,
      })).sort((a, b) => b.revenue - a.revenue) || []

      setCompanyTicketStats(ticketStats)
      setCompanyRevenueStats(revenueStats)
    } catch (err: any) {
      console.error('Error loading data:', err)
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }, [supabase, dateRange])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setUserEmail(user.email || '')

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'platform_admin') {
          router.push('/unauthorized')
          return
        }

        loadData()
      } catch (err: any) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [supabase, router, loadData])

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

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleExport = () => {
    // Create CSV content for company statistics
    const headers = ['Company Name', 'Tickets Issued', 'Platform Revenue']
    const rows = companyTicketStats.map((stat) => {
      const revenue = companyRevenueStats.find(r => r.id === stat.id)?.revenue || 0
      return [
        stat.name,
        stat.tickets.toString(),
        formatCurrency(revenue),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `platform-stats-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (fetching) {
    return (
      <DashboardLayout
        role="platform_admin"
        userEmail={userEmail}
        userName="Platform Admin"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-400">Loading dashboard...</p>
          </div>
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-500">Platform Dashboard</h1>
            <p className="text-sm sm:text-base text-blue-400 mt-1 sm:mt-2">Overview of all companies and system metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-100">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-success-600" />
                  <span className="text-xs sm:text-sm text-blue-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-error-600" />
                  <span className="text-xs sm:text-sm text-error-700">Offline</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <RefreshCw className={`w-4 h-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={companyTicketStats.length === 0}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <label className="text-sm font-medium text-blue-400 whitespace-nowrap">Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '24h' | '7d' | '30d' | '90d' | 'all')}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base w-full sm:w-auto"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-400 mb-1">Active Companies</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.activeCompanies}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-400 mb-1">Total Revenue</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500 truncate">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-400 mb-1">Platform Commission</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500 truncate">{formatCurrency(stats.totalCommission)}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-400 mb-1">Total Tickets Issued</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500">{stats.totalTickets}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets by Company */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary-600" />
              Total Tickets Issued by Company
              {dateRange !== 'all' && (
                <span className="text-sm font-normal text-blue-400">
                  ({dateRange === '24h' ? 'Last 24 Hours' : `Last ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} Days`})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyTicketStats.length > 0 ? (
              <div className="space-y-3">
                {companyTicketStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-blue-500">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-500">{stat.tickets}</span>
                      <span className="text-sm text-blue-400">tickets</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-500">Total</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {companyTicketStats.reduce((sum, s) => sum + s.tickets, 0)}
                      </span>
                      <span className="text-sm text-blue-400">tickets</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-blue-400 text-center py-8">No tickets issued in the selected period</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Company */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success-600" />
              Total Revenue Generated from each company
              {dateRange !== 'all' && (
                <span className="text-sm font-normal text-blue-400">
                  ({dateRange === '24h' ? 'Last 24 Hours' : `Last ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} Days`})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {companyRevenueStats.length > 0 ? (
              <div className="space-y-3">
                {companyRevenueStats.map((stat) => (
                  <div
                    key={stat.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-success-600" />
                      </div>
                      <span className="font-medium text-blue-500">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-500">
                        {formatCurrency(stat.revenue)}
                      </span>
                      <span className="text-sm text-blue-400">platform commission</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-500">Total Platform Revenue</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-success-600">
                        {formatCurrency(companyRevenueStats.reduce((sum, s) => sum + s.revenue, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-blue-400 text-center py-8">No platform revenue in the selected period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
