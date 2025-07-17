import type { NotificationServicePort } from '@notification-write/application/ports/NotificationServicePort.js'
import { ErrorFactory, logger, NotAuthorizedError } from '@pika/shared'

export interface MarkBatchNotificationsAsReadCommand {
  notificationIds: string[]
  userId: string
}

export class MarkBatchNotificationsAsReadCommandHandler {
  constructor(private readonly notificationService: NotificationServicePort) {}

  async execute(command: MarkBatchNotificationsAsReadCommand): Promise<void> {
    logger.info('Marking batch notifications as read', {
      userId: command.userId,
      count: command.notificationIds.length,
    })

    try {
      // Validate that all notification IDs belong to the user
      const notifications = await Promise.all(
        command.notificationIds.map((id) =>
          this.notificationService.getNotification(id, command.userId),
        ),
      )

      // Check if any notifications don't belong to the user
      const invalidIds = command.notificationIds.filter(
        (id, index) =>
          index >= 0 &&
          index < notifications.length &&
          !notifications.at(index),
      )

      if (invalidIds.length > 0) {
        throw new NotAuthorizedError(
          'Some notifications do not belong to the user',
          {
            source: 'MarkBatchNotificationsAsReadCommandHandler.execute',
            metadata: { invalidIds },
          },
        )
      }

      // Mark all valid notifications as read
      await Promise.all(
        command.notificationIds.map((id) =>
          this.notificationService.markAsRead(id, command.userId),
        ),
      )

      logger.info('Successfully marked batch notifications as read', {
        userId: command.userId,
        count: command.notificationIds.length,
      })
    } catch (error) {
      logger.error(
        'Failed to mark batch notifications as read',
        error as Error,
        {
          userId: command.userId,
          notificationIds: command.notificationIds,
        },
      )

      // Re-throw NotAuthorizedError as-is
      if ((error as any).name === 'NotAuthorizedError') {
        throw error
      }

      throw ErrorFactory.fromError(
        error,
        'Failed to mark batch notifications as read',
        {
          source: 'MarkBatchNotificationsAsReadCommandHandler.execute',
        },
      )
    }
  }
}
