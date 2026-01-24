'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { getDashboardPath, getLoginPath } from '@/lib/auth-client'
import Link from 'next/link'
import Image from 'next/image'
import { Shield, Building2, UserCheck, Check, ArrowLeft, Lock, Mail, Ban, AlertTriangle, MessageCircle, Phone } from 'lucide-react'
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
          router.replace('/admin/login')
        }
      }
    }
    checkUser()
  }, [router, supabase])

  // Check for suspension message from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('reason')
    const message = params.get('message')
    
    if (reason === 'suspended' && message) {
      setIsSuspended(true)
      setError(decodeURIComponent(message))
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
      
      // Force a hard navigation to ensure redirect works
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
        {/* Contact Us Section - Bottom Left */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-6 md:left-6 lg:top-[420px] lg:left-6 z-10 max-w-[calc(100vw-1rem)] sm:max-w-none">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-1.5 py-1 sm:px-3 sm:py-2 md:p-4 max-w-[140px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[260px] w-full">
            <h3 className="text-[9px] sm:text-[11px] md:text-sm font-semibold text-gray-900 mb-0.5 sm:mb-2 md:mb-3 flex items-center gap-0.5 sm:gap-1.5 md:gap-2">
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-primary-600 flex-shrink-0" />
              <span className="whitespace-nowrap">Contact Us</span>
            </h3>
            <p className="text-[8px] sm:text-[9px] md:text-xs text-gray-600 mb-0.5 sm:mb-1.5 md:mb-3 leading-[1.15] sm:leading-tight md:leading-relaxed">
              If you experience any issues or have suggestions for improvements, please contact us.
            </p>
            <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
              <a
                href="https://wa.me/23277364962"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-sm text-gray-700 hover:text-success-600 transition-colors group"
              >
                <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200 transition-colors flex-shrink-0">
                  <Phone className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-success-600" />
                </div>
                <span className="font-medium text-[9px] sm:text-[10px] md:text-sm">WhatsApp</span>
              </a>
              <a
                href="mailto:tiktokcforay@gmail.com"
                className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-sm text-gray-700 hover:text-primary-600 transition-colors group"
              >
                <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                  <Mail className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-primary-600" />
                </div>
                <span className="font-medium break-all text-[8px] sm:text-[9px] md:text-sm">tiktokcforay@gmail.com</span>
              </a>
            </div>
          </div>
        </div>

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
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 max-w-xl mx-auto">
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
                      'relative bg-white rounded-lg border-2 p-3 flex flex-col items-center gap-2 transition-all cursor-pointer hover:shadow-md group',
                      isSelected 
                        ? `${colors.border} ${colors.bg} shadow-sm ring-2 ${colors.ring}` 
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <div className={cn('absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-sm', colors.selected)}>
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105',
                      isSelected ? colors.selected : colors.icon
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={cn('font-semibold text-sm mb-0.5', isSelected ? 'text-gray-900' : 'text-gray-900')}>
                        {role.name}
                      </p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
              </div>

              {/* Login Form */}
              <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Sign In
                </h2>
                <p className="text-primary-100 text-sm mt-1">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleLogin} className="p-8 space-y-6">
                {error && (
                  <div className={`${isSuspended ? 'bg-warning-50 border-2 border-warning-300' : 'bg-error-50 border-2 border-error-200'} ${isSuspended ? 'text-warning-900' : 'text-error-700'} px-4 py-4 rounded-lg text-sm flex items-start gap-3`}>
                    <div className={`w-6 h-6 rounded-full ${isSuspended ? 'bg-warning-200' : 'bg-error-200'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {isSuspended ? (
                        <Ban className={`w-4 h-4 ${isSuspended ? 'text-warning-700' : 'text-error-700'}`} />
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

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@company.com"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading || !selectedRole}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
