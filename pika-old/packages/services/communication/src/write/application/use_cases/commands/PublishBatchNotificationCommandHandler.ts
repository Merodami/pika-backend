import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { Notification } from '@communication-write/domain/entities/Notification.js'
import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { MultilingualText } from '@pika/types-core'

export interface BatchNotificationItem {
  userId: string
  type: NotificationType
  title: string | object
  body: string | object
  icon?: string
  entityRef?: EntityReference
  expiresAt?: Date
}

export interface PublishBatchNotificationCommand {
  notifications: BatchNotificationItem[]
}

export interface PublishBatchNotificationResult {
  success: boolean
  count: number
  error?: string
}

export class PublishBatchNotificationCommandHandler {
  constructor(
    private readonly notificationRepository: NotificationWriteRepositoryPort,
  ) {}

  async execute(
    command: PublishBatchNotificationCommand,
  ): Promise<PublishBatchNotificationResult> {
    try {
      logger.debug('Publishing batch notifications', {
        count: command.notifications.length,
      })

      const notifications: Notification[] = []

      // Create all notification entities first (validate all before saving any)
      for (const item of command.notifications) {
        const notification = Notification.create({
          userId: item.userId,
          type: item.type,
          title: this.ensureMultilingualText(item.title),
          body: this.ensureMultilingualText(item.body),
          icon: item.icon,
          entityRef: item.entityRef,
          expiresAt: item.expiresAt,
        })

        notifications.push(notification)
      }

      // Save all notifications in batch
      await this.notificationRepository.saveBatch(notifications)

      logger.debug('Batch notifications published successfully', {
        count: notifications.length,
      })

      return {
        success: true,
        count: notifications.length,
      }
    } catch (error) {
      logger.error('Failed to publish batch notifications', {
        error: error.message,
        count: command.notifications.length,
      })

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        throw error // Re-throw validation errors as-is
      }

      throw ErrorFactory.databaseError(
        'notification_batch_publish',
        'Failed to publish batch notifications',
        error,
        {
          correlationId: `batch-publish-${Date.now()}`,
          source: 'PublishBatchNotificationCommandHandler.execute',
        },
      )
    }
  }

  private ensureMultilingualText(value: any): MultilingualText {
    if (!value || typeof value !== 'object') {
      return { en: String(value || ''), es: '', gn: '' }
    }

    return {
      en: String(value.en || ''),
      es: String(value.es || ''),
      gn: String(value.gn || ''),
    }
  }
}
