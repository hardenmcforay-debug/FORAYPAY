'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Ticket, Users, Clock, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Operator {
  id: string
  company_id: string
  route_id: string | null
  location?: string | null
  routes?: { name?: string; origin?: string; destination?: string }
}

interface Validation {
  id: string
  validated_at: string
  is_valid: boolean
  tickets: {
    passenger_phone: string
    routes: {
      name?: string
      origin?: string
      destination?: string
    }
  }
}

interface RealtimeTripsProps {
  initialOperator: Operator
  initialTodayCount: number
  initialRecentValidations: Validation[]
}

export default function RealtimeTrips({ initialOperator, initialTodayCount, initialRecentValidations }: RealtimeTripsProps) {
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [recentValidations, setRecentValidations] = useState<Validation[]>(initialRecentValidations)
  const supabase = createClient()

  const fetchValidations = useCallback(async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [countRes, validationsRes] = await Promise.all([
        supabase
          .from('validations')
          .select('*', { count: 'exact', head: true })
          .eq('park_operator_id', initialOperator.id)
          .eq('is_valid', true)
          .gte('validated_at', today.toISOString()),
        supabase
          .from('validations')
          .select(`
            id,
            validated_at,
            is_valid,
            tickets!inner(
              passenger_phone,
              routes!inner(name, origin, destination)
            )
          `)
          .eq('park_operator_id', initialOperator.id)
          .eq('is_valid', true)
          .order('validated_at', { ascending: false })
          .limit(10),
      ])

      if (countRes.count !== null) {
        setTodayCount(countRes.count)
      }

      if (validationsRes.data) {
        setRecentValidations(validationsRes.data as Validation[])
      }
    } catch (error) {
      console.error('Error fetching validations:', error)
    }
  }, [initialOperator.id, supabase])

  useEffect(() => {
    // Subscribe to validations changes
    const validationsChannel = supabase
      .channel('trips-validations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'validations',
          filter: `park_operator_id=eq.${initialOperator.id}`,
        },
        () => {
          fetchValidations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(validationsChannel)
    }
  }, [initialOperator.id, supabase, fetchValidations])

  const routeInfo = initialOperator.routes && typeof initialOperator.routes === 'object' && !Array.isArray(initialOperator.routes)
    ? initialOperator.routes as { name?: string; origin?: string; destination?: string }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Active Trips</h1>
        <p className="text-gray-600 mt-1">
          {routeInfo && routeInfo.origin && routeInfo.destination
            ? `Route: ${routeInfo.origin} - ${routeInfo.destination}`
            : 'No route assigned'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-center py-6">
            <div className="mb-4 flex justify-center">
              <div className="bg-primary-50 p-3 rounded-lg">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Today&apos;s Passengers</h2>
            <p className="text-4xl font-bold text-primary-600 mb-2">{todayCount}</p>
            <p className="text-sm text-gray-500">Validated tickets today</p>
          </div>
        </Card>

        <Card>
          <div className="py-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Route Information</h2>
            </div>
            {routeInfo ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="text-base font-medium text-gray-900">
                    {routeInfo.origin} → {routeInfo.destination}
                  </p>
                </div>
                {initialOperator.location && (
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-base font-medium text-gray-900">{initialOperator.location}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No route information available</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Validations
          </h2>
          <p className="text-sm text-gray-500 mt-1">Latest ticket validations for this trip</p>
        </div>
        
        {recentValidations && recentValidations.length > 0 ? (
          <div className="space-y-3">
            {recentValidations.map((validation) => {
              const ticket = validation.tickets
              const route = ticket?.routes
              return (
                <div
                  key={validation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">Valid</Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(validation.validated_at)}
                      </span>
                    </div>
                    {route && (
                      <p className="text-sm font-medium text-gray-900">
                        {route.origin} → {route.destination}
                      </p>
                    )}
                    {ticket?.passenger_phone && (
                      <p className="text-xs text-gray-500 mt-1">
                        Phone: {ticket.passenger_phone}
                      </p>
                    )}
                  </div>
                  <Ticket className="h-5 w-5 text-primary-600" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No validations yet today</p>
            <p className="text-sm text-gray-400 mt-1">Start validating tickets to see them here</p>
          </div>
        )}
      </Card>
    </div>
  )
}

