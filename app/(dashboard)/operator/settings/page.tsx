'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Settings, Edit2, Save, X, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function OperatorSettingsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [operator, setOperator] = useState<{
    id: string
    name: string
    phone: string
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
    phone: '',
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
          
          // Check if user is park operator and get company_id
          const { data: profile } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', user.id)
            .single()
          
          if (profile?.role !== 'park_operator') {
            router.push('/unauthorized')
            return
          }

          if (!profile.company_id) {
            setError('No company assigned to your account')
            setFetching(false)
            return
          }

          // Get company_id from profile or operator table
          let companyIdValue = profile.company_id

          // Fetch operator data
          const { data: operatorData, error: operatorError } = await supabase
            .from('park_operators')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (operatorError) {
            // If operator profile doesn't exist, that's okay - we'll show a message
            if (operatorError.code === 'PGRST116') {
              setError('Operator profile not found. Please contact your company admin to set up your operator profile.')
              setFetching(false)
              return
            }
            throw operatorError
          }

          if (operatorData) {
            // Use company_id from operator if not in profile
            if (!companyIdValue) {
              companyIdValue = operatorData.company_id
            }

            // Check if company is suspended
            if (companyIdValue) {
              const { data: company } = await supabase
                .from('companies')
                .select('status, name')
                .eq('id', companyIdValue)
                .single()

              if (company && company.status === 'suspended') {
                setError(`Your company account "${company.name}" has been suspended. You cannot access the platform at this time. Please contact the platform administrator for assistance.`)
                await supabase.auth.signOut()
                setTimeout(() => {
                  router.push('/login')
                }, 2000)
                setFetching(false)
                return
              }
            }

            // Check if operator is suspended
            if (operatorData.status === 'suspended') {
              setError('Your operator account has been suspended. You cannot access the platform at this time. Please contact your company administrator for assistance.')
              await supabase.auth.signOut()
              setTimeout(() => {
                router.push('/login')
              }, 2000)
              setFetching(false)
              return
            }
            setCompanyId(companyIdValue || operatorData.company_id)
            setOperator(operatorData)
            setFormData({
              name: operatorData.name || '',
              phone: operatorData.phone || '',
            })
          } else {
            setError('Operator profile not found. Please contact your company admin to set up your operator profile.')
            setFetching(false)
            return
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
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load data')
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
      const response = await fetch('/api/operators/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess('Profile updated successfully')
      setIsEditing(false)
      
      // Refresh operator data
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: operatorData, error: operatorError } = await supabase
          .from('park_operators')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!operatorError && operatorData) {
          setOperator(operatorData)
        }
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (operator) {
      setFormData({
        name: operator.name || '',
        phone: operator.phone || '',
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

      setSuccess('Password changed successfully')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsChangingPassword(false)
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
      
      // Refresh user profile data
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, email, role, created_at')
          .eq('id', user.id)
          .single()

        if (!profileError && profileData) {
          setUserProfile(profileData)
          setUserEmail(profileData.email)
        }
      }
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
        role="park_operator"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!operator) {
    return (
      <DashboardLayout
        role="park_operator"
        companyId={companyId || undefined}
        userEmail={userEmail}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings</p>
          </div>
          
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              {userProfile && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900">{userProfile.email}</p>
                  </div>
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
                  <h3 className="text-lg font-semibold text-gray-900">Change Email</h3>
                  {!isChangingEmail && userProfile && (
                    <Button onClick={() => setIsChangingEmail(true)} variant="outline" size="sm">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Change Email
                    </Button>
                  )}
                </div>
                {isChangingEmail && userProfile && (
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

  return (
    <DashboardLayout
      role="park_operator"
      companyId={companyId || undefined}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings</p>
          </div>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Profile Information
              </CardTitle>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    Name
                  </label>
                  <p className="text-gray-900">{operator.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{operator.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      operator.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {operator.status}
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

