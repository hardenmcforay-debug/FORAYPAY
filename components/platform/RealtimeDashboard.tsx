'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import { Building2, DollarSign, Ticket, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PlatformStats {
  companyCount: number
  activeCompanyCount: number
  totalRevenue: number
  totalCommission: number
  ticketCount: number
}

interface CompanyData {
  name: string
  ticketCount?: number
  totalCommission?: number
}

interface RealtimeDashboardProps {
  initialStats: PlatformStats
  initialTicketsByCompany: CompanyData[]
  initialCommissionByCompany: CompanyData[]
}

export default function RealtimeDashboard({
  initialStats,
  initialTicketsByCompany,
  initialCommissionByCompany,
}: RealtimeDashboardProps) {
  const [stats, setStats] = useState<PlatformStats>(initialStats)
  const [ticketsByCompany, setTicketsByCompany] = useState<CompanyData[]>(initialTicketsByCompany)
  const [commissionByCompany, setCommissionByCompany] = useState<CompanyData[]>(initialCommissionByCompany)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/platform/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.stats)
      setTicketsByCompany(data.ticketsByCompany)
      setCommissionByCompany(data.commissionByCompany)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to companies changes
    const companiesChannel = supabase
      .channel('platform-companies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to transactions changes
    const transactionsChannel = supabase
      .channel('platform-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to tickets changes
    const ticketsChannel = supabase
      .channel('platform-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(companiesChannel)
      supabase.removeChannel(transactionsChannel)
      supabase.removeChannel(ticketsChannel)
    }
  }, [supabase, fetchStats])

  const statsArray = [
    {
      title: 'Total Companies',
      value: stats.companyCount,
      icon: Building2,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Active Companies',
      value: stats.activeCompanyCount,
      icon: Building2,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Total Platform Commission (30d)',
      value: formatCurrency(stats.totalCommission),
      icon: TrendingUp,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
    },
    {
      title: 'Total Tickets(30d)',
      value: stats.ticketCount,
      icon: Ticket,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of all companies and platform metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsArray.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Tickets Issued (30d) by Company */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Tickets Issued (30d) per Company</h2>
          </div>
          {ticketsByCompany.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tickets issued in the last 30 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Issued (30d)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticketsByCompany.map((company, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {company.ticketCount}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Platform Commission (30d) by Company */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Commission(30d) from Each Company</h2>
          </div>
          {commissionByCompany.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No commission data available for the last 30 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission (30d)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionByCompany.map((company, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(company.totalCommission || 0)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

