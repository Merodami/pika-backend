import {
  MarkAllNotificationsAsReadCommandHandler,
  MarkBatchNotificationsAsReadCommandHandler,
  MarkNotificationAsReadCommandHandler,
  PublishBatchNotificationsCommandHandler,
  PublishNotificationCommandHandler,
} from '@notification-write/application/index.js'
import type { PublishBatchNotificationsCommand } from '@notification-write/application/use_cases/commands/PublishBatchNotificationsCommandHandler.js'
import type { PublishNotificationCommand } from '@notification-write/application/use_cases/commands/PublishNotificationCommandHandler.js'
import { NotificationType } from '@notification-write/domain/index.js'
import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Notification write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class NotificationController {
  constructor(
    private readonly publishHandler: PublishNotificationCommandHandler,
    private readonly publishBatchHandler: PublishBatchNotificationsCommandHandler,
    private readonly markAsReadHandler: MarkNotificationAsReadCommandHandler,
    private readonly markAllAsReadHandler: MarkAllNotificationsAsReadCommandHandler,
    private readonly markBatchAsReadHandler: MarkBatchNotificationsAsReadCommandHandler,
  ) {}

  /**
   * Publish a new notification
   * POST /notifications/publish
   */
  async publish(
    request: FastifyRequest<{
      Body: schemas.PublishNotificationRequest
    }>,
  ): Promise<schemas.PublishNotificationResponse> {
    try {
      const _context = RequestContext.fromHeaders(request)

      // Authorization: This endpoint is designed for internal services to create notifications
      // In production, this should be protected by API Gateway or internal service authentication
      // For now, we allow authenticated requests with proper JWT tokens
      // The actual security is enforced at the Firebase level where notifications are stored
      // under user-specific paths (users/{userId}/notifications), ensuring data isolation

      // TODO: In production, implement proper service-to-service authentication
      // Options:
      // 1. Use internal API tokens with x-internal-service header
      // 2. Implement service mesh with mTLS
      // 3. Use API Gateway to restrict access to internal services only

      // Validate required fields
      const requestBody = request.body

      if (!requestBody.userId) {
        throw ErrorFactory.validationError(
          { userId: ['User ID is required'] },
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            suggestion: 'Provide a valid user ID',
          },
        )
      }

      if (!requestBody.type) {
        throw ErrorFactory.validationError(
          { type: ['Notification type is required'] },
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            suggestion: 'Provide a valid notification type',
          },
        )
      }

      if (!requestBody.title || requestBody.title.trim() === '') {
        throw ErrorFactory.validationError(
          { title: ['Notification title cannot be empty'] },
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            suggestion: 'Provide a notification title',
          },
        )
      }

      if (!requestBody.body || requestBody.body.trim() === '') {
        throw ErrorFactory.validationError(
          { body: ['Notification body cannot be empty'] },
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            suggestion: 'Provide notification content',
          },
        )
      }

      // Validate notification type
      const validTypes = Object.values(NotificationType)

      if (!validTypes.includes(requestBody.type as NotificationType)) {
        throw ErrorFactory.validationError(
          {
            type: [
              `Notification type must be one of: ${validTypes.join(', ')}`,
            ],
          },
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            suggestion: 'Use a valid notification type',
          },
        )
      }

      // Validate expiresAt if provided
      if (requestBody.expiresAt) {
        const expiresDate = new Date(requestBody.expiresAt)

        if (isNaN(expiresDate.getTime())) {
          throw ErrorFactory.validationError(
            { expiresAt: ['Invalid date format for expiration'] },
            {
              correlationId: request.id,
              source: 'NotificationController.publish',
              suggestion:
                'Use ISO 8601 date format (e.g., 2024-01-01T00:00:00Z)',
            },
          )
        }
        if (expiresDate < new Date()) {
          throw ErrorFactory.validationError(
            { expiresAt: ['Expiration date must be in the future'] },
            {
              correlationId: request.id,
              source: 'NotificationController.publish',
              suggestion: 'Provide a future expiration date',
            },
          )
        }
      }

      // Convert to command format
      const command: PublishNotificationCommand = {
        userId: requestBody.userId,
        type: requestBody.type as NotificationType,
        title: requestBody.title,
        body: requestBody.body,
        ...(requestBody.icon && { icon: requestBody.icon }),
        ...(requestBody.entityRef && { entityRef: requestBody.entityRef }),
        ...(requestBody.expiresAt && {
          expiresAt: new Date(requestBody.expiresAt),
        }),
      }

      await this.publishHandler.execute(command)

      const response: schemas.PublishNotificationResponse = { success: true }

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error publishing notification:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.body?.userId,
        notificationType: request.body?.type,
        correlationId: request.id,
        errorName: error.name,
        errorCode: error.code,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Handle user not found
      if (
        error.message?.includes('User not found') ||
        error.message?.includes('Invalid user')
      ) {
        throw ErrorFactory.resourceNotFound('User', request.body.userId, {
          correlationId: request.id,
          source: 'NotificationController.publish',
          suggestion: 'Ensure the user exists',
        })
      }

      // Handle Firebase-specific errors
      if (
        error.name?.includes('Firebase') ||
        error.code?.includes('firebase') ||
        error.message?.includes('FCM')
      ) {
        throw ErrorFactory.externalServiceError(
          'Firebase Cloud Messaging',
          'Failed to send push notification',
          error,
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            severity: ErrorSeverity.ERROR,
            metadata: {
              notificationType: request.body?.type,
              hasDeviceToken: error.message?.includes('token'),
            },
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma') || error.name?.includes('Database')) {
        throw ErrorFactory.databaseError(
          'publish_notification',
          'Failed to store notification',
          error,
          {
            correlationId: request.id,
            source: 'NotificationController.publish',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to publish notification', {
        source: 'NotificationController.publish',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: request.body?.userId,
          notificationType: request.body?.type,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Publish multiple notifications in batch
   * POST /notifications/publish/batch
   */
  async publishBatch(
    request: FastifyRequest<{
      Body: schemas.PublishBatchNotificationsRequest
    }>,
  ): Promise<schemas.PublishBatchNotificationsResponse> {
    try {
      const _context = RequestContext.fromHeaders(request)

      // Authorization: This endpoint is designed for internal services to create notifications
      // Same authorization logic as single publish endpoint

      const requestBody = request.body

      if (
        !requestBody.notifications ||
        !Array.isArray(requestBody.notifications)
      ) {
        throw ErrorFactory.validationError(
          { notifications: ['Notifications array is required'] },
          {
            correlationId: request.id,
            source: 'NotificationController.publishBatch',
            suggestion: 'Provide an array of notifications',
          },
        )
      }

      // Convert to command format
      const command: PublishBatchNotificationsCommand = {
        notifications: requestBody.notifications.map((notification) => ({
          userId: notification.userId,
          type: notification.type as NotificationType,
          title: notification.title,
          body: notification.body,
          ...(notification.icon && { icon: notification.icon }),
          ...(notification.entityRef && { entityRef: notification.entityRef }),
          ...(notification.expiresAt && {
            expiresAt: new Date(notification.expiresAt),
          }),
        })),
      }

      await this.publishBatchHandler.execute(command)

      const response: schemas.PublishBatchNotificationsResponse = {
        success: true,
        count: command.notifications.length,
      }

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error publishing batch notifications:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        batchSize: request.body?.notifications?.length,
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(
        error,
        'Failed to publish batch notifications',
        {
          source: 'NotificationController.publishBatch',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            batchSize: request.body?.notifications?.length,
          },
          suggestion: 'Please check your input and try again',
        },
      )
    }
  }

  /**
   * Mark a notification as read
   * PATCH /notifications/:notificationId/read
   */
  async markAsRead(
    request: FastifyRequest<{ Params: { notificationId: string } }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const { notificationId } = request.params

      if (!context.userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to mark notifications as read',
          {
            correlationId: request.id,
            source: 'NotificationController.markAsRead',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      await this.markAsReadHandler.execute({
        notificationId,
        userId: context.userId,
        userRole: context.role,
      })

      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error marking notification as read:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.headers['x-user-id'],
        notificationId: request.params.notificationId,
        correlationId: request.id,
      })

      // Handle specific error types
      if (
        error.name === 'ValidationError' ||
        error.name === 'UnauthorizedError' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error // Pass through these errors
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(
        error,
        'Failed to mark notification as read',
        {
          source: 'NotificationController.markAsRead',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            userId: request.headers['x-user-id'],
            notificationId: request.params.notificationId,
          },
          suggestion: 'Please try again later',
        },
      )
    }
  }

  /**
   * Mark all notifications as read for a user
   * PUT /notifications/read-all
   */
  async markAllAsRead(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)

      if (!context.userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to mark notifications as read',
          {
            correlationId: request.id,
            source: 'NotificationController.markAllAsRead',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      await this.markAllAsReadHandler.execute({
        userId: context.userId,
        userRole: context.role,
      })

      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error marking all notifications as read:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.headers['x-user-id'],
        correlationId: request.id,
      })

      // Handle specific error types
      if (
        error.name === 'ValidationError' ||
        error.name === 'UnauthorizedError'
      ) {
        throw error // Pass through these errors
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(
        error,
        'Failed to mark all notifications as read',
        {
          source: 'NotificationController.markAllAsRead',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            userId: request.headers['x-user-id'],
          },
          suggestion: 'Please try again later',
        },
      )
    }
  }

  /**
   * Mark multiple notifications as read
   * PUT /notifications/batch/read
   */
  async markBatchAsRead(
    request: FastifyRequest<{
      Body: schemas.MarkBatchNotificationsAsReadRequest
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)

      if (!context.userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to mark notifications as read',
          {
            correlationId: request.id,
            source: 'NotificationController.markBatchAsRead',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      const requestBody = request.body

      if (
        !requestBody.notificationIds ||
        !Array.isArray(requestBody.notificationIds)
      ) {
        throw ErrorFactory.validationError(
          { notificationIds: ['Notification IDs array is required'] },
          {
            correlationId: request.id,
            source: 'NotificationController.markBatchAsRead',
            suggestion: 'Provide an array of notification IDs',
          },
        )
      }

      if (requestBody.notificationIds.length === 0) {
        throw ErrorFactory.validationError(
          { notificationIds: ['At least one notification ID is required'] },
          {
            correlationId: request.id,
            source: 'NotificationController.markBatchAsRead',
            suggestion: 'Provide at least one notification ID',
          },
        )
      }

      await this.markBatchAsReadHandler.execute({
        notificationIds: requestBody.notificationIds,
        userId: context.userId,
      })

      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error marking batch notifications as read:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.headers['x-user-id'],
        notificationCount: request.body?.notificationIds?.length,
        correlationId: request.id,
      })

      // Handle specific error types
      if (
        error.name === 'ValidationError' ||
        error.name === 'UnauthorizedError' ||
        error.name === 'ForbiddenError' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error // Pass through these errors
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(
        error,
        'Failed to mark batch notifications as read',
        {
          source: 'NotificationController.markBatchAsRead',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            userId: request.headers['x-user-id'],
            notificationCount: request.body?.notificationIds?.length,
          },
          suggestion: 'Please try again later',
        },
      )
    }
  }
}
