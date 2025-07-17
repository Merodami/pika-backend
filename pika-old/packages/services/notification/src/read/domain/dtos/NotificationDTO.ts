import { NotificationType } from '../../../write/domain/entities/Notification.js'
import { EntityRefType } from '../../../write/domain/value-objects/EntityRef.js'

/**
 * Notification DTOs for read operations
 */

export interface NotificationDTO {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  icon?: string
  entityRef?: EntityRefType
  read: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface GetNotificationsQueryDTO {
  userId: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
  types?: NotificationType[]
}

export interface GetNotificationsResponseDTO {
  notifications: NotificationDTO[]
  unreadCount: number
  total: number
}

export interface UnreadCountResponseDTO {
  unreadCount: number
}
