'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Ticket, Eye, EyeOff, Shield, Building2, UserCheck, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { getValidImageUrl } from '@/lib/utils/image-helpers'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>
type UserRole = 'platform_admin' | 'company_admin' | 'park_operator' | null

const roleOptions = [
  {
    value: 'platform_admin' as const,
    label: 'Platform Admin',
    icon: Shield,
    description: 'Manage platform and all companies',
    color: 'bg-error-600 hover:bg-error-700',
    borderColor: 'border-error-600',
    textColor: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  {
    value: 'company_admin' as const,
    label: 'Company Admin',
    icon: Building2,
    description: 'Manage your transport company',
    color: 'bg-primary-600 hover:bg-primary-700',
    borderColor: 'border-primary-600',
    textColor: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    value: 'park_operator' as const,
    label: 'Park Operator',
    icon: UserCheck,
    description: 'Validate tickets and manage trips',
    color: 'bg-success-600 hover:bg-success-700',
    borderColor: 'border-success-600',
    textColor: 'text-success-600',
    bgColor: 'bg-success-50',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [useImgTag, setUseImgTag] = useState(false)
  
  // Check Supabase configuration on mount
  const [configError, setConfigError] = useState<string | null>(null)

  // Fetch logo from Supabase storage
  useEffect(() => {
    // Try nav-logo.png first, then fallback to logo.png
    let fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/nav-logo.png', true)
    if (!fetchedUrl) {
      fetchedUrl = getValidImageUrl(supabase, 'landing-images', 'logo/logo.png', true)
    }
    if (fetchedUrl) {
      setLogoUrl(fetchedUrl)
    } else {
      setLogoUrl('/logo.png')
    }
  }, [supabase])

  const logoPath = logoUrl || '/logo.png'
  
  useEffect(() => {
    // Client-side check (env vars are available in browser for NEXT_PUBLIC_*)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      setConfigError('Supabase is not configured. Please check your .env.local file and restart the server.')
    } else if (!url.startsWith('http')) {
      setConfigError('Invalid Supabase URL. It must start with http:// or https://')
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    if (!selectedRole) {
      setError('Please select your role')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setError('Supabase is not configured. Please check your environment variables.')
        setIsLoading(false)
        return
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // Provide more specific error messages
        if (authError.message?.includes('fetch') || authError.message?.includes('network')) {
          setError('Network error: Cannot connect to Supabase. Please check your internet connection and Supabase URL.')
        } else if (authError.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (authError.message?.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.')
        } else {
          setError(authError.message || 'Invalid email or password')
        }
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setError('Authentication failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Get user role from users table (must match auth.users id)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, full_name, is_active, company_id')
        .eq('id', authData.user.id)
        .single()

      if (userError || !userData) {
        console.error('User lookup error:', userError)
        console.error('Auth user ID:', authData.user.id)
        console.error('Auth user email:', authData.user.email)
        
        // Try to find user by email to see if it exists with different ID
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', authData.user.email)
          .single()
        
        if (userByEmail) {
          setError(
            `User exists but ID mismatch! ` +
            `Auth ID: ${authData.user.id.slice(0, 8)}... ` +
            `Users table ID: ${userByEmail.id.slice(0, 8)}... ` +
            `Please update the users table record to use the same UUID as Supabase Auth. ` +
            `See database/verify-user-setup.sql for help.`
          )
        } else if (userError?.message?.includes('fetch') || userError?.message?.includes('network')) {
          setError('Network error: Cannot connect to database. Please check your connection.')
        } else if (userError?.code === 'PGRST116' || userError?.message?.includes('No rows')) {
          setError(
            `User account not found in users table. ` +
            `Your Auth ID is: ${authData.user.id}. ` +
            `Please create a record in the users table with this exact UUID. ` +
            `See database/create-user-helper.sql for instructions.`
          )
        } else {
          setError(`User account not found: ${userError?.message || 'Unknown error'}`)
        }
        setIsLoading(false)
        return
      }

      // Check if user is active
      if (!userData.is_active) {
        setError('Your account has been deactivated. Please contact administrator.')
        setIsLoading(false)
        return
      }

      // Verify role matches selected role
      if (userData.role !== selectedRole) {
        const correctRoleLabel = roleOptions.find(r => r.value === userData.role)?.label || userData.role
        setError(`This account is for ${correctRoleLabel}. Please select "${correctRoleLabel}" and try again.`)
        setIsLoading(false)
        return
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)

      // Redirect based on role
      if (userData.role === 'platform_admin') {
        router.push('/platform/dashboard')
        router.refresh()
      } else if (userData.role === 'company_admin') {
        router.push('/company/dashboard')
        router.refresh()
      } else if (userData.role === 'park_operator') {
        router.push('/operator/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Handle network/fetch errors
      if (err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Network error: Cannot connect to server. Please check:\n1. Your internet connection\n2. Supabase URL and keys in .env.local\n3. That Supabase project is active')
      } else if (err.message?.includes('NetworkError') || err.message?.includes('Network request failed')) {
        setError('Network request failed. Please check your Supabase configuration and try again.')
      } else {
        setError(err.message || 'An error occurred. Please try again.')
      }
      setIsLoading(false)
    }
  }

  const selectedRoleOption = selectedRole ? roleOptions.find(r => r.value === selectedRole) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <Card className="w-full max-w-md">
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

        <div className="text-center mb-6 -mt-8">
          <div className="flex justify-center mb-4">
            {!logoError && logoPath ? (
              useImgTag ? (
                <img
                  src={logoPath}
                  alt="Foraypay Logo"
                  className="w-16 h-16 object-contain"
                  onError={() => {
                    setLogoError(true)
                  }}
                />
              ) : (
                <div className="relative w-16 h-16">
                  <Image
                    src={logoPath}
                    alt="Foraypay Logo"
                    fill
                    className="object-contain"
                    onError={() => {
                      setUseImgTag(true)
                    }}
                    priority
                    unoptimized={true}
                    sizes="64px"
                  />
                </div>
              )
            ) : (
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full",
                selectedRoleOption?.color || "bg-primary-600"
              )}>
                {selectedRoleOption ? (
                  <selectedRoleOption.icon className="h-8 w-8 text-white" />
                ) : (
                  <Ticket className="h-8 w-8 text-white" />
                )}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary-600">Foray</span>
            <span className="text-success-600">pay</span>
          </h1>
          <p className="text-gray-600">One Tap. One Ticket.</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Your Role <span className="text-error-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3">
            {roleOptions.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.value
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role.value)
                    setError(null)
                  }}
                  className={cn(
                    "flex items-start p-4 border-2 rounded-lg transition-all text-left",
                    isSelected
                      ? `${role.borderColor} ${role.bgColor} shadow-sm`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg mr-3 flex-shrink-0",
                    isSelected ? role.color : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected ? "text-white" : "text-gray-600"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className={cn(
                      "font-semibold mb-1",
                      isSelected ? role.textColor : "text-gray-900"
                    )}>
                      {role.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {role.description}
                    </div>
                  </div>
                  {isSelected && (
                    <div className={cn("ml-2", role.textColor)}>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {configError && (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-800 text-sm">
              <p className="font-semibold mb-2">⚠️ Configuration Error</p>
              <p className="mb-2">{configError}</p>
              <p className="text-xs mt-2">
                See <code className="bg-warning-100 px-1 rounded">TROUBLESHOOTING-FETCH-ERROR.md</code> for help.
              </p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
            disabled={!selectedRole}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={errors.password?.message}
              required
              className="pr-10"
              disabled={!selectedRole}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none transition-colors disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={!selectedRole}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full",
              selectedRoleOption?.color || "bg-primary-600 hover:bg-primary-700"
            )}
            isLoading={isLoading}
            disabled={!selectedRole}
          >
            {selectedRoleOption ? `Sign In as ${selectedRoleOption.label}` : 'Select Role to Continue'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

