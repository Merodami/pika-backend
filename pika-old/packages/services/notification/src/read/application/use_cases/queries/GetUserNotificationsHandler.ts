import type { NotificationReadRepositoryPort } from '@notification-read/domain/port/NotificationReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { get, set } from 'lodash-es'

export const GetUserNotificationsQuerySchema = Type.Object({
  userId: Type.String(),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  unreadOnly: Type.Optional(Type.Boolean({ default: false })),
  types: Type.Optional(Type.Array(Type.String())),
})

export type GetUserNotificationsQuery =
  typeof GetUserNotificationsQuerySchema.static

export class GetUserNotificationsHandler {
  constructor(private readonly repository: NotificationReadRepositoryPort) {}

  async execute(query: GetUserNotificationsQuery) {
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
        source: 'GetUserNotificationsHandler.execute',
      })
    }

    try {
      const notifications = await this.repository.findByUser({
        userId: query.userId,
        limit: query.limit || 20,
        offset: query.offset || 0,
        unreadOnly: query.unreadOnly,
        types: query.types,
      })

      // Get total count with same filters (but without pagination)
      const total = await this.repository.countByUser(query.userId, {
        unreadOnly: query.unreadOnly,
        types: query.types,
      })

      const unreadCount = await this.repository.countUnread(query.userId)

      return {
        notifications,
        unreadCount,
        total,
      }
    } catch (error) {
      logger.error('Failed to get user notifications', error as Error, {
        userId: query.userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to retrieve notifications', {
        source: 'GetUserNotificationsHandler.execute',
      })
    }
  }
}
