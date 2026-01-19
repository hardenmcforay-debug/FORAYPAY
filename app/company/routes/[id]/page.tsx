'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, Route, Loader2 } from 'lucide-react'
import Link from 'next/link'

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  fareAmount: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, 'Fare amount must be greater than 0'),
  isActive: z.boolean(),
})

type RouteForm = z.infer<typeof routeSchema>

export default function EditRoutePage() {
  const router = useRouter()
  const params = useParams()
  const routeId = params.id as string

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(true)
  const [routeData, setRouteData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      isActive: true,
    },
  })

  // Fetch route data
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setIsLoadingRoute(true)
        const response = await fetch(`/api/routes/get?id=${routeId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load route')
        }

        if (result.route) {
          setRouteData(result.route)
          setValue('name', result.route.name)
          setValue('origin', result.route.origin)
          setValue('destination', result.route.destination)
          setValue('fareAmount', result.route.fare_amount.toString())
          setValue('isActive', result.route.is_active)
        }
      } catch (err: any) {
        console.error('Error fetching route:', err)
        setError(err.message || 'Failed to load route. Please try again.')
      } finally {
        setIsLoadingRoute(false)
      }
    }

    if (routeId) {
      fetchRoute()
    }
  }, [routeId, setValue])

  const onSubmit = async (data: RouteForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/routes/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: routeId,
          name: data.name,
          origin: data.origin,
          destination: data.destination,
          fareAmount: parseFloat(data.fareAmount),
          isActive: data.isActive,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update route')
      }

      // Success - redirect to routes page
      router.push('/company/routes')
    } catch (err: any) {
      console.error('Error updating route:', err)
      setError(err.message || 'Failed to update route. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingRoute) {
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Route</h1>
              <p className="text-gray-600 mt-1">Update route information</p>
            </div>
          </div>
          <Card>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading route...</span>
            </div>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  if (!routeData) {
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Route</h1>
              <p className="text-gray-600 mt-1">Update route information</p>
            </div>
          </div>
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Route not found</p>
              <Link href="/company/routes">
                <Button variant="ghost">Back to Routes</Button>
              </Link>
            </div>
          </Card>
        </div>
      </ClientLayout>
    )
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Route</h1>
            <p className="text-gray-600 mt-1">Update route information</p>
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

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isActive')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Route</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive routes will not be available for ticket purchases
                  </p>
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
              Update Route
            </Button>
          </div>
        </form>
      </div>
    </ClientLayout>
  )
}

