import { Notification } from '@communication-read/domain/entities/Notification.js'
import { NotificationReadRepositoryPort } from '@communication-read/domain/ports/NotificationReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

export interface GetEntityNotificationsQuery {
  entityType: string
  entityId: string
  limit?: number
  offset?: number
}

export interface GetEntityNotificationsResult {
  notifications: Notification[]
  total: number
  hasMore: boolean
}

export class GetEntityNotificationsQueryHandler {
  constructor(
    private readonly notificationRepository: NotificationReadRepositoryPort,
  ) {}

  async execute(
    query: GetEntityNotificationsQuery,
  ): Promise<GetEntityNotificationsResult> {
    try {
      logger.debug('Getting entity notifications', {
        entityType: query.entityType,
        entityId: query.entityId,
        limit: query.limit,
        offset: query.offset,
      })

      const result = await this.notificationRepository.findByEntity(
        {
          entityType: query.entityType,
          entityId: query.entityId,
        },
        {
          limit: query.limit || 20,
          offset: query.offset || 0,
        },
      )

      const { notifications, total } = result

      const hasMore = (query.offset || 0) + notifications.length < total

      return {
        notifications,
        total,
        hasMore,
      }
    } catch (error) {
      logger.error('Failed to get entity notifications', {
        error: error.message,
        entityType: query.entityType,
        entityId: query.entityId,
      })

      throw ErrorFactory.databaseError(
        'notification_get_entity',
        'Failed to get entity notifications',
        error,
        {
          correlationId: `notification-entity-${query.entityType}-${query.entityId}`,
          source: 'GetEntityNotificationsQueryHandler.execute',
        },
      )
    }
  }
}
