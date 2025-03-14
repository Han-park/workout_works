'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { EnvelopeClosedIcon, LockClosedIcon } from '@radix-ui/react-icons'
import Toast, { ToastType } from '@/components/Toast'
import Link from 'next/link'
import { debouncedSignIn } from '@/utils/authUtils'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [usePassword, setUsePassword] = useState(true)
  const { signInWithEmail, signInWithPassword } = useAuth()
  const router = useRouter()
  
  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<ToastType>('info')
  const [toastVisible, setToastVisible] = useState(false)

  // Function to show toast
  const showToast = (message: string, type: ToastType = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  // Redirect is now handled by middleware
  // No need for the useEffect redirect here

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (usePassword) {
        showToast('Signing in with password...', 'info')
        await debouncedSignIn(signInWithPassword, email, password)
        showToast('Sign in successful! Redirecting...', 'success')
        router.push('/graph')
      } else {
        showToast('Sending magic link...', 'info')
        await signInWithEmail(email)
        setMessage('Check your email for the magic link!')
        showToast('Magic link sent! Check your email.', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('too many requests')) {
        setError('Too many sign-in attempts. Please wait a few minutes before trying again.')
        showToast('Rate limit exceeded. Please try again later.', 'error')
      } else {
        setError(errorMessage)
        showToast(errorMessage, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-4 text-white/60">
            {usePassword ? 'Sign in with your email and password' : 'Sign in with magic link'}
          </p>
        </div>

        <div className="flex justify-center space-x-2 mb-6">
          <button
            type="button"
            onClick={() => setUsePassword(true)}
            className={`py-2 px-4 rounded-md transition-colors ${
              usePassword 
                ? 'bg-[#D8110A] text-white' 
                : 'bg-transparent border border-gray-800 text-white/60'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setUsePassword(false)}
            className={`py-2 px-4 rounded-md transition-colors ${
              !usePassword 
                ? 'bg-[#D8110A] text-white' 
                : 'bg-transparent border border-gray-800 text-white/60'
            }`}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email
              </label>
              <div className="mt-1 relative">
                <EnvelopeClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {usePassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="mt-1 relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <input
                    id="password"
                    type="password"
                    required={usePassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#D8110A]"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <Link href="#" className="text-sm text-[#D8110A] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#D8110A] text-white rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : usePassword ? 'Sign in' : 'Send magic link'}
            </button>
          </div>
        </form>

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

        <div className="text-center mt-4">
          <p className="text-white/60">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#D8110A] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Toast component */}
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={5000}
      />
    </div>
  )
} 