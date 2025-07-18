import { randomUUID } from 'crypto'
import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: Date
}

interface NotificationState {
  notifications: Notification[]

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // Helper methods
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: randomUUID(),
      createdAt: new Date(),
      duration: notification.duration || 5000,
    }

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(newNotification.id)
      }, newNotification.duration)
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  clearNotifications: () => {
    set({ notifications: [] })
  },

  // Helper methods
  success: (title, message) => {
    get().addNotification({ type: 'success', title, message })
  },

  error: (title, message) => {
    get().addNotification({ type: 'error', title, message })
  },

  warning: (title, message) => {
    get().addNotification({ type: 'warning', title, message })
  },

  info: (title, message) => {
    get().addNotification({ type: 'info', title, message })
  },
}))

// Export convenience functions
export const showNotification = useNotificationStore.getState().addNotification
export const showSuccess = useNotificationStore.getState().success
export const showError = useNotificationStore.getState().error
export const showWarning = useNotificationStore.getState().warning
export const showInfo = useNotificationStore.getState().info
