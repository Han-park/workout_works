'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import { 
  PersonIcon, 
  DashboardIcon, 
  TableIcon, 
  MagnifyingGlassIcon,
  ReloadIcon
} from '@radix-ui/react-icons'

export default function LabAdminPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div>
      <Header />
      <div className="p-4 max-w-6xl mx-auto pb-24">
        {/* Admin Header */}
        <div className="p-4 mb-6">
          <div className="flex items-center mb-2">
            <div className="w-[80px] h-[80px] rounded-full bg-[#D8110A] flex items-center justify-center">
              <DashboardIcon className="w-8 h-8 text-white" />
            </div>
            <div className="ml-4 flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-white">Admin Dashboard</h2>
              <p className='text-gray-400 text-normal'>User Management & Analytics</p>
            </div>
          </div>
        </div>
        
        {/* Main Content Container */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            Dashboard Overview
          </h2>
          
          {/* Placeholder for dashboard content */}
          <div className="bg-[#222222] p-6 rounded-lg">
            <p className="text-gray-400 text-center">
              Admin dashboard content will be displayed here.
            </p>
          </div>
        </div>
        
        {/* User Management Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            User Management
          </h2>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="search" 
              className="block w-full p-3 pl-10 text-sm text-white border border-gray-700 rounded-lg bg-[#222222] focus:ring-[#D8110A] focus:border-[#D8110A]" 
              placeholder="Search users..." 
            />
          </div>
          
          {/* User List Placeholder */}
          <div className="bg-[#222222] p-6 rounded-lg">
            <p className="text-gray-400 text-center">
              User list will be displayed here.
            </p>
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            Analytics
          </h2>
          
          {/* Analytics Placeholder */}
          <div className="bg-[#222222] p-6 rounded-lg">
            <p className="text-gray-400 text-center">
              Analytics data will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 