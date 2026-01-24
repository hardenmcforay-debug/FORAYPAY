'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Settings, Edit2, Save, X, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [company, setCompany] = useState<{
    id: string
    name: string
    commission_rate: number
    monime_account_id: string | null
    status: string
  } | null>(null)
  const [userProfile, setUserProfile] = useState<{
    id: string
    email: string
    role: string
    created_at: string
  } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')
          
          // Check if user is company admin and get company_id
          const { data: profile } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', user.id)
            .single()
          
          if (profile?.role !== 'company_admin') {
            router.push('/unauthorized')
            return
          }

          if (!profile.company_id) {
            setError('No company assigned to your account')
            setFetching(false)
            return
          }

          setCompanyId(profile.company_id)

          // Fetch company data
          const { data: companyData, error: fetchError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single()

          if (fetchError) {
            throw fetchError
          }

          if (companyData) {
            setCompany(companyData)
            setFormData({
              name: companyData.name || '',
            })
          }

          // Fetch user profile data
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('id, email, role, created_at')
            .eq('id', user.id)
            .single()

          if (!profileError && profileData) {
            setUserProfile(profileData)
          }
        } else {
          router.push('/login')
          return
        }
      } catch (err: any) {
        console.error('Error fetching company:', err)
        setError(err.message || 'Failed to load company data')
      } finally {
        setFetching(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (!companyId) {
        throw new Error('Company ID not found')
      }

      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update company information')
      }

      setSuccess('Company information updated successfully')
      setIsEditing(false)
      
      // Refresh company data - use a small delay to ensure database has updated
      setTimeout(async () => {
        const { data: companyData, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single()

        if (!fetchError && companyData) {
          setCompany(companyData)
          setFormData({
            name: companyData.name || '',
          })
        }
      }, 100)
      
      // Trigger a router refresh to update server components
      router.refresh()
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError(err.message || 'Failed to update company information')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (company) {
      setFormData({
        name: company.name || '',
      })
    }
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPasswordLoading(true)

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long')
      }

      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSuccess('Password changed successfully. You can now use your new password to sign in.')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsChangingPassword(false)
      
      // Clear error if any
      setError(null)
    } catch (err: any) {
      console.error('Error changing password:', err)
      setError(err.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsChangingPassword(false)
    setError(null)
    setSuccess(null)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setEmailLoading(true)

    try {
      if (!emailData.newEmail.trim()) {
        throw new Error('New email is required')
      }

      if (!emailData.password) {
        throw new Error('Current password is required')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailData.newEmail.trim())) {
        throw new Error('Invalid email format')
      }

      const response = await fetch('/api/users/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail.trim(),
          password: emailData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change email')
      }

      setSuccess(data.message || 'Email updated successfully. Please check your new email for verification.')
      setEmailData({
        newEmail: '',
        password: '',
      })
      setIsChangingEmail(false)
      
      // Refresh auth session to get new email
      await supabase.auth.refreshSession()
      
      // Refresh user profile data
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Update userEmail from auth (source of truth)
        setUserEmail(user.email || '')
        
        // Also update from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, email, role, created_at')
          .eq('id', user.id)
          .single()

        if (!profileError && profileData) {
          setUserProfile(profileData)
          // Use auth email as it's the most up-to-date
          setUserEmail(user.email || profileData.email)
        }
      }
      
      // Trigger router refresh to update server components
      router.refresh()
      
      // Show success message and reload after a short delay to ensure all components update
      setTimeout(() => {
        // Reload the page to ensure all server components get fresh data
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error('Error changing email:', err)
      setError(err.message || 'Failed to change email')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleEmailCancel = () => {
    setEmailData({
      newEmail: '',
      password: '',
    })
    setIsChangingEmail(false)
    setError(null)
    setSuccess(null)
  }

  if (fetching) {
    return (
      <DashboardLayout
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!company) {
    return (
      <DashboardLayout
        role="company_admin"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="text-center py-8">
          <p className="text-gray-600">Company not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="company_admin"
      companyId={companyId || undefined}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your company settings</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Company Information
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Company Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <p className="text-gray-900">{company.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate
                  </label>
                  <p className="text-gray-900">
                    {(company.commission_rate * 100).toFixed(2)}%
                  </p>
                </div>
                {company.monime_account_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MoniMe Account ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">
                      {company.monime_account_id}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      company.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {company.status}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                {!isChangingEmail && userProfile && (
                  <Button onClick={() => setIsChangingEmail(true)} variant="outline" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Change Email
                  </Button>
                )}
              </div>
              {userProfile && (
                <div className="space-y-4">
                  {isChangingEmail ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <Input
                        label="New Email Address"
                        type="email"
                        value={emailData.newEmail}
                        onChange={(e) =>
                          setEmailData({ ...emailData, newEmail: e.target.value })
                        }
                        placeholder="Enter new email address"
                        required
                        disabled={emailLoading}
                      />
                      <Input
                        label="Current Password"
                        type="password"
                        value={emailData.password}
                        onChange={(e) =>
                          setEmailData({ ...emailData, password: e.target.value })
                        }
                        placeholder="Enter your current password"
                        required
                        disabled={emailLoading}
                      />
                      <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={emailLoading}>
                          {emailLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating Email...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Update Email
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleEmailCancel}
                          disabled={emailLoading}
                          variant="outline"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <p className="text-gray-900">{userProfile.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 capitalize">
                      {userProfile.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Created
                    </label>
                    <p className="text-gray-900">
                      {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Change */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                {!isChangingPassword && (
                  <Button onClick={() => setIsChangingPassword(true)} variant="outline">
                    Change Password
                  </Button>
                )}
              </div>
              {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    disabled={passwordLoading}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    disabled={passwordLoading}
                    minLength={6}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    disabled={passwordLoading}
                    minLength={6}
                  />
                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePasswordCancel}
                      disabled={passwordLoading}
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-gray-600">
                  Click &quot;Change Password&quot; to update your account password.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
