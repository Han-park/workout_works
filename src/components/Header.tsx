'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PersonIcon } from '@radix-ui/react-icons'

interface HeaderProps {
  onAddClick?: () => void
}

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const showAddButton = pathname === '/graph'

  const handleProfileClick = () => {
    if (user) {
      router.push('/profile')
    } else {
      router.push('/auth/signin')
    }
  }

  return (
    <div className="w-full flex justify-between items-center p-4 bg-black">
      <div className="relative w-[40px] h-[40px]">
        <Image
          src="/WW.png"
          alt="Workout Works Logo"
          fill
          sizes="40px"
          className="object-contain"
          priority
        />
      </div>
      <div className="flex items-center gap-4">
        {showAddButton && onAddClick && (
          <button
            onClick={onAddClick}
            className="px-4 py-2 border border-[#D8110A]/50 bg-white/10 text-white/60 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Add Data
          </button>
        )}
        <button
          onClick={handleProfileClick}
          className="px-2 py-2 /50 text-white/60 rounded-lg hover:bg-opacity-90 flex items-center transition-colors"
        >
          <PersonIcon className="mr-2 w-4 h-4" />
          {user ? (user.user_metadata.display_name || 'Profile') : 'Sign In'}
        </button>
      </div>
    </div>
  )
} 