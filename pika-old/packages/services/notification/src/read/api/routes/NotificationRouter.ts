import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify'

import {
  GetNotificationsByEntityHandler,
  GetUserNotificationsHandler,
} from '../../application/index.js'
import { NotificationReadRepositoryPort } from '../../domain/port/NotificationReadRepositoryPort.js'
import { NotificationReadController } from '../controllers/NotificationController.js'

/**
 * Sets appropriate response headers for language negotiation
 */
function setLanguageHeader(request: FastifyRequest, reply: FastifyReply): void {
  const language = getPreferredLanguage(request)

  if (language && language !== 'all') {
    reply.header('Content-Language', language)
  }
}

/**
 * Creates a Fastify router for notification read endpoints
 *
 * @param notificationRepository - Repository for notification data access
 * @returns Fastify plugin for notification routes
 */
export function createNotificationReadRouter(
  notificationRepository: NotificationReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getUserNotificationsHandler = new GetUserNotificationsHandler(
      notificationRepository,
    )
    const getNotificationsByEntityHandler = new GetNotificationsByEntityHandler(
      notificationRepository,
    )

    // Initialize controller with the handlers
    const notificationController = new NotificationReadController(
      getUserNotificationsHandler,
      getNotificationsByEntityHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // GET /notifications - Get user notifications
    fastify.get<{
      Querystring: {
        limit?: string | number
        offset?: string | number
        unreadOnly?: string | boolean
        types?: string | string[]
      }
    }>(
      '/',
      {
        schema: {
          querystring: schemas.GetNotificationsQuerySchema,
        },
      },
      async (request, reply) => {
        setLanguageHeader(request, reply)

        const result =
          await notificationController.getUserNotifications(request)

        return reply.code(200).send(result)
      },
    )

    // GET /notifications/entities/:entityType/:entityId - Get notifications by entity
    fastify.get<{
      Params: schemas.GetNotificationsByEntityParams
      Querystring: schemas.GetNotificationsByEntityQuery
    }>(
      '/entities/:entityType/:entityId',
      {
        schema: {
          params: schemas.GetNotificationsByEntityParamsSchema,
          querystring: schemas.GetNotificationsByEntityQuerySchema,
        },
      },
      async (request, reply) => {
        setLanguageHeader(request, reply)

        const result =
          await notificationController.getNotificationsByEntity(request)

        return reply.code(200).send(result)
      },
    )
  }
}
