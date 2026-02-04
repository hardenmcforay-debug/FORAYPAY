'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { Ticket, CheckCircle2, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl } from '@/lib/supabase/storage'

export default function TicketRetrievePage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [error, setError] = useState('')
  const supabase = createSupabaseClient()

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTicket(null)

    try {
      // Get tickets for this phone number (pending or used)
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          routes(name, origin, destination, fare),
          companies(name)
        `)
        .eq('passenger_phone', phone)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ticketsError) throw ticketsError

      if (!tickets || tickets.length === 0) {
        throw new Error('No tickets found for this phone number')
      }

      // Find the most recent pending ticket, or show the most recent one
      const pendingTicket = tickets.find((t: any) => t.status === 'pending')
      setTicket(pendingTicket || tickets[0])
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden relative">
              <Image 
                src={getImageUrl('logo.png')} 
                alt="ForayPay Logo" 
                width={96} 
                height={96} 
                quality={100}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-3xl font-bold">
              <span className="text-gray-900 dark:text-gray-100">Foray</span>
              <span className="text-success-600">Pay</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Retrieve Your Ticket</h1>
          <p className="text-gray-600">Enter your phone number to retrieve your ticket</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Retrieval</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRetrieve} className="space-y-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+232 XX XXX XXXX"
                required
              />

              {error && (
                <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {ticket && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-success-700 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Ticket Found</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${
                        ticket.status === 'pending' ? 'text-warning-600' : 'text-success-600'
                      }`}>
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-semibold text-gray-900">{ticket.routes?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From:</span>
                      <span className="font-semibold text-gray-900">{ticket.routes?.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-semibold text-gray-900">{ticket.routes?.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fare:</span>
                      <span className="font-semibold text-gray-900">{ticket.routes?.fare} SLL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">OTP Code:</span>
                      <span className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100">{ticket.monime_otp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purchased:</span>
                      <span className="font-semibold text-gray-900">{formatDate(ticket.created_at)}</span>
                    </div>
                    {ticket.used_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Used:</span>
                        <span className="font-semibold text-gray-900">{formatDate(ticket.used_at)}</span>
                      </div>
                    )}
                  </div>

                  {ticket.status === 'pending' && (
                    <div className="bg-warning-50 border border-warning-200 rounded p-3 mt-3">
                      <p className="text-sm text-warning-700">
                        <strong>Important:</strong> Show this OTP code to the park operator when boarding.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Retrieving...' : 'Retrieve Ticket'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

