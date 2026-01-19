'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, Route } from 'lucide-react'
import Link from 'next/link'

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  fareAmount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Fare amount must be greater than 0'),
})

type RouteForm = z.infer<typeof routeSchema>

export default function NewRoutePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
  })

  const onSubmit = async (data: RouteForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/routes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          origin: data.origin,
          destination: data.destination,
          fareAmount: parseFloat(data.fareAmount),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create route')
      }

      // Success - redirect to routes page
      router.push('/company/routes')
    } catch (err: any) {
      console.error('Error creating route:', err)
      setError(err.message || 'Failed to create route. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientLayout role="company_admin">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/company/routes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Route</h1>
            <p className="text-gray-600 mt-1">Add a new transport route for your company</p>
          </div>
        </div>

        {error && (
          <Card className="bg-error-50 border-error-200">
            <p className="text-error-700">{error}</p>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-gray-200">
                <Route className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Route Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Route Name"
                  {...register('name')}
                  error={errors.name?.message}
                  required
                  placeholder="e.g., Freetown-Bo Express"
                />

                <Input
                  label="Fare Amount (SLL)"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('fareAmount')}
                  error={errors.fareAmount?.message}
                  required
                  placeholder="15000"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Origin"
                    {...register('origin')}
                    error={errors.origin?.message}
                    required
                    placeholder="e.g., Freetown"
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Destination"
                    {...register('destination')}
                    error={errors.destination?.message}
                    required
                    placeholder="e.g., Bo"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/company/routes">
              <Button variant="ghost" type="button" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Create Route
            </Button>
          </div>
        </form>
      </div>
    </ClientLayout>
  )
}

