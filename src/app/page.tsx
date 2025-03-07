import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import styles from './styles.module.css' // Import the CSS module
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const revalidate = 60 // revalidate every minute

// Define the member type
interface Member {
  id: string
  display_name?: string
  avatar_url?: string
  last_activity?: string
}

// Function to fetch approved users
async function getApprovedMembers() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // First, get all approved user IDs from user_approval table
    const { data: approvedUsers, error: approvalError } = await supabase
      .from('user_approval')
      .select('UID')
      .eq('is_approved', true)
    
    if (approvalError) {
      console.error('Error fetching approved users:', approvalError.message)
      return []
    }
    
    if (!approvedUsers || approvedUsers.length === 0) {
      return []
    }
    
    // Extract the approved user IDs
    const approvedUserIds = approvedUsers.map(user => user.UID)
    
    // Get user data directly from auth.users using their IDs
    const usersWithProfiles = []
    
    for (const userId of approvedUserIds) {
      try {
        // Get user data from auth.users via the API route
        const response = await fetch(`/api/get-user?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`Error fetching user ${userId}: ${response.statusText}`);
          continue;
        }
        
        const userData = await response.json();
        
        if (userData) {
          usersWithProfiles.push({
            id: userId,
            display_name: userData.display_name || 'Anonymous User',
            avatar_url: userData.avatar_url || null,
            last_activity: userData.last_sign_in_at || null
          });
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
      }
    }
    
    // Process the profiles to get public URLs for avatar images
    const processedProfiles = usersWithProfiles.map(profile => {
      let publicAvatarUrl = profile.avatar_url
      
      // If avatar_url exists and doesn't already contain a full URL
      if (profile.avatar_url && !profile.avatar_url.startsWith('http')) {
        // Get the public URL for the avatar
        const { data } = supabase.storage
          .from('profile_picture')
          .getPublicUrl(profile.avatar_url)
        
        publicAvatarUrl = data.publicUrl
      }
      
      return {
        ...profile,
        avatar_url: publicAvatarUrl
      }
    })
    
    return processedProfiles
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export default async function Home() {
  const members = await getApprovedMembers()

  return (
    <main className="min-h-screen bg-[#111111] text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className={`text-3xl font-light mb-6 ${styles.animatedHeading}`}>
            Workout Works
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto">
            Track your fitness journey, connect with fellow fitness enthusiasts, and achieve your goals. 
            Monitor your meals, workouts, and body composition all in one place.
          </p>
        </div>

        {/* Members Section */}
        <div className="mt-16">
          <h2 className="text-xl font-light font-mono mb-8 text-center">Approved Members</h2>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Link 
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="bg-[#1a1a1a] rounded-lg p-4 flex items-center space-x-4 hover:bg-[#222] transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-800">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.display_name || 'Member'}
                        fill
                        sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          {(member.display_name || 'User').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {member.display_name || 'Anonymous User'}
                    </p>
                    {member.last_activity && (
                      <p className="text-sm text-gray-400">
                        Active {formatDistanceToNow(new Date(member.last_activity), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No approved members found.</p>
              <p className="mt-2 text-sm">Contact an administrator to get approved.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
