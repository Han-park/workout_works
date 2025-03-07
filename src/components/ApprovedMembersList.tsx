'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type ApprovedMember = {
  id: string
  display_name?: string
  avatar_url?: string
  last_activity?: string
}

export default function ApprovedMembersList({ approvedUserIds }: { approvedUserIds: string[] }) {
  const [members, setMembers] = useState<ApprovedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchMemberData() {
      if (!approvedUserIds.length) {
        console.log('No approved user IDs provided')
        setMembers([])
        setLoading(false)
        return
      }

      try {
        console.log('=== DEBUGGING APPROVED MEMBERS LIST ===')
        console.log('Approved User IDs:', approvedUserIds)
        
        // Now try to get data from the profiles table for all users
        console.log('Querying profiles table for all approved users')
        
        try {
          // Get all profiles
          const { data: allProfiles, error } = await supabase
            .from('profiles')
            .select('*')
          
          if (error) {
            console.error('Error querying all profiles:', error.message)
            throw error
          }
          
          console.log('All profiles query result:', allProfiles)
          
          if (!allProfiles || allProfiles.length === 0) {
            console.log('No profiles found, falling back to basic data')
            throw new Error('No profiles found')
          }
          
          // Based on the data structure, we need to match on the UID field, not id
          // Filter profiles that match our approved user IDs
          const matchingProfiles = allProfiles.filter(profile => 
            approvedUserIds.includes(profile.UID)
          )
          
          console.log('Matching profiles after filtering:', matchingProfiles)
          
          if (matchingProfiles.length > 0) {
            // Process profiles data
            const allMembers = matchingProfiles.map(profile => {
              return {
                id: profile.UID, // Use UID as the id
                display_name: profile.display_name || 'User',
                avatar_url: profile.avatar_url || undefined,
                last_activity: profile.last_activity || undefined
              }
            })
            
            console.log('Processed members:', JSON.stringify(allMembers, null, 2))
            
            // Avatar URLs are already full URLs, no need to process them
            console.log('Final members:', JSON.stringify(allMembers, null, 2))
            setMembers(allMembers)
            setLoading(false)
            return
          } else {
            console.log('No matching profiles found, falling back to basic data')
          }
        } catch (profilesError) {
          console.error('Error working with profiles table:', profilesError)
        }
        
        // If we get here, we couldn't get data from profiles table
        // Fall back to basic entries for all approved users
        console.log('Creating basic entries for all approved users')
        const basicMembers = approvedUserIds.map(id => ({
          id,
          display_name: 'User',
          avatar_url: undefined as string | undefined,
          last_activity: undefined as string | undefined
        }))
        
        setMembers(basicMembers)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('Error fetching member data:', err)
        setError(`Failed to load members: ${errorMessage}`)
        
        // Fallback to basic entries
        console.log('Error occurred, falling back to basic entries')
        const basicMembers = approvedUserIds.map(id => ({
          id,
          display_name: 'User',
          avatar_url: undefined,
          last_activity: undefined
        }))
        setMembers(basicMembers)
      } finally {
        setLoading(false)
        console.log('=== END DEBUGGING APPROVED MEMBERS LIST ===')
      }
    }

    fetchMemberData()
  }, [approvedUserIds, supabase])

  if (loading) {
    return <div className="text-center text-white/50 py-8">Loading members...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {members.map((member) => (
           <>
              <div key={member.id} className="flex flex-col justify-center border border-gray-400 px-3 py-2">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-800">
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">
                      {(member.display_name || 'User').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {member.display_name || 'Anonymous User'}
                  </p>
                </div>
              </div>
            </>
   
          ))}
        </div>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center text-gray-400">
        <p>No approved members found.</p>
        <p className="mt-2 text-sm">Contact an administrator to get approved.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {members.map((member) => (
        <div key={member.id} className="flex flex-col justify-center border border-gray-400 px-3 py-2">
          <div className="relative w-full h-full aspect-square overflow-hidden border border-gray-600">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.display_name || 'Member'}
                fill
                sizes="600px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400">
                  {(member.display_name || 'User').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-light text-xl truncate mt-2">
              {member.display_name || 'User'}
            </p>
            {member.last_activity && (
              <p className="text-sm text-gray-400">
                Active {formatDistanceToNow(new Date(member.last_activity), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 