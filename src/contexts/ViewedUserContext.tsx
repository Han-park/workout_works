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
}

const ViewedUserContext = createContext<ViewedUserContextType | undefined>(undefined)

export function ViewedUserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null)
  const [approvedUsers, setApprovedUsers] = useState<ViewedUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
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
    isViewingSelf
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