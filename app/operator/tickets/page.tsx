'use client'

import { useState, useEffect, useCallback } from 'react'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Ticket, Plus, Copy, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GeneratedTicket {
  id: string
  order_number: string
  route_name: string
  fare_amount: number
  status: string
  expires_at: string
}

export default function OperatorTicketsPage() {
  const [quantity, setQuantity] = useState('10')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicket[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string>('')
  const [routes, setRoutes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const supabase = createClient()

  // Fetch operator's routes
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const response = await fetch('/api/operators/routes', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setRoutes(data.routes || [])
          // Auto-select first route if available
          if (data.routes && data.routes.length > 0 && !selectedRoute) {
            setSelectedRoute(data.routes[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching routes:', err)
      }
    }

    fetchRoutes()
  }, [supabase, selectedRoute])

  // Fetch existing pre-generated tickets
  const fetchTickets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/tickets/pre-generated', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedTickets(data.tickets || [])
      }
    } catch (err) {
      console.error('Error fetching tickets:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Set up real-time subscription for tickets
  useEffect(() => {
    let ticketsChannel: any = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get operator's company_id for filtering
      const response = await fetch('/api/operators/routes', {
        credentials: 'include',
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      const companyId = data.company_id
      
      if (!companyId) return

      // Subscribe to tickets changes
      ticketsChannel = supabase
        .channel('tickets-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `company_id=eq.${companyId}`,
          },
          () => {
            fetchTickets()
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (ticketsChannel) {
        supabase.removeChannel(ticketsChannel)
      }
    }
  }, [supabase, fetchTickets])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      const qty = parseInt(quantity)
      if (!qty || qty < 1 || qty > 100) {
        setError('Quantity must be between 1 and 100')
        setIsGenerating(false)
        return
      }

      if (!selectedRoute) {
        setError('Please select a route')
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/tickets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quantity: qty,
          route_id: selectedRoute,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to generate tickets')
        setIsGenerating(false)
        return
      }

      setSuccess(`Successfully generated ${qty} ticket(s)`)
      setQuantity('10')
      
      // Refresh tickets list
      const ticketsResponse = await fetch('/api/tickets/pre-generated', {
        credentials: 'include',
      })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setGeneratedTickets(ticketsData.tickets || [])
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopiedOrderNumber(orderNumber)
      setTimeout(() => setCopiedOrderNumber(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return
    }

    setDeletingTicketId(ticketId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/tickets/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ticket_id: ticketId }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to delete ticket')
        setDeletingTicketId(null)
        return
      }

      setSuccess('Ticket deleted successfully')
      
      // Refresh tickets list
      const ticketsResponse = await fetch('/api/tickets/pre-generated', {
        credentials: 'include',
      })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setGeneratedTickets(ticketsData.tickets || [])
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting ticket')
    } finally {
      setDeletingTicketId(null)
    }
  }

  const exportTickets = () => {
    const csv = [
      ['Order Number', 'Route', 'Fare Amount', 'Status', 'Expires At'].join(','),
      ...generatedTickets.map(ticket => [
        ticket.order_number,
        ticket.route_name,
        ticket.fare_amount,
        ticket.status,
        ticket.expires_at,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const pendingTickets = generatedTickets.filter(t => t.status === 'pending' && t.order_number.startsWith('ORD-'))
  const usedTickets = generatedTickets.filter(t => t.status === 'used')

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId)
      } else {
        newSet.add(ticketId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const pendingTicketIds = pendingTickets.map(t => t.id)
    if (selectedTickets.size === pendingTicketIds.length) {
      // Deselect all
      setSelectedTickets(new Set())
    } else {
      // Select all pending tickets
      setSelectedTickets(new Set(pendingTicketIds))
    }
  }

  const handleBulkDelete = async () => {
    const ticketIds = Array.from(selectedTickets)
    if (ticketIds.length === 0) {
      setError('Please select at least one ticket to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${ticketIds.length} ticket(s)? This action cannot be undone.`)) {
      return
    }

    setIsBulkDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      // Delete tickets one by one (or we could update API to accept array)
      const deletePromises = ticketIds.map(ticketId =>
        fetch('/api/tickets/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ ticket_id: ticketId }),
        })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletions: string[] = []

      for (let i = 0; i < results.length; i++) {
        if (!results[i].ok) {
          const result = await results[i].json()
          failedDeletions.push(result.error || 'Unknown error')
        }
      }

      if (failedDeletions.length > 0) {
        setError(`Failed to delete ${failedDeletions.length} ticket(s): ${failedDeletions[0]}`)
      } else {
        setSuccess(`Successfully deleted ${ticketIds.length} ticket(s)`)
        setSelectedTickets(new Set())
      }

      // Refresh tickets list
      const ticketsResponse = await fetch('/api/tickets/pre-generated', {
        credentials: 'include',
      })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setGeneratedTickets(ticketsData.tickets || [])
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting tickets')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  return (
    <ClientLayout role="park_operator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Tickets</h1>
          <p className="text-gray-600 mt-1">
            Create multiple tickets with dedicated order numbers for offline USSD payments
          </p>
        </div>

        {/* Generate Tickets Form */}
        <Card>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-2">
                  Route
                </label>
                <select
                  id="route"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.origin} - {route.destination} ({formatCurrency(route.fare_amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Quantity (1-100)"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                {success}
              </div>
            )}

            <Button type="submit" isLoading={isGenerating} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Generate Tickets
            </Button>
          </form>
        </Card>

        {/* Generated Tickets List */}
        {generatedTickets.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Generated Tickets</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {pendingTickets.length} pending, {usedTickets.length} used
                  {selectedTickets.size > 0 && ` • ${selectedTickets.size} selected`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTickets.size > 0 && (
                  <Button 
                    variant="error" 
                    onClick={handleBulkDelete}
                    isLoading={isBulkDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedTickets.size})
                  </Button>
                )}
                <Button variant="outline" onClick={exportTickets}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={pendingTickets.length > 0 && selectedTickets.size === pendingTickets.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        title="Select all pending tickets"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fare
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {ticket.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedTickets.has(ticket.id)}
                            onChange={() => handleSelectTicket(ticket.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            title="Select ticket for deletion"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900">
                            {ticket.order_number}
                          </code>
                          <button
                            onClick={() => copyToClipboard(ticket.order_number)}
                            className="text-gray-400 hover:text-primary-600 transition-colors"
                            title="Copy order number"
                          >
                            {copiedOrderNumber === ticket.order_number ? (
                              <CheckCircle className="h-4 w-4 text-success-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {ticket.route_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(ticket.fare_amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            ticket.status === 'used'
                              ? 'success'
                              : ticket.status === 'expired'
                              ? 'error'
                              : 'default'
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(new Date(ticket.expires_at))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {ticket.status === 'pending' && (
                            <>
                              <span className="text-gray-400">Waiting for payment</span>
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                disabled={deletingTicketId === ticket.id}
                                className="text-error-600 hover:text-error-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Delete ticket"
                              >
                                {deletingTicketId === ticket.id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-error-600 border-t-transparent rounded-full" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}
                          {ticket.status === 'used' && (
                            <span className="text-success-600">Validated</span>
                          )}
                          {ticket.status === 'expired' && (
                            <span className="text-gray-400">Expired</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {generatedTickets.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Generated</h3>
              <p className="text-gray-500 mb-6">
                Generate tickets with dedicated order numbers for offline USSD payments
              </p>
            </div>
          </Card>
        )}
      </div>
    </ClientLayout>
  )
}

