'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteCompanyButtonProps {
  companyId: string
  companyName: string
}

export default function DeleteCompanyButton({ companyId, companyName }: DeleteCompanyButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company')
      }

      // Redirect to companies list after successful deletion
      router.push('/platform/companies')
      router.refresh()
    } catch (err: any) {
      console.error('Error deleting company:', err)
      setError(err.message || 'Failed to delete company. Please try again.')
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
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isDeleting && setIsModalOpen(false)}
        title="Delete Company"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-error-900">Warning: This action cannot be undone</p>
              <p className="text-sm text-error-700 mt-1">
                Deleting this company will permanently remove all associated data including:
              </p>
              <ul className="text-sm text-error-700 mt-2 list-disc list-inside space-y-1">
                <li>All routes and fare information</li>
                <li>All park operators and their accounts</li>
                <li>All tickets and transaction records</li>
                <li>All company admin accounts</li>
                <li>All audit logs for this company</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Company:</span> {companyName}
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
                  Delete Company
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

