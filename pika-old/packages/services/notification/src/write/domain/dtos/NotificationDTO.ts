import { NotificationType } from '../entities/Notification.js'
import { EntityRefType } from '../value-objects/EntityRef.js'

/**
 * Notification DTOs for write operations
 */

export type PublishNotificationDTO = {
  userId: string
  type: NotificationType
  title: string
  body: string
  icon?: string
  entityRef?: EntityRefType
  expiresAt?: Date
}

export type PublishNotificationResponseDTO = {
  success: boolean
}

export type BatchPublishNotificationsDTO = {
  notifications: PublishNotificationDTO[]
}

export type BatchPublishNotificationsResponseDTO = {
  success: boolean
  processed: number
  failed: number
}

export type MarkAsReadResponseDTO = {
  success: boolean
}
