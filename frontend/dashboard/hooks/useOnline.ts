import { useEffect, useState } from 'react'

import { toast } from 'sonner'

export function useOnline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection Restored: You are back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning(
        'Connection Lost: You are currently offline. Some features may be limited.'
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
