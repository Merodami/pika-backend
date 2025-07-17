import { NotificationController } from '@notification-write/api/controllers/NotificationController.js'
import {
  MarkAllNotificationsAsReadCommandHandler,
  MarkBatchNotificationsAsReadCommandHandler,
  MarkNotificationAsReadCommandHandler,
  PublishBatchNotificationsCommandHandler,
  PublishNotificationCommandHandler,
} from '@notification-write/application/index.js'
import type { NotificationServicePort } from '@notification-write/application/ports/NotificationServicePort.js'
import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for notification write endpoints
 *
 * @param notificationService - Service for notification write operations
 * @returns Fastify plugin for notification write routes
 */
export function createNotificationWriteRouter(
  notificationService: NotificationServicePort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize command handlers
    const publishCommandHandler = new PublishNotificationCommandHandler(
      notificationService,
    )

    const publishBatchCommandHandler =
      new PublishBatchNotificationsCommandHandler(notificationService)

    const markAsReadHandler = new MarkNotificationAsReadCommandHandler(
      notificationService,
    )

    const markAllAsReadHandler = new MarkAllNotificationsAsReadCommandHandler(
      notificationService,
    )

    const markBatchAsReadHandler =
      new MarkBatchNotificationsAsReadCommandHandler(notificationService)

    // Initialize controller
    const notificationController = new NotificationController(
      publishCommandHandler,
      publishBatchCommandHandler,
      markAsReadHandler,
      markAllAsReadHandler,
      markBatchAsReadHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // POST /notifications/publish - Publish notification
    fastify.post<{
      Body: schemas.PublishNotificationRequest
    }>(
      '/publish',
      {
        schema: {
          body: schemas.PublishNotificationRequestSchema,
        },
      },
      async (request, reply) => {
        const result = await notificationController.publish(request)

        return reply.code(200).send(result)
      },
    )

    // POST /notifications/publish/batch - Publish multiple notifications
    fastify.post<{
      Body: schemas.PublishBatchNotificationsRequest
    }>(
      '/publish/batch',
      {
        schema: {
          body: schemas.PublishBatchNotificationsRequestSchema,
        },
      },
      async (request, reply) => {
        const result = await notificationController.publishBatch(request)

        return reply.code(200).send(result)
      },
    )

    // PATCH /notifications/:notificationId/read - Mark notification as read
    fastify.patch<{
      Params: schemas.MarkNotificationAsReadParams
    }>(
      '/:notificationId/read',
      {
        schema: {
          params: schemas.MarkNotificationAsReadParamsSchema,
        },
      },
      async (request, reply) => {
        await notificationController.markAsRead(request, reply)
      },
    )

    // PUT /notifications/read-all - Mark all notifications as read
    fastify.put('/read-all', {}, async (request, reply) => {
      await notificationController.markAllAsRead(request, reply)
    })

    // PUT /notifications/batch/read - Mark multiple notifications as read
    fastify.put<{
      Body: schemas.MarkBatchNotificationsAsReadRequest
    }>(
      '/batch/read',
      {
        schema: {
          body: schemas.MarkBatchNotificationsAsReadRequestSchema,
        },
      },
      async (request, reply) => {
        await notificationController.markBatchAsRead(request, reply)
      },
    )
  }
}
