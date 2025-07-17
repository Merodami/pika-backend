import { NotificationController } from '@communication-read/api/controllers/NotificationController.js'
import { GetEntityNotificationsQueryHandler } from '@communication-read/application/use_cases/queries/GetEntityNotificationsQueryHandler.js'
import { GetUserNotificationsQueryHandler } from '@communication-read/application/use_cases/queries/GetUserNotificationsQueryHandler.js'
import { NotificationReadRepositoryPort } from '@communication-read/domain/ports/NotificationReadRepositoryPort.js'
import { NotificationType } from '@communication-shared/types/index.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createNotificationReadRouter(
  notificationRepository: NotificationReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const getUserNotificationsHandler = new GetUserNotificationsQueryHandler(
      notificationRepository,
    )
    const getEntityNotificationsHandler =
      new GetEntityNotificationsQueryHandler(notificationRepository)

    const controller = new NotificationController(
      getUserNotificationsHandler,
      getEntityNotificationsHandler,
    )

    // Get user notifications with filtering and pagination
    fastify.get<{
      Querystring: {
        offset?: number
        limit?: number
        unread_only?: boolean
        types?: NotificationType[]
      }
    }>(
      '/',
      {
        schema: {
          querystring: Type.Object({
            offset: Type.Optional(Type.Integer({ minimum: 0 })),
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
            unread_only: Type.Optional(Type.Boolean()),
            types: Type.Optional(Type.Array(Type.Enum(NotificationType))),
          }),
        },
      },
      async (request, reply) => {
        await controller.getUserNotifications(request, reply)
      },
    )

    // Get notifications for specific entity
    fastify.get<{
      Params: {
        entityType: string
        entityId: string
      }
      Querystring: {
        offset?: number
        limit?: number
      }
    }>(
      '/entities/:entityType/:entityId',
      {
        schema: {
          params: Type.Object({
            entityType: Type.String({ minLength: 1 }),
            entityId: Type.String({ format: 'uuid' }),
          }),
          querystring: Type.Object({
            offset: Type.Optional(Type.Integer({ minimum: 0 })),
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
          }),
        },
      },
      async (request, reply) => {
        await controller.getEntityNotifications(request, reply)
      },
    )
  }
}
