'use client'

import { notification } from 'antd'
import { useEffect } from 'react'

import { useNotificationStore } from '@/store/notifications.store'

export function NotificationProvider() {
  const { notifications, removeNotification } = useNotificationStore()
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    notifications.forEach((notif) => {
      const key = notif.id

      // Antd notification API doesn't provide a way to check existing notifications
      // So we'll just show all notifications and rely on the key to prevent duplicates
      api[notif.type]({
        key,
        message: notif.title,
        description: notif.message,
        duration: notif.duration ? notif.duration / 1000 : 4,
        onClose: () => removeNotification(notif.id),
        btn: notif.action ? (
          <button
            onClick={() => {
              notif.action!.onClick()
              removeNotification(notif.id)
            }}
            className="text-primary hover:text-primary/80"
          >
            {notif.action.label}
          </button>
        ) : undefined,
      })
    })
  }, [notifications, api, removeNotification])

  return contextHolder
}
