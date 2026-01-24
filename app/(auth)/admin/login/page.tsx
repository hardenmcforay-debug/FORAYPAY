'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { getDashboardPath } from '@/lib/auth-client'
import Image from 'next/image'
import { Shield, Lock, Mail, Ban, AlertTriangle } from 'lucide-react'
import { UserRole } from '@/types/database'
import { getImageUrl } from '@/lib/supabase/storage'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Check if user is already logged in and redirect non-platform admins to regular login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile && profile.role !== 'platform_admin') {
          router.replace('/login')
        }
      }
    }
    checkUser()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
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

      // Get user profile to verify platform admin role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, company_id')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        
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

      // Verify user is a platform admin
      if (userProfile.role !== 'platform_admin') {
        setError(`Access denied. This login page is for platform administrators only. Your account is registered as ${userProfile.role.replace('_', ' ')}. Please use the appropriate login page.`)
        await supabase.auth.signOut()
        return
      }

      const dashboardPath = getDashboardPath(userProfile.role as UserRole)
      console.log('Admin login successful!')
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

      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Picture Space */}
            <div className="hidden lg:block -mt-[450px]">
              <div className="w-full h-full min-h-[300px] max-h-[400px] overflow-hidden bg-white">
                <Image 
                  src={getImageUrl('signin-image.png')} 
                  alt="Admin Sign In" 
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
                  Platform Admin Portal
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Sign in to access the platform administration dashboard
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">Administrator Access Only</span>
                </div>
              </div>

              {/* Login Form */}
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Admin Sign In
                    </h2>
                    <p className="text-primary-100 text-sm mt-1">Enter your administrator credentials</p>
                  </div>

                  <form onSubmit={handleLogin} className="p-8 space-y-6">
                    {error && (
                      <div className={`bg-error-50 border-2 border-error-200 text-error-700 px-4 py-4 rounded-lg text-sm flex items-start gap-3`}>
                        <div className={`w-6 h-6 rounded-full bg-error-200 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className={`text-error-700 text-xs font-bold`}>!</span>
                        </div>
                        <div className="flex-1">{error}</div>
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
                          placeholder="admin@foraypay.com"
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
                      disabled={loading}
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

