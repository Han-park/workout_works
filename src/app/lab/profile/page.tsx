'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { 
  MixerHorizontalIcon, 
  PersonIcon, 
  ClockIcon, 
  BarChartIcon, 
  InfoCircledIcon, 
  HomeIcon, 
  CheckCircledIcon,
  BackpackIcon,
  MixerVerticalIcon
} from '@radix-ui/react-icons'

export default function LabPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [targetUser, setTargetUser] = useState<any>(null)
  const [latestMeasurements, setLatestMeasurements] = useState<any>(null)
  
  // Target UID from the request
  const targetUID = '19a286a9-e5c8-4571-921f-db3712f49927'

  useEffect(() => {
    async function fetchTargetUserData() {
      try {
        setLoading(true)
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('UID', targetUID)
          .single()
        
        if (profileError) {
          throw profileError
        }
        
        if (!profileData) {
          throw new Error('User not found')
        }
        
        // Fetch latest measurements - try both table names to ensure we get data
        let measurementsData = null;
        let measurementsError = null;
        
        // Try 'metric' table first
        const metricResult = await supabase
          .from('metric')
          .select('*')
          .eq('UID', targetUID)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!metricResult.error || metricResult.error.code === 'PGRST116') {
          measurementsData = metricResult.data;
          measurementsError = metricResult.error;
        } else {
          // If 'metric' table fails, try 'measurement' table
          const measurementResult = await supabase
            .from('measurement')
            .select('*')
            .eq('UID', targetUID)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          measurementsData = measurementResult.data;
          measurementsError = measurementResult.error;
        }
        
        if (measurementsError && measurementsError.code !== 'PGRST116') {
          // PGRST116 is the error code for "no rows returned" which is fine if there are no measurements
          console.error('Error fetching measurements:', measurementsError);
        }
        
        setTargetUser(profileData)
        setLatestMeasurements(measurementsData || null)
      } catch (error: any) {
        console.error('Error fetching user data:', error)
        setError(error.message || 'Failed to load user data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTargetUserData()
  }, [router, targetUID])

  if (loading) {
    return (
      <div>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D8110A]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="p-4 max-w-md mx-auto mt-8">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-white">
            <p>Error: {error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-[#D8110A] text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Big Three data (hard-coded example)
  const bigThreeData = {
    bench: 92,
    squat: 140,
    deadlift: 150,
    total: 92 + 140 + 150 // 382
  };

  // Gym membership data (hard-coded example)
  const gymMemberships = [
    "Gymboxx 건대입구점",
    "Gymboxx 어린이대공원점"
  ];

  return (
    <div>
      <Header />
      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
          Member Profile
        </h1>
        
        {/* User Profile Card */}
        <div className="rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            {targetUser.avatar_url ? (
              <Image
                src={targetUser.avatar_url}
                alt={targetUser.display_name || 'User'}
                width={80}
                height={80}
                className="rounded-full object-cover aspect-square"
              />
            ) : (
              <div className="w-[80px] h-[80px] rounded-full bg-gray-800 flex items-center justify-center">
                <PersonIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="ml-4 flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-white">{targetUser.display_name || 'User'}</h2>
              <p className='text-gray-400 text-normal'>founder of CFP</p>
              <p className="text-gray-400 text-sm flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Member since {new Date(targetUser.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Gym Membership Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <HomeIcon className="w-5 h-5 mr-2 text-[#D8110A]" />
            Gym Membership
          </h2>
          
          <div className="space-y-3">
            {gymMemberships.map((gym, index) => (
              <div key={index} className="flex items-center bg-[#222222] p-3 rounded-lg">
                <CheckCircledIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-white">{gym}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Big Three Total Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-[#D8110A]" />
            Big Three Total
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#222222] p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Bench</p>
              <p className="text-white text-lg font-semibold">{bigThreeData.bench} kg</p>
            </div>
            <div className="bg-[#222222] p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Squat</p>
              <p className="text-white text-lg font-semibold">{bigThreeData.squat} kg</p>
            </div>
            <div className="bg-[#222222] p-3 rounded-lg">
              <p className="text-gray-400 text-sm">Deadlift</p>
              <p className="text-white text-lg font-semibold">{bigThreeData.deadlift} kg</p>
            </div>
            <div className="bg-[#222222] p-3 rounded-lg bg-gradient-to-r from-[#222222] to-[#2a2a2a]">
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-white text-lg font-semibold">{bigThreeData.total} kg</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm flex items-center">
          <InfoCircledIcon className="w-4 h-4 mr-1" />
                Estimated 1RM according to the Epley formula
              </p>
        </div>
        
        {/* Gears Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BackpackIcon className="w-5 h-5 mr-2 text-[#D8110A]" />
            Gears
          </h2>
          
          <div className="bg-[#222222] p-4 rounded-lg text-gray-400 text-center">
            No gear information available
          </div>
        </div>
        
        {/* Nutrient Supplements Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <MixerVerticalIcon className="w-5 h-5 mr-2 text-[#D8110A]" />
            Nutrient Supplements
          </h2>
          
          <div className="bg-[#222222] p-4 rounded-lg text-gray-400 text-center">
            No supplement information available
          </div>
        </div>
        
        {/* Latest Measurements Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Latest Body Measurements</h2>
          
          {latestMeasurements ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-[#222222] p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Weight</p>
                  <p className="text-white text-lg font-semibold">{latestMeasurements.weight} kg</p>
                </div>
                <div className="bg-[#222222] p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Body Fat</p>
                  <p className="text-white text-lg font-semibold">{latestMeasurements.percent_body_fat}%</p>
                </div>
                <div className="bg-[#222222] p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Muscle Mass</p>
                  <p className="text-white text-lg font-semibold">{latestMeasurements.skeletal_muscle_mass} kg</p>
                </div>
              </div>
              
              <div className="text-gray-400 text-sm flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Measured on {new Date(latestMeasurements.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              No measurement data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 