import type { NotificationRead } from '../entities/Notification.js'

export interface NotificationQueryOptions {
  userId: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
  types?: string[]
}

export interface NotificationReadRepositoryPort {
  findByUser(options: NotificationQueryOptions): Promise<NotificationRead[]>
  findById(id: string, userId: string): Promise<NotificationRead | null>
  countUnread(userId: string): Promise<number>
  countByUser(
    userId: string,
    options?: { unreadOnly?: boolean; types?: string[] },
  ): Promise<number>
  markAsRead(id: string, userId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  findByEntity(
    userId: string,
    entityType: string,
    entityId: string,
    limit: number,
    offset: number,
  ): Promise<NotificationRead[]>
  countByEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<number>
}
