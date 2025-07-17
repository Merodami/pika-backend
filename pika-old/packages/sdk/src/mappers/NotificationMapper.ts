import { Notification } from '../openapi/models/Notification.js'

/**
 * Interface representing a Notification domain entity
 * This matches the structure from the notification service
 */
export interface NotificationDomain {
  id: string
  userId: string
  type: string
  title: string
  body: string
  icon?: string
  entityRef?: {
    entityType: string
    entityId: string
  }
  read: boolean
  createdAt: Date
  expiresAt?: Date
}

/**
 * Mapper for converting between Notification domain entities and DTOs
 * Following the same pattern as CategoryMapper
 */
export class NotificationMapper {
  /**
   * Maps a domain entity to an API DTO
   * Transforms dates to ISO strings
   */
  static toDTO(domain: NotificationDomain): Notification {
    return {
      id: domain.id,
      userId: domain.userId,
      type: domain.type as Notification['type'],
      title: domain.title,
      body: domain.body,
      icon: domain.icon,
      entityRef: domain.entityRef,
      read: domain.read,
      createdAt: domain.createdAt.toISOString(),
      expiresAt: domain.expiresAt?.toISOString(),
    }
  }

  /**
   * Maps multiple domain entities to API DTOs
   */
  static toDTOList(domains: NotificationDomain[]): Notification[] {
    return domains.map((domain) => this.toDTO(domain))
  }
}
