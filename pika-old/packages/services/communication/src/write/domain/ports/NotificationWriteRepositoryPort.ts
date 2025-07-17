import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'

import { Notification } from '../entities/Notification.js'

export interface NotificationWriteRepositoryPort {
  create(notification: Notification): Promise<Notification>
  save(notification: Notification): Promise<Notification>
  saveBatch(notifications: Notification[]): Promise<void>
  update(notification: Notification): Promise<Notification>
  findById(userId: string, notificationId: string): Promise<Notification | null>
  findByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean
      types?: NotificationType[]
      limit?: number
      offset?: number
    },
  ): Promise<Notification[]>
  findByEntity(
    entityRef: EntityReference,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    },
  ): Promise<Notification[]>
  markAsRead(userId: string, notificationId: string): Promise<void>
  markAllAsRead(userId: string, types?: NotificationType[]): Promise<number>
  markBatchAsRead(notificationIds: string[], userId: string): Promise<number>
  delete(userId: string, notificationId: string): Promise<void>
  deleteExpired(): Promise<number>
  getUnreadCount(userId: string, types?: NotificationType[]): Promise<number>
}
