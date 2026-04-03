'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { 
  PersonIcon, 
  ClockIcon, 
  InfoCircledIcon, 
  CheckCircledIcon,
  ReloadIcon
} from '@radix-ui/react-icons'

// Define the model item type
type RotationConfig = {
  x?: number;
  y?: number;
  z?: number;
}

type ModelItem = {
  url: string;
  name: string;
  description?: string;
  rotationAxis?: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
  rotationSpeed?: number;
  rotationConfig?: RotationConfig;
}

// Define error and measurement types
type ProfileData = {
  UID: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  [key: string]: unknown;
}

type MeasurementData = {
  weight: number;
  percent_body_fat: number;
  skeletal_muscle_mass: number;
  bmi: number;
  created_at: string;
  [key: string]: unknown;
}

// Dynamically import the ModelGrid component to avoid SSR issues
const ModelGrid = dynamic(() => import('@/components/ModelGrid'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[200px] bg-[#222222] rounded-lg">
      <div className="animate-spin text-[#D8110A]">
        <ReloadIcon className="w-8 h-8" />
      </div>
    </div>
  )
})

export default function LabPage() {
  // We're not using the user anymore since we removed the authentication check
  const router = useRouter()
  const [loading] = useState(false)
  // Use mock data instead of fetching from Supabase
  const [targetUser] = useState<ProfileData | null>({
    UID: '19a286a9-e5c8-4571-921f-db3712f49927',
    display_name: 'Han Park',
    avatar_url: '', // or provide a mock avatar URL
    created_at: '2022-01-01T00:00:00.000Z',
  })
  const [latestMeasurements] = useState<MeasurementData | null>({
    weight: 74.5,
    percent_body_fat: 13.2,
    skeletal_muscle_mass: 36.1,
    bmi: 22.8,
    created_at: '2024-06-01T10:00:00.000Z',
  })

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

  if (!targetUser) {
    return (
      <div>
        <Header />
        <div className="p-4 max-w-md mx-auto mt-8">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-white">
            <p>Error: User not found</p>
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
  
  // Gear models data
  const gearModels: ModelItem[] = [
    {
      url: "/lab/grips.glb",
      name: "Pro",
      description: "Versa Gripps",
      rotationAxis: "xy",
      rotationSpeed: 0.007
    },
    {
      url: "/lab/belt.glb",
      name: "5-inch Form Core",
      description: "Harbinger",
      rotationAxis: "xz",
      rotationSpeed: 0.005
    }
  ];
  
  // Supplement models data
  const supplementModels: ModelItem[] = [
    {
      url: "/lab/protein.glb",
      name: "Platinum Hydrowhey",
      description: "Optimum Nutrition",
      rotationAxis: "yz",
      rotationSpeed: 0.006
    },
    {
      url: "/lab/creatine.glb",
      name: "Creatine1000",
      description: "Evolution Nutrition",
      rotationAxis: "xyz",
      rotationSpeed: 0.004,
      // Custom rotation configuration for more complex motion
      rotationConfig: {
        x: 0.003,
        y: 0.005,
        z: 0.002
      }
    },
    {
      url: "/lab/calcium.glb",
      name: "Calcium Magnesium Plus Zinc Tablets",
      description: "Solgar",
      rotationAxis: "xyz",
      rotationSpeed: 0.008
    }
  ];

  return (
    <div>
      <Header />
      <div className="p-4 max-w-lg pb-24 mx-auto">
        
        {/* User Profile Card */}
        <div className="p-4 mb-6">
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
           
            Gears
          </h2>
          
          <Suspense fallback={
            <div className="flex justify-center items-center h-[200px] bg-[#222222] rounded-lg">
              <div className="animate-spin text-[#D8110A]">
                <ReloadIcon className="w-8 h-8" />
              </div>
            </div>
          }>
            <ModelGrid models={gearModels} itemHeight={200} />
          </Suspense>
          
      
        </div>
        
        {/* Nutrient Supplements Card */}
        <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          
            Supplements
          </h2>
          
          <Suspense fallback={
            <div className="flex justify-center items-center h-[200px] bg-[#222222] rounded-lg">
              <div className="animate-spin text-[#D8110A]">
                <ReloadIcon className="w-8 h-8" />
              </div>
            </div>
          }>
            <ModelGrid models={supplementModels} itemHeight={200} />
          </Suspense>
          
    
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