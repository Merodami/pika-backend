import { useEffect, useState } from 'react'

import { showInfo, showWarning } from '@/store/notifications.store'

export function useOnline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showInfo('Connection Restored', 'You are back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      showWarning(
        'Connection Lost',
        'You are currently offline. Some features may be limited.'
      )
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
