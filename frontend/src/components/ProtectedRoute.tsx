/**
 * Protected Route Component
 * Ensures user is authenticated before rendering children
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }

    if (!loading && user && requiredRole && !hasRole(requiredRole)) {
      // User doesn't have required role
      router.push('/unauthorized')
    }
  }, [user, loading, requiredRole, hasRole, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
          <p className="text-zinc-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null // Will redirect to unauthorized
  }

  return <>{children}</>
}
