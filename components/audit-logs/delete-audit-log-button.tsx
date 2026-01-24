'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteAuditLogButtonProps {
  logId: string
  action: string
}

export default function DeleteAuditLogButton({ 
  logId, 
  action 
}: DeleteAuditLogButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      console.log('Attempting to delete audit log:', logId)
      const response = await fetch(`/api/audit-logs/${logId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Delete response status:', response.status)
      console.log('Delete response headers:', Object.fromEntries(response.headers.entries()))

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log('Delete response data:', data)

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete audit log'
        console.error('Delete failed:', errorMsg, data)
        throw new Error(errorMsg)
      }

      // Close modal and refresh the page
      setIsModalOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting audit log:', err)
      setError(err.message || 'Failed to delete audit log. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-error-600 hover:text-error-700 hover:bg-error-50"
        onClick={() => setIsModalOpen(true)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isDeleting && setIsModalOpen(false)}
        title="Delete Audit Log"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-warning-900">Delete Audit Log</p>
              <p className="text-sm text-warning-700 mt-1">
                Are you sure you want to delete this audit log? This action cannot be undone.
              </p>
              <p className="text-sm text-warning-700 mt-2">
                <span className="font-medium">Action:</span> {action}
              </p>
            </div>
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Log
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

