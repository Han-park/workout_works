'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { LockClosedIcon, TargetIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabase'

interface Goal {
  skeletal_muscle_mass: number
  percent_body_fat: number
}

export default function ProfilePage() {
  const { user, signOut, updateProfile, updatePassword, updateGoals } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [goalMuscleMass, setGoalMuscleMass] = useState('')
  const [goalBodyFat, setGoalBodyFat] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [goalLoading, setGoalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [goalError, setGoalError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [goalMessage, setGoalMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
    } else {
      // Fetch the latest goal data
      async function fetchLatestGoal() {
        try {
          const { data, error } = await supabase
            .from('goal')
            .select('skeletal_muscle_mass, percent_body_fat')
            .eq('UID', user?.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (error) throw error

          if (data && data.length > 0) {
            setGoalMuscleMass(data[0].skeletal_muscle_mass.toString())
            setGoalBodyFat(data[0].percent_body_fat.toString())
          }
        } catch (error) {
          console.error('Error fetching goals:', error)
        }
      }

      fetchLatestGoal()
    }
  }, [user, router])

  useEffect(() => {
    if (user?.user_metadata) {
      setDisplayName(user.user_metadata.display_name || '')
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      await updateProfile({ display_name: displayName })
      setMessage('Profile updated successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGoals = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGoalError(null)
    setGoalMessage(null)
    setGoalLoading(true)

    if (!goalMuscleMass || !goalBodyFat) {
      setGoalError('Please fill in both goals')
      setGoalLoading(false)
      return
    }

    const muscleMassValue = parseFloat(goalMuscleMass)
    const bodyFatValue = parseFloat(goalBodyFat)

    if (isNaN(muscleMassValue) || isNaN(bodyFatValue)) {
      setGoalError('Please enter valid numbers')
      setGoalLoading(false)
      return
    }

    try {
      await updateGoals({
        goal_muscle_mass: muscleMassValue,
        goal_body_fat: bodyFatValue
      })
      setGoalMessage('Goals updated successfully!')
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : 'Failed to update goals')
    } finally {
      setGoalLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    setPasswordLoading(true)

    // Validate password
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long')
      setPasswordLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setPasswordLoading(false)
      return
    }

    try {
      await updatePassword(password)
      setPasswordMessage('Password updated successfully!')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign out')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {displayName ? displayName : 'Please set a display name'}
            </h2>
            <p className="mt-2 text-white/60">
              {user.email}
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-white/90">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                placeholder="Enter your display name"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>

            {error && (
              <div className="mt-4 text-[#D8110A] text-sm text-center">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 text-green-500 text-sm text-center">
                {message}
              </div>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/60">Goal Settings</span>
            </div>
          </div>

          <form onSubmit={handleUpdateGoals} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="goalMuscleMass" className="block text-sm font-medium text-white/90">
                  Goal Skeletal Muscle Mass (kg)
                </label>
                <div className="mt-1 relative">
                  <TargetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    id="goalMuscleMass"
                    type="number"
                    step="0.1"
                    value={goalMuscleMass}
                    onChange={(e) => setGoalMuscleMass(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                    placeholder="Enter goal muscle mass"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goalBodyFat" className="block text-sm font-medium text-white/90">
                  Goal Body Fat (%)
                </label>
                <div className="mt-1 relative">
                  <TargetIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    id="goalBodyFat"
                    type="number"
                    step="0.1"
                    value={goalBodyFat}
                    onChange={(e) => setGoalBodyFat(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                    placeholder="Enter goal body fat"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={goalLoading}
              className="w-full py-2 px-4 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {goalLoading ? 'Updating...' : 'Update Goals'}
            </button>

            {goalError && (
              <div className="mt-4 text-[#D8110A] text-sm text-center">
                {goalError}
              </div>
            )}

            {goalMessage && (
              <div className="mt-4 text-green-500 text-sm text-center">
                {goalMessage}
              </div>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-white/60">Password Settings</span>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 px-4 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>

            {passwordError && (
              <div className="mt-4 text-[#D8110A] text-sm text-center">
                {passwordError}
              </div>
            )}

            {passwordMessage && (
              <div className="mt-4 text-green-500 text-sm text-center">
                {passwordMessage}
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2 px-4 border border-[#D8110A] text-white rounded-md hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
} 