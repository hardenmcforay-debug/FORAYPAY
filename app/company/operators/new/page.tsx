'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ClientLayout from '@/components/layout/ClientLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ArrowLeft, UserCheck, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const operatorSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  location: z.string().optional(),
  routeId: z.string().optional(),
})

type OperatorForm = z.infer<typeof operatorSchema>

interface Route {
  id: string
  name: string
  origin: string
  destination: string
}

export default function NewOperatorPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await fetch('/api/routes/list')
        const result = await response.json()
        if (response.ok && result.routes) {
          setRoutes(result.routes)
        }
      } catch (err) {
        console.error('Error fetching routes:', err)
      } finally {
        setLoadingRoutes(false)
      }
    }
    fetchRoutes()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OperatorForm>({
    resolver: zodResolver(operatorSchema),
  })

  const onSubmit = async (data: OperatorForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/operators/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          location: data.location || null,
          routeId: data.routeId || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create operator')
      }

      // Success - redirect to operators page
      router.push('/company/operators')
    } catch (err: any) {
      console.error('Error creating operator:', err)
      setError(err.message || 'Failed to create operator. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ClientLayout role="company_admin">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/company/operators">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Park Operator</h1>
            <p className="text-gray-600 mt-1">Add a new park operator for your company</p>
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
                <UserCheck className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Operator Account Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  {...register('fullName')}
                  error={errors.fullName?.message}
                  required
                  placeholder="Enter operator full name"
                />

                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  required
                  placeholder="operator@example.com"
                />

                <div className="md:col-span-2">
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      error={errors.password?.message}
                      required
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    This will be the login credentials for the park operator
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Route Assignment (Optional)
                  </label>
                  {loadingRoutes ? (
                    <p className="text-sm text-gray-500">Loading routes...</p>
                  ) : (
                    <select
                      {...register('routeId')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">No route assigned</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.origin} - {route.destination} ({route.name})
                        </option>
                      ))}
                    </select>
                  )}
                  {routes.length === 0 && !loadingRoutes && (
                    <p className="text-sm text-gray-500 mt-1">
                      No routes available. Create a route first to assign it to the operator.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Location (Optional)"
                    {...register('location')}
                    error={errors.location?.message}
                    placeholder="e.g., Freetown Central Park"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/company/operators">
              <Button variant="ghost" type="button" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Create Operator
            </Button>
          </div>
        </form>
      </div>
    </ClientLayout>
  )
}

