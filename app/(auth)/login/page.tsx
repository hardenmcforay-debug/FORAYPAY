'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { getDashboardPath, getLoginPath } from '@/lib/auth-client'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Building2, UserCheck, Check, ArrowLeft, Lock, Mail, Ban, AlertTriangle } from 'lucide-react'
import { UserRole } from '@/types/database'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/supabase/storage'

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspendedCompanyName, setSuspendedCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Check if user is already logged in and redirect platform admins to admin login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'platform_admin') {
          // Redirect to admin login page
          router.push('/admin/login')
        }
      }
    }
    checkUser()
  }, [router, supabase])

  // Check for error messages from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('reason')
    const message = params.get('message')
    const error = params.get('error')
    
    if (reason === 'suspended' && message) {
      setIsSuspended(true)
      setError(decodeURIComponent(message))
      // Clear URL parameters
      router.replace('/login', { scroll: false })
    } else if (error === 'auth_failed') {
      setError('Authentication failed. This may be due to missing server configuration. Please contact the administrator or try again in a few moments.')
      // Clear URL parameters
      router.replace('/login', { scroll: false })
    }
  }, [router])

  const roles = [
    {
      id: 'company_admin' as UserRole,
      name: 'Company Admin',
      description: 'Company management',
      icon: Building2,
      color: 'success'
    },
    {
      id: 'park_operator' as UserRole,
      name: 'Park Operator',
      description: 'Ticket validation',
      icon: UserCheck,
      color: 'warning'
    }
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSuspended(false)
    setSuspendedCompanyName(null)

    if (!selectedRole) {
      setError('Please select your role before signing in')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No user data returned')
      }

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get user profile to determine role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, company_id')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        console.error('User ID:', authData.user.id)
        console.error('User Email:', authData.user.email)
        
        // Check if it's a "not found" error (PGRST116)
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows')) {
          setError(`User profile not found. Your account exists but needs to be set up. Please contact administrator. User ID: ${authData.user.id.slice(0, 8)}...`)
        } else {
          setError(`Error loading profile: ${profileError.message}`)
        }
        return
      }

      if (!userProfile) {
        setError('User profile not found. Please contact administrator to set up your account.')
        return
      }

      if (!userProfile.role) {
        setError('User role not assigned. Please contact administrator.')
        return
      }

      // If user is platform admin, redirect to admin login page
      if (userProfile.role === 'platform_admin') {
        router.push('/admin/login')
        return
      }

      // Verify selected role matches actual role
      if (userProfile.role !== selectedRole) {
        setError(`Role mismatch. Your account is registered as ${userProfile.role.replace('_', ' ')}. Please select the correct role.`)
        return
      }

      // Check if company is suspended (for company_admin and park_operator)
      let companyId = userProfile.company_id
      
      // For park operators, get company_id from park_operators table if not in users table
      if (userProfile.role === 'park_operator' && !companyId) {
        const { data: operator } = await supabase
          .from('park_operators')
          .select('company_id, status, name')
          .eq('user_id', authData.user.id)
          .single()

        if (operator) {
          // Check if operator is suspended
          if (operator.status === 'suspended') {
            setIsSuspended(true)
            setError(`Your operator account "${operator.name || 'has been'}" has been suspended. You cannot access the platform at this time. Please contact your company administrator for assistance.`)
            await supabase.auth.signOut()
            return
          }
          companyId = operator.company_id
        }
      }

      // Check if company is suspended
      if ((userProfile.role === 'company_admin' || userProfile.role === 'park_operator') && companyId) {
        const { data: company } = await supabase
          .from('companies')
          .select('status, name')
          .eq('id', companyId)
          .single()

        if (company && company.status === 'suspended') {
          setIsSuspended(true)
          setSuspendedCompanyName(company.name)
          setError(`Your company account "${company.name}" has been suspended. You cannot access the platform at this time. Please contact the platform administrator for assistance.`)
          // Sign out the user since they shouldn't be logged in
          await supabase.auth.signOut()
          return
        }
      }

      const dashboardPath = getDashboardPath(userProfile.role as any)
      console.log('Login successful!')
      console.log('User ID:', authData.user.id)
      console.log('Role:', userProfile.role)
      console.log('Redirecting to:', dashboardPath)
      
      // Verify session is established - check multiple times
      let sessionValid = false
      for (let i = 0; i < 5; i++) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (session && !sessionError && session.user) {
          sessionValid = true
          console.log(`Session validated on attempt ${i + 1}`)
          break
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
      }
      
      if (!sessionValid) {
        setError('Session could not be established. Please try logging in again.')
        console.error('Session validation failed after login')
        return
      }
      
      // Use window.location.href for a full page reload to ensure cookies are sent
      // This ensures the server component can read the authentication cookies
      window.location.href = dashboardPath
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4 sm:px-6 py-8 sm:py-12 relative">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Picture Space */}
            <div className="hidden lg:block -mt-[450px]">
              <div className="w-full h-full min-h-[300px] max-h-[400px] overflow-hidden bg-white">
                <Image 
                  src={getImageUrl('signin-image.png')} 
                  alt="Sign In" 
                  width={600} 
                  height={800} 
                  quality={100}
                  priority
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Right Side - Logo and Form */}
            <div>
              {/* Logo and Title */}
              <div className="text-center mb-10">
                <div className="grid grid-cols-1 items-center justify-items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden relative">
                    <Image 
                      src={getImageUrl('logo.png')} 
                      alt="ForayPay Logo" 
                      width={128} 
                      height={128} 
                      quality={100}
                      priority
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="text-4xl font-bold">
                    <span className="text-primary-600">Foray</span>
                    <span className="text-success-600">Pay</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
                  Welcome Back
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              {/* Role Selection */}
              <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3 text-center">
              Select your role
            </label>
            <div className="flex flex-row justify-center items-center gap-2 sm:gap-3 lg:gap-2 max-w-xl mx-auto">
              {roles.map((role) => {
                const Icon = role.icon
                const isSelected = selectedRole === role.id
                const colorClasses = {
                  primary: {
                    bg: 'bg-primary-50',
                    border: 'border-primary-500',
                    icon: 'bg-primary-100 text-primary-600',
                    selected: 'bg-primary-600 text-white',
                    ring: 'ring-primary-200'
                  },
                  success: {
                    bg: 'bg-success-50',
                    border: 'border-success-500',
                    icon: 'bg-success-100 text-success-600',
                    selected: 'bg-success-600 text-white',
                    ring: 'ring-success-200'
                  },
                  warning: {
                    bg: 'bg-warning-50',
                    border: 'border-warning-500',
                    icon: 'bg-warning-100 text-warning-600',
                    selected: 'bg-warning-600 text-white',
                    ring: 'ring-warning-200'
                  }
                }
                const colors = colorClasses[role.color as keyof typeof colorClasses]

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id)
                      setError('')
                      setIsSuspended(false)
                      setSuspendedCompanyName(null)
                    }}
                    className={cn(
                      'relative bg-white rounded-lg border-2 p-2 sm:p-3 lg:p-2.5 flex flex-col items-center gap-1.5 sm:gap-2 lg:gap-1.5 transition-all cursor-pointer hover:shadow-md group flex-1 max-w-[140px] sm:max-w-none lg:max-w-[160px]',
                      isSelected 
                        ? `${colors.border} ${colors.bg} shadow-sm ring-2 ${colors.ring}` 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <div className={cn('absolute top-1.5 right-1.5 sm:top-2 sm:right-2 lg:top-1.5 lg:right-1.5 w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center shadow-sm', colors.selected)}>
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-2.5 lg:h-2.5" />
                      </div>
                    )}
                    <div className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                      isSelected ? colors.selected : colors.icon
                    )}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" />
                    </div>
                    <div className="text-center">
                      <p className={cn('font-semibold text-xs sm:text-sm lg:text-xs mb-0.5', isSelected ? 'text-gray-900' : 'text-gray-900')}>
                        {role.name}
                      </p>
                      <p className="text-[10px] sm:text-xs lg:text-[10px] text-gray-500">{role.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
              </div>

              {/* Login Form */}
              <div className="max-w-sm mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sign In
                </h2>
                <p className="text-primary-100 text-xs sm:text-sm mt-0.5 sm:mt-1">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} className="p-5 sm:p-6 lg:p-5 space-y-4 sm:space-y-5">
                {error && (
                  <div className={`${isSuspended ? 'bg-warning-50 border-2 border-warning-300' : 'bg-error-50 border-2 border-error-200'} ${isSuspended ? 'text-warning-900' : 'text-error-700'} px-3 sm:px-4 py-3 sm:py-4 rounded-lg text-xs sm:text-sm flex items-start gap-2 sm:gap-3`}>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${isSuspended ? 'bg-warning-200' : 'bg-error-200'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {isSuspended ? (
                        <Ban className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSuspended ? 'text-warning-700' : 'text-error-700'}`} />
                      ) : (
                        <span className={`${isSuspended ? 'text-warning-700' : 'text-error-700'} text-xs font-bold`}>!</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {isSuspended ? (
                        <div>
                          <p className="font-semibold mb-1 flex items-center gap-2">
                            <Ban className="w-4 h-4" />
                            Account Suspended
                          </p>
                          <p className="mb-2">{error}</p>
                          <p className="text-xs mt-2 opacity-90">
                            If you believe this is an error, please contact the platform administrator immediately.
                          </p>
                        </div>
                      ) : (
                        <div>{error}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@company.com"
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full text-sm sm:text-base"
                  size="sm"
                  disabled={loading || !selectedRole}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {!selectedRole && (
                  <p className="text-xs text-center text-gray-500">
                    Please select your role above to continue
                  </p>
                )}
              </form>
            </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
