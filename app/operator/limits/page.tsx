'use client'

import { useState, useEffect } from 'react'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Calendar, Users, Save, AlertCircle, Play, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface RouteLimit {
  id?: string
  route_id: string
  route_name: string
  date: string
  early_bus_limit: number
  late_bus_limit: number
  is_active: boolean
  sales_stopped: boolean
  early_bus_count?: number
  late_bus_count?: number
}

export default function RouteLimitsPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [routes, setRoutes] = useState<any[]>([])
  const [limits, setLimits] = useState<RouteLimit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get operator and routes via API
      const dataResponse = await fetch('/api/limits/data')
      if (!dataResponse.ok) {
        const errorData = await dataResponse.json()
        setError(errorData.error || 'Failed to load data')
        setIsLoading(false)
        return
      }

      const { operator, routes: routesData } = await dataResponse.json()

      if (!routesData || routesData.length === 0) {
        setRoutes([])
        setLimits([])
        setIsLoading(false)
        return
      }

      setRoutes(routesData)

      // Get existing limits for selected date
      const limitsResponse = await fetch('/api/limits/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      })

      const limitsData = limitsResponse.ok ? await limitsResponse.json() : { limits: [] }

      // Create limits map
      const limitsMap = new Map(
        (limitsData.limits || []).map((limit: any) => [limit.route_id, limit])
      )

      // Get ticket counts via API
      const routeIds = routesData.map((r: any) => r.id)
      const countsResponse = await fetch('/api/limits/ticket-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeIds, date: selectedDate }),
      })

      const countsData = countsResponse.ok ? await countsResponse.json() : { counts: {} }

      const allLimits: RouteLimit[] = routesData.map((route: any) => {
        const existing = limitsMap.get(route.id) as RouteLimit | undefined
        const routeCounts = countsData.counts[route.id] || { early: 0, late: 0 }

        return {
          ...(existing || {
            route_id: route.id,
            route_name: `${route.origin} - ${route.destination}`,
            date: selectedDate,
            early_bus_limit: 0,
            late_bus_limit: 0,
            is_active: true,
            sales_stopped: false,
          }),
          sales_stopped: existing?.sales_stopped ?? false,
          early_bus_count: routeCounts.early,
          late_bus_count: routeCounts.late,
        } as RouteLimit
      })

      setLimits(allLimits)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const updateLimit = (routeId: string, field: keyof RouteLimit, value: any) => {
    setLimits((prev) =>
      prev.map((limit) =>
        limit.route_id === routeId ? { ...limit, [field]: value } : limit
      )
    )
  }

  const toggleSalesStatus = async (routeId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    // Update local state immediately for better UX
    updateLimit(routeId, 'sales_stopped', newStatus)
    
    // Save immediately
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Find the limit for this route
      const routeLimit = limits.find((limit) => limit.route_id === routeId)
      
      if (!routeLimit) {
        setError('Route limit not found')
        updateLimit(routeId, 'sales_stopped', currentStatus)
        setIsSaving(false)
        return
      }

      // Prepare the limit data - ensure all required fields are present
      // Allow saving even with 0 limits (unlimited) if sales_stopped is being set
      const limitToSave = {
        id: routeLimit.id,
        route_id: routeId,
        date: selectedDate,
        sales_stopped: newStatus, // Explicitly set the new status
        early_bus_limit: routeLimit.early_bus_limit !== undefined ? routeLimit.early_bus_limit : 0,
        late_bus_limit: routeLimit.late_bus_limit !== undefined ? routeLimit.late_bus_limit : 0,
        is_active: routeLimit.is_active !== false,
      }

      // Get all other limits to include in the save
      const otherLimits = limits
        .filter((limit) => limit.route_id !== routeId)
        .map((limit) => ({
          ...limit,
          date: selectedDate,
        }))

      // Save via API - include this limit and all others
      const response = await fetch('/api/limits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits: [limitToSave, ...otherLimits] }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Failed to update sales status:', responseData)
        setError(responseData.error || 'Failed to update sales status')
        // Revert the change on error
        updateLimit(routeId, 'sales_stopped', currentStatus)
        setIsSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      // Reload to get updated data
      await loadData()
    } catch (err: any) {
      console.error('Error updating sales status:', err)
      setError(err.message || 'Failed to update sales status')
      // Revert the change on error
      updateLimit(routeId, 'sales_stopped', currentStatus)
    } finally {
      setIsSaving(false)
    }
  }

  const saveLimits = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Prepare limits with date
      const limitsToSave = limits.map((limit) => ({
        ...limit,
        date: selectedDate,
      }))

      // Save via API
      const response = await fetch('/api/limits/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limits: limitsToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save limits')
        setIsSaving(false)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      loadData() // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to save limits')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ClientLayout role="park_operator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Ticket Limits</h1>
          <p className="text-gray-600 mt-1">Set ticket sale limits for routes per day</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Select Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                Limits saved successfully!
              </div>
            )}
          </div>
        </Card>

        {isLoading ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          </Card>
        ) : limits.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No route assigned</p>
              <p className="text-sm text-gray-400">
                Please contact your company administrator to assign a route to your operator account.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {limits.map((limit) => (
              <Card key={limit.route_id}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {limit.route_name}
                      </h3>
                      {limit.early_bus_limit === 0 && limit.late_bus_limit === 0 && (
                        <Badge variant="success" className="text-xs">
                          Unlimited Tickets
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {limit.sales_stopped && (
                        <Badge variant="error">Sales Stopped</Badge>
                      )}
                      <Badge variant={limit.is_active ? 'success' : 'error'}>
                        {limit.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Sales Stop/Start Control */}
                  <div className={`p-5 rounded-lg border-2 ${
                    limit.sales_stopped 
                      ? 'bg-error-50 border-error-300' 
                      : 'bg-success-50 border-success-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {limit.sales_stopped ? (
                            <Square className="h-5 w-5 text-error-600" />
                          ) : (
                            <Play className="h-5 w-5 text-success-600" />
                          )}
                          <h4 className="text-base font-bold text-gray-900">
                            {limit.sales_stopped ? 'Ticket Sales STOPPED' : 'Ticket Sales ACTIVE'}
                          </h4>
                        </div>
                        <p className={`text-sm font-medium ${
                          limit.sales_stopped ? 'text-error-700' : 'text-success-700'
                        }`}>
                          {limit.sales_stopped
                            ? '⚠️ Passengers CANNOT buy tickets for this route today. All ticket purchases will be rejected.'
                            : '✓ Passengers CAN buy tickets for this route. Sales are currently active.'}
                        </p>
                      </div>
                      <Button
                        variant={limit.sales_stopped ? 'success' : 'error'}
                        onClick={() => toggleSalesStatus(limit.route_id, limit.sales_stopped || false)}
                        size="lg"
                        className="min-w-[150px] font-semibold"
                        disabled={isSaving}
                        isLoading={isSaving}
                      >
                        {limit.sales_stopped ? (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Sales
                          </>
                        ) : (
                          <>
                            <Square className="h-5 w-5 mr-2" />
                            Stop Sales
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Early Bus Limit
                        </label>
                        {limit.early_bus_limit === 0 && (
                          <Badge variant="success" className="text-xs">
                            Unlimited
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={limit.early_bus_limit || 0}
                        onChange={(e) =>
                          updateLimit(
                            limit.route_id,
                            'early_bus_limit',
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {limit.early_bus_limit === 0 ? (
                            <span className="font-semibold text-success-600">✓ Unlimited tickets allowed</span>
                          ) : (
                            <span>Max tickets: {limit.early_bus_limit}</span>
                          )}
                        </p>
                        {limit.early_bus_limit > 0 && (
                          <p className={`text-xs font-medium ${
                            (limit.early_bus_count || 0) >= limit.early_bus_limit
                              ? 'text-error-600'
                              : 'text-success-600'
                          }`}>
                            {limit.early_bus_count || 0} / {limit.early_bus_limit}
                          </p>
                        )}
                        {limit.early_bus_limit === 0 && (
                          <p className="text-xs font-medium text-success-600">
                            {limit.early_bus_count || 0} sold
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Late Bus Limit
                        </label>
                        {limit.late_bus_limit === 0 && (
                          <Badge variant="success" className="text-xs">
                            Unlimited
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={limit.late_bus_limit || 0}
                        onChange={(e) =>
                          updateLimit(
                            limit.route_id,
                            'late_bus_limit',
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {limit.late_bus_limit === 0 ? (
                            <span className="font-semibold text-success-600">✓ Unlimited tickets allowed</span>
                          ) : (
                            <span>Max tickets: {limit.late_bus_limit}</span>
                          )}
                        </p>
                        {limit.late_bus_limit > 0 && (
                          <p className={`text-xs font-medium ${
                            (limit.late_bus_count || 0) >= limit.late_bus_limit
                              ? 'text-error-600'
                              : 'text-success-600'
                          }`}>
                            {limit.late_bus_count || 0} / {limit.late_bus_limit}
                          </p>
                        )}
                        {limit.late_bus_limit === 0 && (
                          <p className="text-xs font-medium text-success-600">
                            {limit.late_bus_count || 0} sold
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Card>
              <Button
                onClick={saveLimits}
                isLoading={isSaving}
                className="w-full"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Save All Limits
              </Button>
            </Card>
          </>
        )}
      </div>
    </ClientLayout>
  )
}

