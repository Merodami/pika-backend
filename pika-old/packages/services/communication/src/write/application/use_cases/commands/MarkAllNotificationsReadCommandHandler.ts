import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

export interface MarkAllNotificationsReadCommand {
  userId: string
}

export interface MarkAllNotificationsReadResult {
  success: boolean
  count: number
  error?: string
}

export class MarkAllNotificationsReadCommandHandler {
  constructor(
    private readonly notificationRepository: NotificationWriteRepositoryPort,
  ) {}

  async execute(
    command: MarkAllNotificationsReadCommand,
  ): Promise<MarkAllNotificationsReadResult> {
    try {
      logger.debug('Marking all notifications as read', {
        userId: command.userId,
      })

      const count = await this.notificationRepository.markAllAsRead(
        command.userId,
      )

      logger.debug('All notifications marked as read successfully', {
        userId: command.userId,
        count,
      })

      return {
        success: true,
        count,
      }
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        error: error.message,
        userId: command.userId,
      })

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        throw error // Re-throw validation errors as-is
      }

      throw ErrorFactory.databaseError(
        'notification_mark_all_read',
        'Failed to mark all notifications as read',
        error,
        {
          correlationId: `mark-all-read-${command.userId}`,
          source: 'MarkAllNotificationsReadCommandHandler.execute',
        },
      )
    }
  }
}
