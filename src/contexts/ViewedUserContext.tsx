'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Define the viewed user type
export type ViewedUser = {
  id: string
  display_name?: string
  avatar_url?: string
  is_approved: boolean
}

interface ViewedUserContextType {
  viewedUser: ViewedUser | null
  approvedUsers: ViewedUser[]
  isLoadingUsers: boolean
  switchUser: (userId: string) => void
  resetToCurrentUser: () => void
  isViewingSelf: boolean
  loading: boolean
  error: string | null
  setViewedUserId: (userId: string | null) => void
}

const ViewedUserContext = createContext<ViewedUserContextType | undefined>(undefined)

export function ViewedUserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null)
  const [approvedUsers, setApprovedUsers] = useState<ViewedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [viewedUserId, setViewedUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Initialize viewed user to current user
  useEffect(() => {
    if (user) {
      const currentUserAsViewedUser: ViewedUser = {
        id: user.id,
        display_name: user.user_metadata?.display_name,
        avatar_url: user.user_metadata?.avatar_url,
        is_approved: true // Assume the current user is approved if they're logged in
      }
      setViewedUser(currentUserAsViewedUser)
    } else {
      setViewedUser(null)
    }
  }, [user])

  // Fetch all approved users
  useEffect(() => {
    async function fetchApprovedUsers() {
      if (!user) {
        setApprovedUsers([])
        setIsLoadingUsers(false)
        return
      }

      try {
        setIsLoadingUsers(true)
        
        // Check if current user is approved
        const { data: currentUserProfile, error: currentUserError } = await supabase
          .from('profiles')
          .select('is_approved')
          .eq('UID', user.id)
          .single()
        
        if (currentUserError || !currentUserProfile?.is_approved) {
          // Current user is not approved, don't fetch other users
          setApprovedUsers([])
          setIsLoadingUsers(false)
          return
        }
        
        // Fetch all approved users
        const { data: approvedProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_approved', true)
        
        if (error) {
          console.error('Error fetching approved users:', error.message)
          setApprovedUsers([])
        } else if (approvedProfiles) {
          const formattedUsers: ViewedUser[] = approvedProfiles.map(profile => ({
            id: profile.UID,
            display_name: profile.display_name || 'User',
            avatar_url: profile.avatar_url,
            is_approved: true
          }))
          setApprovedUsers(formattedUsers)
        }
      } catch (error) {
        console.error('Error in fetchApprovedUsers:', error)
        setApprovedUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchApprovedUsers()
  }, [user, supabase])

  // Fetch user data when viewedUserId changes
  useEffect(() => {
    const fetchUserData = async () => {
      // If no viewedUserId is set, use the current user's ID
      const targetUserId = viewedUserId || (user ? user.id : null)
      
      // If no user ID is available, return
      if (!targetUserId) {
        setViewedUser(null)
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch user data from your API or Supabase
        const { data, error } = await supabase
          .from('profiles') // Adjust table name as needed
          .select('*')
          .eq('UID', targetUserId) // Changed from 'id' to 'UID'
          .single()
          
        if (error) {
          console.error('Error fetching profile:', error.message)
          throw error
        }
        
        if (data) {
          setViewedUser({
            id: targetUserId,
            display_name: data.display_name || 'User',
            avatar_url: data.avatar_url || null,
            is_approved: data.is_approved || false
          })
        } else {
          // If no profile exists, use basic user data
          setViewedUser({
            id: targetUserId,
            display_name: user?.user_metadata?.display_name || 'User',
            avatar_url: user?.user_metadata?.avatar_url || null,
            is_approved: true // Assume current user is approved
          })
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        
        // Fallback to using current user data if there's an error
        if (user && targetUserId === user.id) {
          setViewedUser({
            id: user.id,
            display_name: user.user_metadata?.display_name || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            is_approved: true // Assume current user is approved
          })
          setError(null) // Clear error since we're using fallback
        } else {
          setError('Failed to load user data')
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [viewedUserId, user, supabase])

  // Function to switch to viewing another user
  const switchUser = (userId: string) => {
    const selectedUser = approvedUsers.find(u => u.id === userId)
    if (selectedUser) {
      setViewedUser(selectedUser)
    }
  }

  // Function to reset back to viewing the current user
  const resetToCurrentUser = () => {
    if (user) {
      const currentUserAsViewedUser: ViewedUser = {
        id: user.id,
        display_name: user.user_metadata?.display_name,
        avatar_url: user.user_metadata?.avatar_url,
        is_approved: true
      }
      setViewedUser(currentUserAsViewedUser)
    }
  }

  // Check if the viewed user is the current user
  const isViewingSelf = viewedUser?.id === user?.id

  const value = {
    viewedUser,
    approvedUsers,
    isLoadingUsers,
    switchUser,
    resetToCurrentUser,
    isViewingSelf,
    loading,
    error,
    setViewedUserId
  }

  return (
    <ViewedUserContext.Provider value={value}>
      {children}
    </ViewedUserContext.Provider>
  )
}

export function useViewedUser() {
  const context = useContext(ViewedUserContext)
  if (context === undefined) {
    throw new Error('useViewedUser must be used within a ViewedUserProvider')
  }
  return context
} 