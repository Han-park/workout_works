import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import styles from './styles.module.css' // Import the CSS module

export const revalidate = 60 // revalidate every minute

// Define the member type
interface Member {
  id: string
  display_name?: string
  avatar_url?: string
  last_activity?: string
}

// Temporarily commented out member fetching functionality
/*
async function getMembers() {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      console.log('Logged in user ID:', session.user.id)
    } else {
      console.log('Not logged in')
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, last_activity')
      .order('last_activity', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching members:', error.message, error.details, error.hint)
      return []
    }

    return users || []
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}
*/

export default async function Home() {
  // const members = await getMembers()
  const members: Member[] = [] // Temporary empty array while profile fetching is disabled

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
          <h2 className="text-xl font-light font-mono mb-8 text-center">Active Members</h2>
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
              <p>No active members found.</p>
              <p className="mt-2 text-sm">Be the first to join!</p>
            </div>
          )}
        </div>

        {/* Mockup for member profile pictures */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
          <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
          <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </main>
  )
}
