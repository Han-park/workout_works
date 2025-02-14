'use client'

import Header from '@/components/Header'

export default function WorkoutPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-light text-white/50">
            Workout Page
          </h1>
          <p className="text-lg text-white/30">
            Coming Soon
          </p>
        </div>
      </div>
    </div>
  )
} 