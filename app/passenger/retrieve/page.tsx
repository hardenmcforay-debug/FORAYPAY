'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Ticket, Search, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RetrieveTicketPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTicket(null)

    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Please enter a phone number')
      setIsLoading(false)
      return
    }

    try {
      // Get most recent ticket by phone number
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          routes!inner(name, origin, destination, fare_amount)
        `)
        .eq('passenger_phone', phoneNumber.trim())
        .order('created_at', { ascending: false })
        .limit(1)

      if (ticketError || !tickets || tickets.length === 0) {
        setError('No ticket found for this phone number')
        setIsLoading(false)
        return
      }

      setTicket(tickets[0])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'validated':
      case 'used':
        return <Badge variant="success">Used</Badge>
      case 'expired':
        return <Badge variant="error">Expired</Badge>
      case 'cancelled':
        return <Badge variant="error">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/landing')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Landing Page</span>
          </button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Retrieve Your Ticket</h1>
          <p className="text-gray-600 mb-6">Enter your phone number to find your ticket</p>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-600">
              <Ticket className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSearch} className="space-y-6">
            <Input
              label="Phone Number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+232 XXX XXX XXX"
              required
            />

            {error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search Ticket
            </Button>
          </form>
        </Card>

        {ticket && (
          <Card className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Ticket Details</h2>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">
                    {ticket.routes.origin} - {ticket.routes.destination}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Fare Amount</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {formatCurrency(ticket.fare_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">MoniMe Order Number</p>
                  <p className="font-mono font-semibold text-lg text-primary-600">
                    {ticket.monime_order_number || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Passenger Phone</p>
                  <p className="font-medium text-gray-900">{ticket.passenger_phone}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-700">{ticket.monime_transaction_id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Issued At</p>
                  <p className="font-medium text-gray-900">{formatDate(ticket.created_at)}</p>
                </div>

                {ticket.validated_at && (
                  <div>
                    <p className="text-sm text-gray-500">Validated At</p>
                    <p className="font-medium text-gray-900">{formatDate(ticket.validated_at)}</p>
                  </div>
                )}

                {ticket.status === 'pending' && (
                  <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-warning-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-800">Ticket Ready</p>
                        <p className="text-xs text-warning-700 mt-1">
                          Show this OTP code to the park operator for validation
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

