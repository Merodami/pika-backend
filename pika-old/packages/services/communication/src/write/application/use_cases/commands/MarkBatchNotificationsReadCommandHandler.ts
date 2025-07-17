import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

export interface MarkBatchNotificationsReadCommand {
  notificationIds: string[]
  userId: string
}

export interface MarkBatchNotificationsReadResult {
  success: boolean
  count: number
  error?: string
}

export class MarkBatchNotificationsReadCommandHandler {
  constructor(
    private readonly notificationRepository: NotificationWriteRepositoryPort,
  ) {}

  async execute(
    command: MarkBatchNotificationsReadCommand,
  ): Promise<MarkBatchNotificationsReadResult> {
    try {
      logger.debug('Marking batch notifications as read', {
        userId: command.userId,
        count: command.notificationIds.length,
      })

      const count = await this.notificationRepository.markBatchAsRead(
        command.notificationIds,
        command.userId,
      )

      logger.debug('Batch notifications marked as read successfully', {
        userId: command.userId,
        requestedCount: command.notificationIds.length,
        actualCount: count,
      })

      return {
        success: true,
        count,
      }
    } catch (error) {
      logger.error('Failed to mark batch notifications as read', {
        error: error.message,
        userId: command.userId,
        count: command.notificationIds.length,
      })

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        throw error // Re-throw validation errors as-is
      }

      throw ErrorFactory.databaseError(
        'notification_mark_batch_read',
        'Failed to mark batch notifications as read',
        error,
        {
          correlationId: `mark-batch-read-${command.userId}`,
          source: 'MarkBatchNotificationsReadCommandHandler.execute',
        },
      )
    }
  }
}
