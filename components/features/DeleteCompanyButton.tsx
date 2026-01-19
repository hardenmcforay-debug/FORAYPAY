'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Trash2, X, AlertTriangle } from 'lucide-react'

interface DeleteCompanyButtonProps {
  companyId: string
  companyName: string
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

export default function DeleteCompanyButton({ 
  companyId, 
  companyName,
  variant = 'button',
  size = 'sm'
}: DeleteCompanyButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/delete?id=${companyId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete company')
      }

      // Redirect to companies list after successful deletion
      router.push('/platform/companies')
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting company:', err)
      setError(err.message || 'An error occurred while deleting the company.')
      setIsDeleting(false)
    }
  }

  const handleOpen = () => {
    setConfirmText('')
    setError(null)
    setIsOpen(true)
  }

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('')
      setError(null)
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleOpen}
          className="text-error-600 hover:text-error-700 hover:bg-error-50 p-2 rounded-lg transition-colors"
          title="Delete company"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )
    }

    return (
      <Button
        variant="error"
        size={size}
        onClick={handleOpen}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Company
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error-100 mr-3">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Company</h2>
            </div>
            {!isDeleting && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700 text-sm">
              {error}
            </div>
          )}

          {/* Confirmation Input Section */}
          <div className="mb-6">
            <p className="text-center text-sm font-medium text-gray-900 mb-3">
              To confirm deletion, type the company name:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${companyName}" to confirm`}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-error-500 focus:border-transparent transition-colors"
                disabled={isDeleting}
                autoFocus
              />
              {confirmText && confirmText !== companyName && (
                <p className="text-xs text-error-600 mt-2">
                  Company name does not match. Please type exactly: <strong>{companyName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {!isDeleting && (
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="error"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting || confirmText !== companyName}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Company'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}

