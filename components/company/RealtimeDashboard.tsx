'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import { DollarSign, Ticket, Route, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import RevenueChart from '@/components/features/RevenueChart'

interface CompanyStats {
  totalRevenue: number
  totalCommission: number
  netRevenue: number
  ticketCount: number
  routeCount: number
}

interface RevenueByRoute {
  [routeName: string]: {
    revenue: number
    count: number
  }
}

interface TicketsByRoute {
  [routeName: string]: {
    count: number
  }
}

interface RealtimeDashboardProps {
  companyId: string
  companyName?: string
  initialStats: CompanyStats
  initialRevenueByRoute: {
    today: RevenueByRoute
    week: RevenueByRoute
    month: RevenueByRoute
  }
  initialTicketsByRoute: {
    today: TicketsByRoute
    week: TicketsByRoute
    month: TicketsByRoute
  }
}

export default function RealtimeDashboard({
  companyId,
  companyName,
  initialStats,
  initialRevenueByRoute,
  initialTicketsByRoute,
}: RealtimeDashboardProps) {
  const [stats, setStats] = useState<CompanyStats>(initialStats)
  const [revenueByRoute, setRevenueByRoute] = useState(initialRevenueByRoute)
  const [ticketsByRoute, setTicketsByRoute] = useState(initialTicketsByRoute)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/company/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.stats)
      setRevenueByRoute(data.revenueByRoute)
      setTicketsByRoute(data.ticketsByRoute)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to tickets changes
    const ticketsChannel = supabase
      .channel('company-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel('company-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ticketsChannel)
      supabase.removeChannel(transactionsChannel)
    }
  }, [companyId, supabase, fetchStats])

  const statsArray = [
    {
      title: 'Gross revenue(30d)',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Net Revenue (30d)',
      value: formatCurrency(stats.netRevenue),
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Total Tickets Issued (30d)',
      value: stats.ticketCount,
      icon: Ticket,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Active Routes',
      value: stats.routeCount,
      icon: Route,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {companyName || 'Company Admin'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsArray.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} delay={index as 0 | 1 | 2 | 3} className="group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 transition-colors duration-300 group-hover:text-gray-900">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-6 w-6 ${stat.color} transition-all duration-300 group-hover:scale-110`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Route (1d)</h2>
          <div className="space-y-3">
            {Object.entries(revenueByRoute.today).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue data available for today</p>
            ) : (
              Object.entries(revenueByRoute.today)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                      <p className="text-sm text-gray-500">{data.count} tickets</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                  </div>
                ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Route (7d)</h2>
          <div className="space-y-3">
            {Object.entries(revenueByRoute.week).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue data available for the last 7 days</p>
            ) : (
              Object.entries(revenueByRoute.week)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                      <p className="text-sm text-gray-500">{data.count} tickets</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                  </div>
                ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Route (30d)</h2>
          <div className="space-y-3">
            {Object.entries(revenueByRoute.month).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revenue data available</p>
            ) : (
              Object.entries(revenueByRoute.month)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                      <p className="text-sm text-gray-500">{data.count} tickets</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.revenue)}</p>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets Issued (1d) by Route</h2>
          <div className="space-y-3">
            {Object.entries(ticketsByRoute.today).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tickets issued today</p>
            ) : (
              Object.entries(ticketsByRoute.today)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Tickets:</p>
                      <p className="font-semibold text-gray-900">{data.count}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets Issued (7d) by Route</h2>
          <div className="space-y-3">
            {Object.entries(ticketsByRoute.week).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tickets issued in the last 7 days</p>
            ) : (
              Object.entries(ticketsByRoute.week)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Tickets:</p>
                      <p className="font-semibold text-gray-900">{data.count}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets Issued (30d) by Route</h2>
          <div className="space-y-3">
            {Object.entries(ticketsByRoute.month).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tickets issued in the last 30 days</p>
            ) : (
              Object.entries(ticketsByRoute.month)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([routeName, data]) => (
                  <div key={routeName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{routeName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">Tickets:</p>
                      <p className="font-semibold text-gray-900">{data.count}</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <RevenueChart companyId={companyId} />
        </Card>
      </div>
    </div>
  )
}

