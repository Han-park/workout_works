'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import BottomNav from "@/components/BottomNav"
import ClientLayout from "@/components/ClientLayout"
import { useEffect, useRef } from 'react'

interface ClientRootProps {
  children: React.ReactNode
}

const publicPaths = ['/auth/signin', '/auth/signup', '/']
const protectedRoutes = ['/graph', '/meal', '/workout', '/profile']

export default function ClientRoot({ children }: ClientRootProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Add a ref to track if we've already redirected
  const hasRedirected = useRef(false)

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
    // Skip if we're still loading or already redirected
    if (loading || hasRedirected.current) return;
    
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isPublicPath = publicPaths.includes(pathname)

    // Add a check to prevent redirect loops
    if (!user && isProtectedRoute && !pathname.includes('/auth/signin')) {
      console.log('Redirecting to signin from protected route:', pathname)
      hasRedirected.current = true;
      router.push(`/auth/signin?redirectTo=${encodeURIComponent(pathname)}`)
    } else if (user && isPublicPath && pathname !== '/' && !hasRedirected.current) {
      console.log('Redirecting authenticated user to home')
      hasRedirected.current = true;
      router.push('/')
    }
  }, [user, loading, pathname, router])

  // Reset the redirect flag when the pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

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