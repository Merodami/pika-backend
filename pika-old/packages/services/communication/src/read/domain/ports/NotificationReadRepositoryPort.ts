import { Notification } from '@communication-read/domain/entities/Notification.js'
import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'

export interface NotificationReadRepositoryPort {
  findById(userId: string, notificationId: string): Promise<Notification | null>
  findByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean
      types?: NotificationType[]
      limit?: number
      offset?: number
    },
  ): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
  }>
  findByEntity(
    entityRef: EntityReference,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    },
  ): Promise<{
    notifications: Notification[]
    total: number
  }>
  getUnreadCount(userId: string, types?: NotificationType[]): Promise<number>
  getNotificationStats(userId: string): Promise<{
    total: number
    unread: number
    byType: Record<NotificationType, number>
  }>
}
