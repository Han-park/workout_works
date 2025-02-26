'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import BottomNav from "@/components/BottomNav"
import ClientLayout from "@/components/ClientLayout"
import { useEffect } from 'react'

interface ClientRootProps {
  children: React.ReactNode
}

const publicPaths = ['/auth/signin', '/auth/signup', '/']
const protectedRoutes = ['/graph', '/meal', '/workout', '/profile']

export default function ClientRoot({ children }: ClientRootProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (user && !loading) {
      console.log('Authentication successful:', {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name,
        lastSignIn: user.last_sign_in_at
      })
    }
  }, [user, loading])

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isPublicPath = publicPaths.includes(pathname)

    if (!loading) {
      if (!user && isProtectedRoute) {
        console.log('Redirecting to signin from protected route:', pathname)
        router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
      } else if (user && isPublicPath && pathname !== '/') {
        console.log('Redirecting authenticated user to home')
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>
  }

  // For protected routes, don't render until we have a user
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (!user && isProtectedRoute) {
    return null
  }

  return (
    <ClientLayout>
      <main className="pb-16">
        {children}
      </main>
      {user && <BottomNav />}
    </ClientLayout>
  )
} 