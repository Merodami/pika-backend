import { ErrorFactory, logger } from '@pika/shared'
import { UserRole } from '@pika/types-core'

import type { NotificationServicePort } from '../../ports/NotificationServicePort.js'

export interface MarkNotificationAsReadCommand {
  notificationId: string
  userId: string
  userRole: UserRole
}

export class MarkNotificationAsReadCommandHandler {
  constructor(private readonly notificationService: NotificationServicePort) {}

  async execute(command: MarkNotificationAsReadCommand): Promise<void> {
    logger.info('Marking notification as read', {
      notificationId: command.notificationId,
      userId: command.userId,
    })

    try {
      // Validate command
      if (!command.notificationId || command.notificationId.trim() === '') {
        throw ErrorFactory.validationError(
          { notificationId: ['Notification ID is required'] },
          {
            source: 'MarkNotificationAsReadCommandHandler.execute',
            suggestion: 'Provide a valid notification ID',
          },
        )
      }

      if (!command.userId || command.userId.trim() === '') {
        throw ErrorFactory.validationError(
          { userId: ['User ID is required'] },
          {
            source: 'MarkNotificationAsReadCommandHandler.execute',
            suggestion: 'Authentication required',
          },
        )
      }

      // Mark the notification as read
      // The adapter will handle ownership validation
      await this.notificationService.markAsRead(
        command.notificationId,
        command.userId,
      )

      logger.info('Notification marked as read successfully', {
        notificationId: command.notificationId,
        userId: command.userId,
      })
    } catch (error) {
      // Pass through known errors
      if (
        (error as any).name === 'ValidationError' ||
        (error as any).name === 'ResourceNotFoundError'
      ) {
        throw error
      }

      logger.error('Failed to mark notification as read', error as Error, {
        notificationId: command.notificationId,
        userId: command.userId,
      })

      throw ErrorFactory.fromError(
        error,
        'Failed to mark notification as read',
        {
          source: 'MarkNotificationAsReadCommandHandler.execute',
          metadata: {
            notificationId: command.notificationId,
            userId: command.userId,
          },
        },
      )
    }
  }
}
