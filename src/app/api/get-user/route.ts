import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the userId from the query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // First try to get user metadata from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError) {
      console.error('Error fetching user:', userError.message)
      
      // If we can't get from auth.users, try to get from a custom profiles table if it exists
      try {
        // Try to query a custom profiles table if it exists
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles') // Try a different table name
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) {
          throw profileError
        }

        if (profileData) {
          return NextResponse.json({
            id: profileData.id,
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            last_sign_in_at: profileData.last_activity
          })
        }
      } catch {
        // If both methods fail, return a basic response with just the ID
        return NextResponse.json({
          id: userId,
          display_name: 'User',
          avatar_url: null,
          last_sign_in_at: null
        })
      }
    }

    // Return user data from auth.users
    if (user) {
      return NextResponse.json({
        id: user.id,
        display_name: user.user_metadata?.display_name || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        last_sign_in_at: user.last_sign_in_at
      })
    }

    // Fallback if no user found
    return NextResponse.json({
      id: userId,
      display_name: 'User',
      avatar_url: null,
      last_sign_in_at: null
    })
  } catch (error) {
    console.error('Error in get-user API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
} 