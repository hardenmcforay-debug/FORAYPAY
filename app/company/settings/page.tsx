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
import { Building2, Mail, Phone, DollarSign, Settings, Loader2, Lock, Eye, EyeOff, Edit2, X } from 'lucide-react'

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  monimeAccountId: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type CompanyForm = z.infer<typeof companySchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function CompanySettingsPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)
  const [companyData, setCompanyData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Password change state
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  // Fetch company data
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoadingCompany(true)
        const response = await fetch('/api/companies/get')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load company information')
        }

        if (result.company) {
          setCompanyData(result.company)
          setValue('name', result.company.name || '')
          setValue('email', result.company.email || '')
          setValue('phone', result.company.phone || '')
          setValue('monimeAccountId', result.company.monime_account_id || '')
        }
      } catch (err: any) {
        console.error('Error fetching company:', err)
        setError(err.message || 'Failed to load company information. Please try again.')
      } finally {
        setIsLoadingCompany(false)
      }
    }

    fetchCompany()
  }, [setValue])

  const onSubmit = async (data: CompanyForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/companies/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone ? data.phone.trim() || null : null,
          monimeAccountId: data.monimeAccountId ? data.monimeAccountId.trim() || null : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update company information')
      }

      setSuccess('Company information updated successfully!')
      
      // Update local state with the updated company data from server response
      if (result.company) {
        setCompanyData({
          ...companyData,
          ...result.company,
          monime_account_id: result.company.monime_account_id || null,
        })
        // Also update form values to match server response
        setValue('name', result.company.name || '')
        setValue('email', result.company.email || '')
        setValue('phone', result.company.phone || '')
        setValue('monimeAccountId', result.company.monime_account_id || '')
      } else {
        // Fallback to local data if server doesn't return updated company
        setCompanyData({
          ...companyData,
          name: data.name,
          email: data.email,
          phone: data.phone,
          monime_account_id: data.monimeAccountId?.trim() || null,
        })
      }

      // Exit edit mode
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError(err.message || 'Failed to update company information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      setPasswordSuccess('Password changed successfully!')
      resetPasswordForm()
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error changing password:', err)
      setPasswordError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoadingCompany) {
    return (
      <ClientLayout role="company_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
            <p className="text-gray-600 mt-1">Manage company configuration</p>
          </div>
          <Card>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading company information...</span>
            </div>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  if (!companyData) {
    return (
      <ClientLayout role="company_admin">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
            <p className="text-gray-600 mt-1">Manage company configuration</p>
          </div>
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Unable to load company information</p>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout role="company_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-1">Manage company configuration</p>
        </div>

        {error && (
          <Card className="bg-error-50 border-error-200">
            <p className="text-error-700">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="bg-success-50 border-success-200">
            <p className="text-success-700">{success}</p>
          </Card>
        )}

        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Company Information
              </h2>
              {!isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {!isEditing ? (
              // View Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Company Name
                  </label>
                  <p className="text-gray-900 mt-1">{companyData.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </label>
                  <p className="text-gray-900 mt-1">{companyData.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </label>
                  <p className="text-gray-900 mt-1">{companyData.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    MoniMe Account ID (Space ID)
                  </label>
                  <p className="text-gray-900 font-mono mt-1">{companyData.monime_account_id || 'Not configured'}</p>
                  {!companyData.monime_account_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Your MoniMe Account ID (Space ID) is required for route synchronization and payment processing. Contact MoniMe support if you need assistance.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Input
                        label="Company Name"
                        {...register('name')}
                        error={errors.name?.message}
                        required
                        placeholder="Enter company name"
                      />
                    </div>

                    <Input
                      label="Email"
                      type="email"
                      {...register('email')}
                      error={errors.email?.message}
                      required
                      placeholder="company@example.com"
                    />

                    <Input
                      label="Phone"
                      type="tel"
                      {...register('phone')}
                      error={errors.phone?.message}
                      placeholder="+232 XX XXX XXXX"
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="MoniMe Account ID (Space ID)"
                        {...register('monimeAccountId')}
                        error={errors.monimeAccountId?.message}
                        placeholder="Enter MoniMe Account ID (Space ID)"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Your MoniMe Account ID (Space ID) is required for route synchronization and payment processing. This is used as the Space ID in MoniMe space-scoped API endpoints. Contact MoniMe support if you need assistance.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false)
                        setError(null)
                        // Reset form to original values
                        setValue('name', companyData.name || '')
                        setValue('email', companyData.email || '')
                        setValue('phone', companyData.phone || '')
                        setValue('monimeAccountId', companyData.monime_account_id || '')
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </Card>

        <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Change Password
                </h2>
              </div>
              
              {passwordError && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-error-700 text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-success-700 text-sm">{passwordSuccess}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...registerPassword('currentPassword')}
                    error={passwordErrors.currentPassword?.message}
                    required
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    {...registerPassword('newPassword')}
                    error={passwordErrors.newPassword?.message}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerPassword('confirmPassword')}
                    error={passwordErrors.confirmPassword?.message}
                    required
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={isChangingPassword}>
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          <Card>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Company Status</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    companyData.is_active 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-error-100 text-error-700'
                  }`}>
                    {companyData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                  <p className="text-gray-900 mt-1">{companyData.commission_rate || 0}%</p>
                  <p className="text-sm text-gray-500 mt-1">Platform commission rate applied to all transactions (set by platform admin)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-gray-900 mt-1">
                    {companyData.created_at ? new Date(companyData.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {companyData.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(companyData.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
      </div>
    </ClientLayout>
  )
}

