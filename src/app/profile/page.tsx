'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { LockClosedIcon, TargetIcon, ImageIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { uploadImage } from '@/utils/imageUpload'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
            .eq('UID', user?.id || '')
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

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url)
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
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    
    setUploadError(null)
    setUploadLoading(true)

    try {
      // Create authenticated client
      const supabaseClient = createClientComponentClient()
      
      const { publicUrl, error } = await uploadImage({
        file,
        userId: user.id,
        supabase: supabaseClient,
        previousUrl: avatarUrl
      })

      if (error) {
        setUploadError(error)
        return
      }

      // Update user metadata with new avatar URL
      await updateProfile({ 
        display_name: user.user_metadata?.display_name || '',
        avatar_url: publicUrl 
      })

      setAvatarUrl(publicUrl)
      setMessage('Profile picture updated successfully!')
    } catch (error) {
      setUploadError(
        error instanceof Error 
          ? error.message 
          : 'Failed to update profile picture'
      )
    } finally {
      setUploadLoading(false)
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
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-800 cursor-pointer hover:border-[#D8110A] transition-colors"
            >
              {avatarUrl ? (
                <>
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors">
                  <ImageIcon className="w-12 h-12 text-white/30" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {uploadLoading && (
              <p className="text-white/60 text-sm">
                Uploading...
              </p>
            )}
            {uploadError && (
              <p className="text-[#D8110A] text-sm text-center">
                {uploadError}
              </p>
            )}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">
                {displayName ? displayName : 'Please set a display name'}
              </h2>
              <p className="mt-1 text-white/60">
                {user.email}
              </p>
            </div>
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
              {loading ? 'Updating...' : 'Change Display Name'}
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
                    minLength={8}
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
                    minLength={8}
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