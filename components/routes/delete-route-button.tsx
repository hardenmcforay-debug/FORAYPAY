'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Modal from '@/components/ui/modal'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteRouteButtonProps {
  routeId: string
  routeName: string
  origin: string
  destination: string
}

export default function DeleteRouteButton({ 
  routeId, 
  routeName, 
  origin, 
  destination 
}: DeleteRouteButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete route')
      }

      // Refresh the page to show updated routes list
      router.refresh()
      setIsModalOpen(false)
    } catch (err: any) {
      console.error('Error deleting route:', err)
      setError(err.message || 'Failed to delete route. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-error-600 hover:text-error-700 hover:bg-error-50 w-full mt-2"
        onClick={() => setIsModalOpen(true)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Route
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isDeleting && setIsModalOpen(false)}
        title="Delete Route"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-error-50 border border-error-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-error-900">Warning: This action cannot be undone</p>
              <p className="text-sm text-error-700 mt-1">
                Deleting this route will permanently remove:
              </p>
              <ul className="text-sm text-error-700 mt-2 list-disc list-inside space-y-1">
                <li>The route and all its information</li>
                <li>All tickets associated with this route</li>
                <li>All transaction records for this route</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Route:</span> {routeName}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Path:</span> {origin} → {destination}
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
                  Delete Route
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

