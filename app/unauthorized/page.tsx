import Link from 'next/link'
import Button from '@/components/ui/button'
import { ShieldX, Ban } from 'lucide-react'

interface UnauthorizedPageProps {
  searchParams?: { reason?: string }
}

export default function UnauthorizedPage({ searchParams = {} }: UnauthorizedPageProps) {
  const reason = searchParams?.reason
  const isSuspended = reason === 'suspended'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className={`w-16 h-16 ${isSuspended ? 'bg-warning-100' : 'bg-error-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {isSuspended ? (
            <Ban className="w-8 h-8 text-warning-600" />
          ) : (
            <ShieldX className="w-8 h-8 text-error-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isSuspended ? 'Account Suspended' : 'Unauthorized'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isSuspended
            ? 'Your company account has been suspended. Please contact the platform administrator for assistance.'
            : "You don't have permission to access this page."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="outline">Go to Home</Button>
          </Link>
          {isSuspended && (
            <Link href="/contact">
              <Button>Contact Support</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

