'use client'

import { useState } from 'react'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { CheckCircle, XCircle, Ticket } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ValidatePage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setValidationResult(null)

    try {
      // Validate order number is provided
      if (!orderNumber || orderNumber.trim() === '') {
        setError('Please enter an order number')
        setIsLoading(false)
        return
      }

      // Call validation API (database is source of truth)
      // Credentials: 'include' ensures cookies are sent with the request
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ order_number: orderNumber.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to validate ticket')
        setIsLoading(false)
        return
      }

      if (result.success) {
        setValidationResult({
          success: true,
          ticket: result.ticket,
        })
        setOrderNumber('')
      } else {
        setError('Validation failed')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while validating ticket')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientLayout role="park_operator">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Validate Ticket</h1>
              <p className="text-gray-600 mt-1">Enter order number to validate passenger ticket</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <Card className="w-full max-w-md">
                <form onSubmit={handleValidate} className="space-y-6">
                  <div>
                    <Input
                      label="Order Number"
                      type="text"
                      value={orderNumber}
                      onChange={(e) => {
                        // Allow alphanumeric and dashes for order number format (ORD-YYYYMMDD-XXXXXX)
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                        setOrderNumber(value)
                      }}
                      placeholder="Enter order number (e.g., ORD-20240115-123456)"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Ticket
                  </Button>
                </form>
              </Card>

              {validationResult && validationResult.success && (
                <Card className="w-full max-w-md">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Validation Successful</h2>
                      <Badge variant="success">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valid
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Ticket className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Route</p>
                          <p className="font-medium text-gray-900">
                            {validationResult.ticket.routes.origin} - {validationResult.ticket.routes.destination}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Passenger Phone</p>
                        <p className="font-medium text-gray-900">{validationResult.ticket.passenger_phone}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-medium text-gray-900">{validationResult.ticket.monime_order_number}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Validated At</p>
                        <p className="font-medium text-gray-900">{formatDate(new Date())}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

