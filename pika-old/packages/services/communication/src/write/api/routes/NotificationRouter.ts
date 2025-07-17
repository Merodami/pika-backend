import { NotificationType } from '@communication-shared/types/index.js'
import { NotificationController } from '@communication-write/api/controllers/NotificationController.js'
import { MarkAllNotificationsReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkAllNotificationsReadCommandHandler.js'
import { MarkBatchNotificationsReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkBatchNotificationsReadCommandHandler.js'
import { MarkNotificationReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkNotificationReadCommandHandler.js'
import { PublishBatchNotificationCommandHandler } from '@communication-write/application/use_cases/commands/PublishBatchNotificationCommandHandler.js'
import { PublishNotificationCommandHandler } from '@communication-write/application/use_cases/commands/PublishNotificationCommandHandler.js'
import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createNotificationWriteRouter(
  notificationRepository: NotificationWriteRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const publishHandler = new PublishNotificationCommandHandler(
      notificationRepository,
    )
    const publishBatchHandler = new PublishBatchNotificationCommandHandler(
      notificationRepository,
    )
    const markReadHandler = new MarkNotificationReadCommandHandler(
      notificationRepository,
    )
    const markAllReadHandler = new MarkAllNotificationsReadCommandHandler(
      notificationRepository,
    )
    const markBatchReadHandler = new MarkBatchNotificationsReadCommandHandler(
      notificationRepository,
    )

    const controller = new NotificationController(
      publishHandler,
      publishBatchHandler,
      markReadHandler,
      markAllReadHandler,
      markBatchReadHandler,
    )

    // Publish single notification
    fastify.post<{
      Body: {
        user_id: string
        type: NotificationType
        title: string | object
        body: string | object
        icon?: string
        entity_ref?: {
          entity_type: string
          entity_id: string
        }
        expires_at?: string
      }
    }>(
      '/publish',
      {
        schema: {
          body: Type.Object({
            user_id: Type.String({ format: 'uuid' }),
            type: Type.Enum(NotificationType),
            title: Type.Union([Type.String({ minLength: 1 }), Type.Any()]),
            body: Type.Union([Type.String({ minLength: 1 }), Type.Any()]),
            icon: Type.Optional(Type.String()),
            entity_ref: Type.Optional(
              Type.Object({
                entity_type: Type.String({ minLength: 1, maxLength: 50 }),
                entity_id: Type.String({ format: 'uuid' }),
              }),
            ),
            expires_at: Type.Optional(Type.String({ format: 'date-time' })),
          }),
        },
      },
      async (request, reply) => {
        await controller.publish(request, reply)
      },
    )

    // Publish batch notifications
    fastify.post<{
      Body: {
        notifications: Array<{
          user_id: string
          type: NotificationType
          title: string | object
          body: string | object
          icon?: string
          entity_ref?: {
            entity_type: string
            entity_id: string
          }
          expires_at?: string
        }>
      }
    }>(
      '/publish/batch',
      {
        schema: {
          body: Type.Object({
            notifications: Type.Array(
              Type.Object({
                user_id: Type.String({ format: 'uuid' }),
                type: Type.Enum(NotificationType),
                title: Type.Union([Type.String({ minLength: 1 }), Type.Any()]),
                body: Type.Union([Type.String({ minLength: 1 }), Type.Any()]),
                icon: Type.Optional(Type.String()),
                entity_ref: Type.Optional(
                  Type.Object({
                    entity_type: Type.String({ minLength: 1, maxLength: 50 }),
                    entity_id: Type.String({ format: 'uuid' }),
                  }),
                ),
                expires_at: Type.Optional(Type.String({ format: 'date-time' })),
              }),
              { minItems: 1, maxItems: 100 },
            ),
          }),
        },
      },
      async (request, reply) => {
        await controller.publishBatch(request, reply)
      },
    )

    // Mark single notification as read
    fastify.patch<{
      Params: { notificationId: string }
    }>(
      '/:notificationId/read',
      {
        schema: {
          params: Type.Object({
            notificationId: Type.String({ format: 'uuid' }),
          }),
        },
      },
      async (request, reply) => {
        await controller.markAsRead(request, reply)
      },
    )

    // Mark all notifications as read for user
    fastify.put('/read-all', async (request, reply) => {
      await controller.markAllAsRead(request, reply)
    })

    // Mark multiple notifications as read
    fastify.put<{
      Body: { notification_ids: string[] }
    }>(
      '/batch/read',
      {
        schema: {
          body: Type.Object({
            notification_ids: Type.Array(Type.String({ format: 'uuid' }), {
              minItems: 1,
              maxItems: 100,
            }),
          }),
        },
      },
      async (request, reply) => {
        await controller.markBatchAsRead(request, reply)
      },
    )
  }
}
