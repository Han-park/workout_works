'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        console.log('Auth state changed - User ID:', session.user.id)
        setUser(session.user)
        router.refresh()
      } else {
        console.log('Auth state changed - Not logged in')
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    
    if (error) throw error
  }

  const updateProfile = async (data: { display_name?: string, avatar_url?: string }) => {
    const { error } = await supabase.auth.updateUser({
      data: data
    })
    
    if (error) throw error
    
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
  }

  const updateGoals = async (data: { goal_muscle_mass: number, goal_body_fat: number }) => {
    if (!user) throw new Error('No user found')

    const { error } = await supabase
      .from('goal')
      .insert([{
        skeletal_muscle_mass: data.goal_muscle_mass,
        percent_body_fat: data.goal_body_fat,
        UID: user.id
      }])
    
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  }

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithPassword,
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