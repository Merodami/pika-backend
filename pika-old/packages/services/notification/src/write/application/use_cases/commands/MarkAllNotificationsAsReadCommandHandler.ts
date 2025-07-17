import type { NotificationServicePort } from '@notification-write/application/ports/NotificationServicePort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { UserRole } from '@pika/types-core'

export interface MarkAllNotificationsAsReadCommand {
  userId: string
  userRole: UserRole
}

export class MarkAllNotificationsAsReadCommandHandler {
  constructor(private readonly notificationService: NotificationServicePort) {}

  async execute(command: MarkAllNotificationsAsReadCommand): Promise<void> {
    logger.info('Marking all notifications as read', {
      userId: command.userId,
    })

    try {
      await this.notificationService.markAllAsRead(command.userId)

      logger.info('Successfully marked all notifications as read', {
        userId: command.userId,
      })
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error as Error, {
        userId: command.userId,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to mark all notifications as read',
        {
          source: 'MarkAllNotificationsAsReadCommandHandler.execute',
        },
      )
    }
  }
}
