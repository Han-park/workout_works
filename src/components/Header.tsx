'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PlusIcon, ImageIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

interface HeaderProps {
  onAddClick?: () => void
}

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const showAddButton = pathname === '/graph'

  return (
    <header className="bg-[#111111] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex space-x-4">
            <Link
              href="/meal"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/meal'
                  ? 'bg-[#D8110A] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Meal
            </Link>
            <Link
              href="/graph"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/graph'
                  ? 'bg-[#D8110A] text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Graph
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {showAddButton && onAddClick && (
              <button
                onClick={onAddClick}
                className="p-2 text-white/70 hover:text-white transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            )}
            <Link
              href="/profile"
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-800 group-hover:border-[#D8110A] transition-colors">
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors">
                    <ImageIcon className="w-4 h-4 text-white/30" />
                  </div>
                )}
              </div>
              <span className="text-white/70 group-hover:text-white transition-colors">
                {user?.user_metadata?.display_name || 'Profile'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 