import type { Notification } from '@notification-write/domain/index.js'

export interface NotificationServicePort {
  publish(notification: Notification): Promise<void>
  publishBatch(notifications: Notification[]): Promise<void>
  markAsRead(notificationId: string, userId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  getNotification(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null>
}
