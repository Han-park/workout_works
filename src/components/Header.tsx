'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useViewedUser } from '@/contexts/ViewedUserContext'
import { PlusIcon, ImageIcon, ChevronDownIcon, CheckIcon, GearIcon } from '@radix-ui/react-icons'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  onAddClick?: () => void
}

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { viewedUser, approvedUsers, switchUser, resetToCurrentUser, isViewingSelf } = useViewedUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showAddButton = pathname === '/graph'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Determine if we should show the user switcher (only if there are other approved users)
  const showUserSwitcher = approvedUsers.length > 1

  return (
    <header className="bg-[#111111] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/WW.png"
              alt="Workout Works Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </Link>

          <div className="flex items-center space-x-4">
            {showAddButton && onAddClick && (
              <button
                onClick={onAddClick}
                className="p-2 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <PlusIcon className="w-5 h-5" /> Add Data
              </button>
            )}
            
            {/* User Switcher */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className={`flex items-center space-x-3 group cursor-pointer ${!isViewingSelf ? 'bg-[#2a2a2a] px-3 py-1 rounded-md' : ''}`}
                onClick={() => showUserSwitcher && setDropdownOpen(!dropdownOpen)}
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-800 group-hover:border-[#D8110A] transition-colors">
                  {viewedUser?.avatar_url ? (
                    <Image
                      src={viewedUser.avatar_url}
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
                <div className="flex items-center">
                  <span className="text-white/70 group-hover:text-white transition-colors">
                    {viewedUser?.display_name || 'Profile'}
                  </span>
                  
                  {/* Only show dropdown indicator if user switcher is available */}
                  {showUserSwitcher && (
                    <ChevronDownIcon className="w-4 h-4 ml-1 text-white/50" />
                  )}
                  
                  {/* Show indicator if viewing another user */}
                  {!isViewingSelf && (
                    <span className="ml-2 text-xs text-[#D8110A]">(Viewing)</span>
                  )}
                </div>
              </div>
              
              {/* Dropdown Menu */}
              {dropdownOpen && showUserSwitcher && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-800 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-white/50 border-b border-gray-800">
                      Switch User
                    </div>
                    
                    {approvedUsers.map((approvedUser) => (
                      <div
                        key={approvedUser.id}
                        className={`px-4 py-2 flex items-center justify-between hover:bg-[#2a2a2a] cursor-pointer ${
                          viewedUser?.id === approvedUser.id ? 'bg-[#2a2a2a]' : ''
                        }`}
                        onClick={() => {
                          if (approvedUser.id === user?.id) {
                            resetToCurrentUser()
                          } else {
                            switchUser(approvedUser.id)
                          }
                          setDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-800">
                            {approvedUser.avatar_url ? (
                              <Image
                                src={approvedUser.avatar_url}
                                alt={approvedUser.display_name || 'User'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                                <span className="text-white/50 text-xs">
                                  {(approvedUser.display_name || 'User').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-white/70">
                            {approvedUser.display_name || 'User'}
                            {approvedUser.id === user?.id && (
                              <span className="ml-1 text-xs text-white/50">(You)</span>
                            )}
                          </span>
                        </div>
                        
                        {viewedUser?.id === approvedUser.id && (
                          <CheckIcon className="w-4 h-4 text-[#D8110A]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Link to profile page */}
            <Link
              href="/profile"
              className="p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <GearIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 