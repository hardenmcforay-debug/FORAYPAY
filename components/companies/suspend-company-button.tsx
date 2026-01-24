'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { Ban, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

interface SuspendCompanyButtonProps {
  companyId: string
  companyName: string
  currentStatus: 'active' | 'suspended'
}

export default function SuspendCompanyButton({ 
  companyId, 
  companyName, 
  currentStatus 
}: SuspendCompanyButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActive = currentStatus === 'active'
  const newStatus = isActive ? 'suspended' : 'active'
  const actionText = isActive ? 'Suspend' : 'Activate'

  const handleStatusChange = async () => {
    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${actionText.toLowerCase()} company`)
      }

      // Close modal and refresh the page
      setIsModalOpen(false)
      router.refresh()
      
      // Also force a hard refresh after a short delay to ensure all data is updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err: any) {
      console.error(`Error ${actionText.toLowerCase()}ing company:`, err)
      setError(err.message || `Failed to ${actionText.toLowerCase()} company. Please try again.`)
      setIsUpdating(false)
    }
  }

  return (
    <>
      {isActive ? (
        <Button
          variant="outline"
          size="sm"
          className="text-error-600 hover:text-error-700 hover:bg-error-50"
          onClick={() => setIsModalOpen(true)}
        >
          <Ban className="w-4 h-4 mr-2" />
          Suspend
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-success-600 hover:text-success-700 hover:bg-success-50"
          onClick={() => setIsModalOpen(true)}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Activate
        </Button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isUpdating && setIsModalOpen(false)}
        title={`${actionText} Company`}
        size="md"
      >
        <div className="space-y-4">
          {isActive ? (
            <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-warning-900">Suspend Company</p>
                <p className="text-sm text-warning-700 mt-1">
                  Suspending this company will:
                </p>
                <ul className="text-sm text-warning-700 mt-2 list-disc list-inside space-y-1">
                  <li>Prevent company admins from accessing the platform</li>
                  <li>Disable all routes and prevent new ticket sales</li>
                  <li>Suspend all park operators automatically</li>
                  <li>Block park operators from validating tickets</li>
                  <li>Preserve all existing data and transactions</li>
                </ul>
                <p className="text-sm text-warning-700 mt-2 font-medium">
                  The company can be reactivated at any time.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-success-50 border border-success-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-success-900">Activate Company</p>
                <p className="text-sm text-success-700 mt-1">
                  Activating this company will restore full access:
                </p>
                <ul className="text-sm text-success-700 mt-2 list-disc list-inside space-y-1">
                  <li>Company admins can access the platform</li>
                  <li>Routes will be enabled for ticket sales</li>
                  <li>All park operators will be automatically activated</li>
                  <li>Park operators can validate tickets</li>
                  <li>All existing data will remain intact</li>
                </ul>
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Company:</span> {companyName}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Current Status:</span>{' '}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                isActive
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {currentStatus}
              </span>
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">New Status:</span>{' '}
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                !isActive
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {newStatus}
              </span>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className={
                isActive
                  ? 'text-error-600 hover:text-error-700 hover:bg-error-50'
                  : 'text-success-600 hover:text-success-700 hover:bg-success-50'
              }
              onClick={handleStatusChange}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {actionText}ing...
                </>
              ) : (
                <>
                  {isActive ? (
                    <Ban className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {actionText} Company
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

