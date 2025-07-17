import { NotificationRead } from '@notification-read/domain/index.js'
import { NotificationReadRepositoryPort } from '@notification-read/domain/port/NotificationReadRepositoryPort.js'
import { ErrorFactory } from '@pika/shared'

export interface GetNotificationsByEntityQuery {
  userId: string
  entityType: string
  entityId: string
  limit?: number
  offset?: number
}

export interface GetNotificationsByEntityResult {
  notifications: NotificationRead[]
  total: number
}

export class GetNotificationsByEntityHandler {
  constructor(
    private readonly notificationRepository: NotificationReadRepositoryPort,
  ) {}

  async execute(
    query: GetNotificationsByEntityQuery,
  ): Promise<GetNotificationsByEntityResult> {
    try {
      const { userId, entityType, entityId, limit = 20, offset = 0 } = query

      // Get notifications for the specific entity
      const notifications = await this.notificationRepository.findByEntity(
        userId,
        entityType,
        entityId,
        limit,
        offset,
      )

      // Get total count for pagination
      const total = await this.notificationRepository.countByEntity(
        userId,
        entityType,
        entityId,
      )

      return {
        notifications,
        total,
      }
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to get notifications by entity',
        {
          source: 'GetNotificationsByEntityHandler.execute',
        },
      )
    }
  }
}
