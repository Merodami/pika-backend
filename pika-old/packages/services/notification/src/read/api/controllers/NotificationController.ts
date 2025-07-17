import {
  GetNotificationsByEntityHandler,
  GetUserNotificationsHandler,
} from '@notification-read/application/index.js'
import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { NotificationMapper } from '@pika/sdk'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { type FastifyRequest } from 'fastify'

interface GetNotificationsQuery {
  limit?: string | number
  offset?: string | number
  unreadOnly?: string | boolean
  types?: string | string[]
}

/**
 * Controller for Notification read operations
 * Handles HTTP requests for querying notifications
 */
export class NotificationReadController {
  constructor(
    private readonly getUserNotificationsHandler: GetUserNotificationsHandler,
    private readonly getNotificationsByEntityHandler?: GetNotificationsByEntityHandler,
  ) {}

  /**
   * Get user notifications
   * GET /notifications
   */
  async getUserNotifications(
    request: FastifyRequest<{ Querystring: GetNotificationsQuery }>,
  ): Promise<schemas.GetNotificationsResponse> {
    try {
      const context = RequestContext.fromHeaders(request)

      // For now, users can only get their own notifications
      // In the future, we might allow getting notifications for a specific user ID
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to access notifications',
          {
            correlationId: request.id,
            source: 'NotificationReadController.getUserNotifications',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      const query = request.query

      // Validate and parse limit
      let limit: number | undefined

      if (query.limit !== undefined) {
        limit =
          typeof query.limit === 'number'
            ? query.limit
            : parseInt(query.limit.toString())
        if (isNaN(limit) || limit < 1 || limit > 100) {
          throw ErrorFactory.validationError(
            { limit: ['Limit must be a number between 1 and 100'] },
            {
              correlationId: request.id,
              source: 'NotificationReadController.getUserNotifications',
              suggestion: 'Provide a valid limit parameter',
            },
          )
        }
      }

      // Validate and parse offset
      let offset: number | undefined

      if (query.offset !== undefined) {
        offset =
          typeof query.offset === 'number'
            ? query.offset
            : parseInt(query.offset.toString())
        if (isNaN(offset) || offset < 0) {
          throw ErrorFactory.validationError(
            { offset: ['Offset must be a non-negative number'] },
            {
              correlationId: request.id,
              source: 'NotificationReadController.getUserNotifications',
              suggestion: 'Provide a valid offset parameter',
            },
          )
        }
      }

      // Parse unreadOnly
      const unreadOnly = query.unreadOnly
        ? query.unreadOnly === 'true' || query.unreadOnly === true
        : undefined

      // Parse types
      let types: string[] | undefined

      if (query.types) {
        types = Array.isArray(query.types) ? query.types : [query.types]
      }

      const result = await this.getUserNotificationsHandler.execute({
        userId,
        limit,
        offset,
        unreadOnly,
        types,
      })

      // Convert domain entities to DTOs using the mapper
      return {
        notifications: NotificationMapper.toDTOList(result.notifications),
        unreadCount: result.unreadCount,
        total: result.total,
      }
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error getting user notifications:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.user?.id || request.headers['x-user-id'],
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'UnauthorizedError') {
        throw error // Pass through unauthorized errors
      }

      // Handle database errors
      if (error.name?.includes('Prisma') || error.name?.includes('Database')) {
        throw ErrorFactory.databaseError(
          'get_notifications',
          'Failed to fetch notifications',
          error,
          {
            correlationId: request.id,
            source: 'NotificationReadController.getUserNotifications',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to fetch notifications', {
        source: 'NotificationReadController.getUserNotifications',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: request.user?.id || request.headers['x-user-id'],
          queryParams: request.query,
        },
        suggestion: 'Please try again later',
      })
    }
  }

  /**
   * Get notifications by entity
   * GET /notifications/entities/:entityType/:entityId
   */
  async getNotificationsByEntity(
    request: FastifyRequest<{
      Params: schemas.GetNotificationsByEntityParams
      Querystring: schemas.GetNotificationsByEntityQuery
    }>,
  ): Promise<schemas.GetNotificationsByEntityResponse> {
    try {
      const context = RequestContext.fromHeaders(request)

      if (!context.userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to access notifications',
          {
            correlationId: request.id,
            source: 'NotificationReadController.getNotificationsByEntity',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      if (!this.getNotificationsByEntityHandler) {
        throw ErrorFactory.serviceUnavailable(
          'Entity notification handler not initialized',
          {
            correlationId: request.id,
            source: 'NotificationReadController.getNotificationsByEntity',
          },
        )
      }

      const { entityType, entityId } = request.params
      const query = request.query

      // Validate and parse limit
      let limit: number | undefined

      if (query.limit !== undefined) {
        limit =
          typeof query.limit === 'number'
            ? query.limit
            : parseInt(String(query.limit))
        if (isNaN(limit) || limit < 1 || limit > 100) {
          throw ErrorFactory.validationError(
            { limit: ['Limit must be a number between 1 and 100'] },
            {
              correlationId: request.id,
              source: 'NotificationReadController.getNotificationsByEntity',
            },
          )
        }
      }

      // Validate and parse offset
      let offset: number | undefined

      if (query.offset !== undefined) {
        offset =
          typeof query.offset === 'number'
            ? query.offset
            : parseInt(String(query.offset))
        if (isNaN(offset) || offset < 0) {
          throw ErrorFactory.validationError(
            { offset: ['Offset must be a non-negative number'] },
            {
              correlationId: request.id,
              source: 'NotificationReadController.getNotificationsByEntity',
            },
          )
        }
      }

      const result = await this.getNotificationsByEntityHandler.execute({
        userId: context.userId,
        entityType,
        entityId,
        limit,
        offset,
      })

      // Convert domain entities to DTOs using the mapper
      return {
        data: NotificationMapper.toDTOList(result.notifications),
        total: result.total,
      }
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error getting notifications by entity:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.headers['x-user-id'],
        entityType: request.params.entityType,
        entityId: request.params.entityId,
        correlationId: request.id,
      })

      // Handle specific error types
      if (
        error.name === 'ValidationError' ||
        error.name === 'UnauthorizedError'
      ) {
        throw error
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(
        error,
        'Failed to fetch notifications by entity',
        {
          source: 'NotificationReadController.getNotificationsByEntity',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            userId: request.headers['x-user-id'],
            entityType: request.params.entityType,
            entityId: request.params.entityId,
          },
          suggestion: 'Please try again later',
        },
      )
    }
  }
}
