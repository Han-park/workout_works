import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/auth/signin', '/auth/signup', '/auth/callback', '/', '/lab']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Get the pathname from the request
  const { pathname } = request.nextUrl
  
  // Skip auth check for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return response
  }
  
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  // Check if we have a session
  const { data: { session } } = await supabase.auth.getSession()
  
  // If no session and not a public route, redirect to sign in
  if (!session) {
    const redirectUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  return response
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 