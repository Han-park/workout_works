'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { trackAuthRequest } from '@/utils/debugUtils'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: { display_name?: string, avatar_url?: string }) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateGoals: (data: { goal_muscle_mass: number, goal_body_fat: number }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Add a ref to track if we've already initialized
  const initialized = useRef(false)
  // Add a timestamp for last auth request
  const lastAuthRequest = useRef(Date.now())

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return;
    
    const initializeAuth = async () => {
      try {
        // Track this auth request
        const requestNum = trackAuthRequest('initializeAuth');
        console.log(`Auth request #${requestNum}`);
        
        // Throttle auth requests
        const now = Date.now();
        if (now - lastAuthRequest.current < 1000) {
          console.log('Throttling auth request');
          return;
        }
        
        lastAuthRequest.current = now;
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('Logged in user ID:', session.user.id)
          setUser(session.user)
        } else {
          console.log('Not logged in')
          setUser(null)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
        initialized.current = true;
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Track this auth state change
      const requestNum = trackAuthRequest('onAuthStateChange');
      console.log(`Auth state change #${requestNum}`);
      
      if (session?.user) {
        console.log('Auth state changed - User ID:', session.user.id)
        setUser(session.user)
        // Remove router.refresh() to prevent refresh loops
      } else {
        console.log('Auth state changed - Not logged in')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase]) // Remove router from dependencies

  const signInWithEmail = async (email: string): Promise<void> => {
    // Throttle sign-in requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log(`Attempting to sign in with email: ${email.substring(0, 3)}...`);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(`Sign in error: ${error.message}`);
      throw error;
    }
    console.log('Magic link sent successfully');
  }

  const signInWithPassword = async (email: string, password: string): Promise<void> => {
    // Throttle sign-in requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log(`Attempting to sign in with password for email: ${email.substring(0, 3)}...`);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error(`Sign in error: ${error.message}`);
      throw error;
    }
    console.log('Sign in successful');
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    // Validate password length
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Throttle sign-up requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log(`Attempting to sign up with email: ${email.substring(0, 3)}...`);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(`Sign up error: ${error.message}`);
      throw error;
    }
    console.log('Sign up successful');
  }

  const updatePassword = async (password: string): Promise<void> => {
    // Throttle password update requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log('Attempting to update password');
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) {
      console.error(`Update password error: ${error.message}`);
      throw error;
    }
    console.log('Password updated successfully');
  }

  const updateProfile = async (data: { display_name?: string, avatar_url?: string }): Promise<void> => {
    // Throttle profile update requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log('Attempting to update profile');
    
    const { error } = await supabase.auth.updateUser({
      data: data
    })
    
    if (error) {
      console.error(`Update profile error: ${error.message}`);
      throw error;
    }
    
    // Update the local user state with the new metadata
    if (user) {
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...data
        }
      })
    }
    console.log('Profile updated successfully');
  }

  const updateGoals = async (data: { goal_muscle_mass: number, goal_body_fat: number }): Promise<void> => {
    if (!user) throw new Error('No user found')

    // Throttle goal update requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log('Attempting to update goals');
    
    const { error } = await supabase
      .from('goal')
      .insert([{
        skeletal_muscle_mass: data.goal_muscle_mass,
        percent_body_fat: data.goal_body_fat,
        UID: user.id
      }])
    
    if (error) {
      console.error(`Update goals error: ${error.message}`);
      throw error;
    }
    console.log('Goals updated successfully');
  }

  const signOut = async (): Promise<void> => {
    // Throttle sign-out requests
    const now = Date.now();
    if (now - lastAuthRequest.current < 1000) {
      throw new Error('Please wait before trying again');
    }
    
    lastAuthRequest.current = now;
    console.log('Attempting to sign out');
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error(`Sign out error: ${error.message}`);
      throw error;
    }
    console.log('Sign out successful');
    router.push('/')
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    updateGoals,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 