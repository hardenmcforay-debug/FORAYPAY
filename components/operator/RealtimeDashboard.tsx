'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import { CheckCircle, Ticket, TrendingUp, FileText, Clock } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

interface Operator {
  id: string
  company_id: string
  route_id: string | null
  routes?: { name?: string; origin?: string; destination?: string }
  companies?: { name?: string }
}

interface DashboardStats {
  todayValidations: number
  weekValidations: number
  monthValidations: number
  todayGeneratedTickets: number
  weekGeneratedTickets: number
  monthGeneratedTickets: number
  pendingGeneratedTickets: number
  totalGeneratedTickets: number
  usedGeneratedTickets: number
}

interface RealtimeDashboardProps {
  initialOperator: Operator
  initialStats: DashboardStats
}

export default function RealtimeDashboard({ initialOperator, initialStats }: RealtimeDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const supabase = createClient()


  // Fetch updated stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/operators/stats', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to validations changes
    const validationsChannel = supabase
      .channel('validations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validations',
          filter: `park_operator_id=eq.${initialOperator.id}`,
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    // Subscribe to tickets changes
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `company_id=eq.${initialOperator.company_id}`,
        },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(validationsChannel)
      supabase.removeChannel(ticketsChannel)
    }
  }, [initialOperator, supabase, fetchStats])

  const statsArray = [
    {
      title: 'Today\'s Validations',
      value: stats.todayValidations,
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'This Week\'s Validations',
      value: stats.weekValidations,
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Month\'s Validations',
      value: stats.monthValidations,
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Today\'s Generated Tickets',
      value: stats.todayGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Week\'s Generated Tickets',
      value: stats.weekGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'This Month\'s Generated Tickets',
      value: stats.monthGeneratedTickets,
      icon: Ticket,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Pending Generated Tickets',
      value: stats.pendingGeneratedTickets,
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ]

  const routeInfo = initialOperator.routes && typeof initialOperator.routes === 'object' && !Array.isArray(initialOperator.routes)
    ? initialOperator.routes as { name?: string; origin?: string; destination?: string }
    : null

  const companyInfo = initialOperator.companies && typeof initialOperator.companies === 'object' && !Array.isArray(initialOperator.companies)
    ? initialOperator.companies as { name?: string }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="mt-1 space-y-1">
          {companyInfo && companyInfo.name && (
            <p className="text-gray-600 font-medium">
              Company: {companyInfo.name}
            </p>
          )}
          <p className="text-gray-600">
            {routeInfo && routeInfo.origin && routeInfo.destination
              ? `Route: ${routeInfo.origin} - ${routeInfo.destination}`
              : 'No route assigned'}
          </p>
        </div>
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

      {/* Generated Tickets Details */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Generated Tickets Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">Summary of tickets you have generated</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Total Generated</h3>
              <Ticket className="h-5 w-5 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalGeneratedTickets}</p>
            <p className="text-xs text-gray-500 mt-1">All time generated tickets</p>
          </div>

          <div className="p-4 border-2 border-warning-200 rounded-lg bg-warning-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Pending</h3>
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingGeneratedTickets}</p>
            <p className="text-xs text-gray-500 mt-1">Waiting for payment</p>
          </div>

          <div className="p-4 border-2 border-success-200 rounded-lg bg-success-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Used</h3>
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.usedGeneratedTickets}</p>
            <p className="text-xs text-gray-500 mt-1">Validated tickets</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-center py-8">
          <Ticket className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Validate Tickets</h2>
          <p className="text-gray-600 mb-6">Start validating passenger tickets using their order numbers</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/operator/validate">
              <Button size="lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                Validate Ticket
              </Button>
            </Link>
            <Link href="/operator/tickets">
              <Button size="lg" variant="outline">
                <Ticket className="h-5 w-5 mr-2" />
                Generate Tickets
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

