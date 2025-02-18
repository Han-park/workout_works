import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    await supabase.auth.getSession()

    // Check if the request is for a protected route
    const isProtectedRoute = ['/meal', '/graph', '/workout'].some(
      route => request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Redirect to signin if accessing protected route without session
        const redirectUrl = new URL('/auth/signin', request.nextUrl.origin)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth/callback).*)']
} 