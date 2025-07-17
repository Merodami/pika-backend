import {
  Notification,
  NotificationType,
} from '@notification-write/domain/index.js'
import { ErrorFactory, logger } from '@pika/shared'

import type { NotificationServicePort } from '../../ports/NotificationServicePort.js'

export interface PublishBatchNotificationsCommand {
  notifications: Array<{
    userId: string
    type: NotificationType
    title: string
    body: string
    icon?: string
    entityRef?: {
      entityType: string
      entityId: string
    }
    expiresAt?: Date | string
  }>
}

/**
 * Command handler for publishing multiple notifications in batch
 * Implements business logic and orchestrates the batch notification creation process
 */
export class PublishBatchNotificationsCommandHandler {
  constructor(private readonly notificationService: NotificationServicePort) {}

  /**
   * Executes the publish batch notifications command
   * Creates multiple notifications and publishes them through the notification service
   */
  async execute(command: PublishBatchNotificationsCommand): Promise<void> {
    try {
      if (!command.notifications || command.notifications.length === 0) {
        throw ErrorFactory.validationError(
          { notifications: ['At least one notification is required'] },
          {
            source: 'PublishBatchNotificationsCommandHandler.execute',
            suggestion: 'Provide at least one notification to publish',
          },
        )
      }

      // Validate batch size
      const MAX_BATCH_SIZE = 500

      if (command.notifications.length > MAX_BATCH_SIZE) {
        throw ErrorFactory.validationError(
          {
            notifications: [
              `Batch size exceeds maximum of ${MAX_BATCH_SIZE} notifications`,
            ],
          },
          {
            source: 'PublishBatchNotificationsCommandHandler.execute',
            suggestion: `Split your batch into multiple requests of ${MAX_BATCH_SIZE} or fewer notifications`,
          },
        )
      }

      // Create notification entities
      const notifications: Notification[] = []
      const validationErrors: Map<number, string> = new Map()

      for (let i = 0; i < command.notifications.length; i++) {
        try {
          const notificationData = command.notifications.at(i)

          if (!notificationData) continue

          const notification = Notification.create({
            userId: notificationData.userId,
            type: notificationData.type,
            title: notificationData.title,
            body: notificationData.body,
            icon: notificationData.icon,
            entityRef: notificationData.entityRef,
            expiresAt: notificationData.expiresAt
              ? typeof notificationData.expiresAt === 'string'
                ? new Date(notificationData.expiresAt)
                : notificationData.expiresAt
              : undefined,
          })

          notifications.push(notification)
        } catch (error) {
          validationErrors.set(i, (error as Error).message)
        }
      }

      // If there are validation errors, throw them all at once
      if (validationErrors.size > 0) {
        const errorMessages: string[] = []

        validationErrors.forEach((message, index) => {
          errorMessages.push(`Notification ${index}: ${message}`)
        })

        throw ErrorFactory.validationError(
          { notifications: errorMessages },
          {
            source: 'PublishBatchNotificationsCommandHandler.execute',
            suggestion: 'Fix validation errors in the specified notifications',
            metadata: {
              totalNotifications: command.notifications.length,
              failedCount: Object.keys(validationErrors).length,
              failedIndices: Object.keys(validationErrors).map(Number),
            },
          },
        )
      }

      // Publish all notifications in batch
      await this.notificationService.publishBatch(notifications)

      logger.info('Batch notifications published successfully', {
        count: notifications.length,
        userIds: [...new Set(notifications.map((n) => n.userId))].length,
        types: [...new Set(notifications.map((n) => n.type))],
      })
    } catch (error) {
      if ((error as any).name === 'ValidationError') {
        throw error
      }

      throw ErrorFactory.fromError(
        error,
        'Failed to publish batch notifications',
        {
          source: 'PublishBatchNotificationsCommandHandler.execute',
          suggestion: 'Check notification data and try again',
          metadata: {
            batchSize: command.notifications?.length || 0,
          },
        },
      )
    }
  }
}
