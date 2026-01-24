'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, TrendingUp, Download, Calendar, RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [fetching, setFetching] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Date range filters
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d' | 'custom'>('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadTransactions = useCallback(async () => {
    if (!companyId) return

    try {
      let startDateValue: Date
      const endDateValue = new Date()

      switch (dateRange) {
        case '24h':
          startDateValue = new Date()
          startDateValue.setHours(startDateValue.getHours() - 24)
          break
        case '7d':
          startDateValue = new Date()
          startDateValue.setDate(startDateValue.getDate() - 7)
          break
        case '30d':
          startDateValue = new Date()
          startDateValue.setDate(startDateValue.getDate() - 30)
          break
        case '90d':
          startDateValue = new Date()
          startDateValue.setDate(startDateValue.getDate() - 90)
          break
        case 'custom':
          if (!startDate || !endDate) {
            setFetching(false)
            setRefreshing(false)
            return
          }
          startDateValue = new Date(startDate)
          break
        default:
          startDateValue = new Date()
          startDateValue.setDate(startDateValue.getDate() - 30)
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          tickets(
            route_id,
            routes(name, origin, destination),
            passenger_phone,
            created_at
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', startDateValue.toISOString())
        .lte('created_at', dateRange === 'custom' ? new Date(endDate).toISOString() : endDateValue.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
      setFilteredTransactions(data || [])
    } catch (err: any) {
      console.error('Error loading transactions:', err)
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }, [supabase, companyId, dateRange, startDate, endDate])

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
          .select('role, company_id')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'company_admin') {
          router.push('/unauthorized')
          return
        }

        if (!profile.company_id) {
          setFetching(false)
          return
        }

        setCompanyId(profile.company_id)
      } catch (err: any) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [supabase, router])

  useEffect(() => {
    if (companyId) {
      loadTransactions()
    }
  }, [companyId, loadTransactions])

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
    loadTransactions()
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Route', 'Origin → Destination', 'Passenger', 'Amount', 'Commission', 'Net Revenue']
    const rows = filteredTransactions.map((t: any) => [
      formatDate(t.created_at),
      t.tickets?.routes?.name || 'N/A',
      `${t.tickets?.routes?.origin || 'N/A'} → ${t.tickets?.routes?.destination || 'N/A'}`,
      t.tickets?.passenger_phone || 'N/A',
      formatCurrency(t.amount),
      formatCurrency(t.commission),
      formatCurrency(t.net_amount),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate summary statistics
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalCommission = filteredTransactions.reduce((sum, t) => sum + (t.commission || 0), 0)
  const netRevenue = filteredTransactions.reduce((sum, t) => sum + (t.net_amount || 0), 0)
  const transactionCount = filteredTransactions.length

  if (fetching) {
    return (
      <DashboardLayout
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="company_admin"
      companyId={companyId || undefined}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Transaction history and revenue reports</p>
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => {
                      setDateRange(e.target.value as '24h' | '7d' | '30d' | '90d' | 'custom')
                      if (e.target.value !== 'custom') {
                        setStartDate('')
                        setEndDate('')
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {dateRange === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </>
                  )}
                </div>
              </div>
              {dateRange === 'custom' && startDate && endDate && (
                <Button onClick={loadTransactions}>
                  Apply Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Gross Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(netRevenue)}</p>
                </div>
                <FileText className="w-8 h-8 text-success-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Commission Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommission)}</p>
                </div>
                <FileText className="w-8 h-8 text-warning-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactionCount}</p>
                </div>
                <FileText className="w-8 h-8 text-error-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Transactions {dateRange === 'custom' ? `(${startDate} to ${endDate})` : dateRange === '24h' ? '(Last 24 Hours)' : `(Last ${dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} Days)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="table-wrapper">
                  <table className="w-full min-w-full">
                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Route</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Passenger</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Commission</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {transaction.tickets?.routes?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {transaction.tickets?.passenger_phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-warning-600">
                          {formatCurrency(transaction.commission)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-success-600">
                          {formatCurrency(transaction.net_amount)}
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No transactions found for the selected period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
