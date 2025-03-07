import styles from './styles.module.css' // Import the CSS module
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import ApprovedMembersList from '@/components/ApprovedMembersList'

export const revalidate = 60 // revalidate every minute

// Function to fetch approved user IDs
async function getApprovedUserIds(): Promise<string[]> {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // Get all approved user IDs from user_approval table
    const { data: approvedUsers, error: approvalError } = await supabase
      .from('profiles')
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
    return approvedUsers.map(user => user.UID)
  } catch (error) {
    console.error('Unexpected error:', error)
    return []
  }
}

export default async function Home() {
  const approvedUserIds = await getApprovedUserIds()

  return (
    <main className="min-h-screen bg-[#111111] text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className={`text-3xl font-light mb-6 ${styles.animatedHeading}`}>
            Workout Works
          </h1>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto">
            Workout Works is a community. We build muscles, and get consistency in our daily lives.
          </p>
        </div>

        {/* Members Section */}
        <div className="mt-16">
          <h2 className="text-xl text-gray-300 font-light font-mono mb-8 text-center">Active Members</h2>
          <ApprovedMembersList approvedUserIds={approvedUserIds} />
        </div>
    <div className="mt-16">
      <p className="text-sm text-gray-300 max-w-2xl mx-auto">
        If you want to join our community, please contact us at me@han-park.info.
      </p>
      </div>

      </div>
    </main>
  )
}
