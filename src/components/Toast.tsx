'use client'

import { useEffect, useState } from 'react'
import { CheckCircledIcon, CrossCircledIcon, InfoCircledIcon } from '@radix-ui/react-icons'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose?: () => void
  visible: boolean
}

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  visible
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
    
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-800',
    error: 'bg-red-800',
    info: 'bg-blue-800'
  }[type]

  const Icon = {
    success: CheckCircledIcon,
    error: CrossCircledIcon,
    info: InfoCircledIcon
  }[type]

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">{message}</p>
        <button 
          onClick={() => {
            setIsVisible(false)
            if (onClose) onClose()
          }}
          className="ml-auto text-white/80 hover:text-white"
        >
          <CrossCircledIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Add a keyframe animation for the toast
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `
  document.head.appendChild(style)
} 