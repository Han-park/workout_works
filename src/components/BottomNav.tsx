'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChartIcon, CountdownTimerIcon, MoveIcon } from '@radix-ui/react-icons'

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/graph"
            className={`flex flex-col items-center justify-center flex-1 h-full
              ${isActive('/graph') ? 'text-[#D8110A]' : 'text-white/60'}
              hover:text-[#D8110A] transition-colors`}
          >
            <BarChartIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Progress</span>
          </Link>
          
          <Link
            href="/meal"
            className={`flex flex-col items-center justify-center flex-1 h-full
              ${isActive('/meal') ? 'text-[#D8110A]' : 'text-white/60'}
              hover:text-[#D8110A] transition-colors`}
          >
            <CountdownTimerIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Meal</span>
          </Link>
          
          <Link
            href="/workout"
            className={`flex flex-col items-center justify-center flex-1 h-full
              ${isActive('/workout') ? 'text-[#D8110A]' : 'text-white/60'}
              hover:text-[#D8110A] transition-colors`}
          >
            <MoveIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Workout</span>
          </Link>
        </div>
      </div>
    </nav>
  )
} 