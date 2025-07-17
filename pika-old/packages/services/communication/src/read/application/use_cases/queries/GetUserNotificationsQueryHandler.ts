import { Notification } from '@communication-read/domain/entities/Notification.js'
import { NotificationReadRepositoryPort } from '@communication-read/domain/ports/NotificationReadRepositoryPort.js'
import { NotificationType } from '@communication-shared/types/index.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { get, set } from 'lodash-es'

export const GetUserNotificationsQuerySchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  unreadOnly: Type.Optional(Type.Boolean({ default: false })),
  types: Type.Optional(Type.Array(Type.Enum(NotificationType))),
})

export type GetUserNotificationsQuery =
  typeof GetUserNotificationsQuerySchema.static

export interface GetUserNotificationsResult {
  notifications: Notification[]
  total: number
  unreadCount: number
  stats: {
    total: number
    unread: number
    byType: Record<NotificationType, number>
  }
}

export class GetUserNotificationsQueryHandler {
  constructor(
    private readonly notificationRepository: NotificationReadRepositoryPort,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<GetUserNotificationsResult> {
    logger.info('Getting user notifications', { userId: query.userId })

    if (!Value.Check(GetUserNotificationsQuerySchema, query)) {
      const errors = [...Value.Errors(GetUserNotificationsQuerySchema, query)]
      const validationErrors: Record<string, string[]> = {}

      for (const error of errors) {
        const field = error.path.replace('/', '')

        if (!get(validationErrors, field)) {
          set(validationErrors, field, [])
        }
        get(validationErrors, field).push(error.message)
      }

      throw ErrorFactory.validationError(validationErrors, {
        source: 'GetUserNotificationsQueryHandler.execute',
      })
    }

    try {
      // Get notifications
      const { notifications, total, unreadCount } =
        await this.notificationRepository.findByUser(query.userId, {
          unreadOnly: query.unreadOnly,
          types: query.types,
          limit: query.limit,
          offset: query.offset,
        })

      // Get notification stats
      const stats = await this.notificationRepository.getNotificationStats(
        query.userId,
      )

      return {
        notifications,
        total,
        unreadCount,
        stats,
      }
    } catch (error) {
      logger.error('Failed to get user notifications', error as Error, {
        userId: query.userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to retrieve notifications', {
        source: 'GetUserNotificationsQueryHandler.execute',
      })
    }
  }
}
