import {
  Notification,
  NotificationType,
} from '@notification-write/domain/index.js'
import { ErrorFactory, logger } from '@pika/shared'

import type { NotificationServicePort } from '../../ports/NotificationServicePort.js'

export interface PublishNotificationCommand {
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
}

/**
 * Command handler for publishing notifications
 * Implements business logic and orchestrates the notification creation process
 */
export class PublishNotificationCommandHandler {
  constructor(private readonly notificationService: NotificationServicePort) {}

  /**
   * Executes the publish notification command
   * Creates a notification and publishes it through the notification service
   */
  async execute(command: PublishNotificationCommand): Promise<void> {
    try {
      const notification = Notification.create({
        userId: command.userId,
        type: command.type,
        title: command.title,
        body: command.body,
        icon: command.icon,
        entityRef: command.entityRef,
        expiresAt: command.expiresAt
          ? typeof command.expiresAt === 'string'
            ? new Date(command.expiresAt)
            : command.expiresAt
          : undefined,
      })

      await this.notificationService.publish(notification)

      logger.info('Notification published successfully', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to publish notification', {
        source: 'PublishNotificationCommandHandler.execute',
        suggestion: 'Check notification data and try again',
        metadata: {
          userId: command.userId,
          type: command.type,
        },
      })
    }
  }
}
