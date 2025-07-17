import { useEffect } from 'react'

import { realtimeNotificationService } from '@/services/firebase/realtime-notifications'
import { useAuthStore } from '@/store/auth.store'

export function useFirebaseNotifications() {
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Start listening to notifications
      realtimeNotificationService.startListening(user.id, user.role)

      // Optional: Send a test notification in development
      if (process?.env?.NODE_ENV === 'development') {
        // Uncomment to test notifications
        // realtimeNotificationService.sendTestNotification();
      }
    } else {
      // Stop listening when user logs out
      realtimeNotificationService.stopListening()
    }

    // Cleanup on unmount
    return () => {
      realtimeNotificationService.stopListening()
    }
  }, [isAuthenticated, user])

  return {
    markAsRead: realtimeNotificationService.markAsRead.bind(
      realtimeNotificationService
    ),
    markAllAsRead: realtimeNotificationService.markAllAsRead.bind(
      realtimeNotificationService
    ),
    deleteNotification: realtimeNotificationService.deleteNotification.bind(
      realtimeNotificationService
    ),
    sendTestNotification: realtimeNotificationService.sendTestNotification.bind(
      realtimeNotificationService
    ),
  }
}
