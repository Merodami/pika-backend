import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

export interface MarkNotificationReadCommand {
  notificationId: string
  userId: string
}

export interface MarkNotificationReadResult {
  success: boolean
  error?: string
}

export class MarkNotificationReadCommandHandler {
  constructor(
    private readonly notificationRepository: NotificationWriteRepositoryPort,
  ) {}

  async execute(
    command: MarkNotificationReadCommand,
  ): Promise<MarkNotificationReadResult> {
    try {
      logger.debug('Marking notification as read', {
        notificationId: command.notificationId,
        userId: command.userId,
      })

      await this.notificationRepository.markAsRead(
        command.notificationId,
        command.userId,
      )

      logger.debug('Notification marked as read successfully', {
        notificationId: command.notificationId,
        userId: command.userId,
      })

      return {
        success: true,
      }
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error.message,
        notificationId: command.notificationId,
        userId: command.userId,
      })

      if (
        error.name?.includes('NotFoundError') ||
        error.message?.includes('not found')
      ) {
        return {
          success: false,
          error: 'Notification not found',
        }
      }

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        throw error // Re-throw validation errors as-is
      }

      throw ErrorFactory.databaseError(
        'notification_mark_read',
        'Failed to mark notification as read',
        error,
        {
          correlationId: `mark-read-${command.notificationId}`,
          source: 'MarkNotificationReadCommandHandler.execute',
        },
      )
    }
  }
}
