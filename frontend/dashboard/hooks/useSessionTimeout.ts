import { useCallback, useEffect, useRef } from 'react'

import { useAuthStore } from '@/store/auth.store'
import { showWarning } from '@/store/notifications.store'

interface UseSessionTimeoutOptions {
  timeout?: number // in milliseconds, default 30 minutes
  warningTime?: number // show warning before timeout, default 5 minutes
  onTimeout?: () => void
}

export function useSessionTimeout({
  timeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes
  onTimeout,
}: UseSessionTimeoutOptions = {}) {
  const { logout, isAuthenticated } = useAuthStore()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const handleTimeout = useCallback(() => {
    if (onTimeout) {
      onTimeout()
    } else {
      showWarning(
        'Session Expired',
        'Your session has expired. Please login again.'
      )
      logout()
    }
  }, [logout, onTimeout])

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    if (!isAuthenticated) return

    // Update last activity
    lastActivityRef.current = Date.now()

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning(
        'Session Expiring Soon',
        'Your session will expire in 5 minutes. Please save your work.'
      )
    }, timeout - warningTime)

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, timeout)
  }, [isAuthenticated, timeout, warningTime, handleTimeout])

  useEffect(() => {
    if (!isAuthenticated) return

    // Events that reset the timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    const handleActivity = () => {
      // Throttle activity tracking
      const now = Date.now()

      if (now - lastActivityRef.current > 1000) {
        resetTimer()
      }
    }

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    // Start timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [isAuthenticated, resetTimer])

  return { resetTimer }
}
