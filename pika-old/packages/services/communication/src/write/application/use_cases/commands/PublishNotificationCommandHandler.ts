import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { Notification } from '@communication-write/domain/entities/Notification.js'
import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { MultilingualText } from '@pika/types-core'

export interface PublishNotificationCommand {
  userId: string
  type: NotificationType
  title: string | object
  body: string | object
  icon?: string
  entityRef?: EntityReference
  expiresAt?: Date
}

export interface PublishNotificationResult {
  success: boolean
  notificationId?: string
  error?: string
}

export class PublishNotificationCommandHandler {
  constructor(
    private readonly notificationRepository: NotificationWriteRepositoryPort,
  ) {}

  async execute(
    command: PublishNotificationCommand,
  ): Promise<PublishNotificationResult> {
    try {
      logger.debug('Publishing notification', {
        userId: command.userId,
        type: command.type,
      })

      const notification = Notification.create({
        userId: command.userId,
        type: command.type,
        title: this.ensureMultilingualText(command.title),
        body: this.ensureMultilingualText(command.body),
        icon: command.icon,
        entityRef: command.entityRef,
        expiresAt: command.expiresAt,
      })

      await this.notificationRepository.save(notification)

      logger.debug('Notification published successfully', {
        notificationId: notification.id,
        userId: command.userId,
      })

      return {
        success: true,
        notificationId: notification.id,
      }
    } catch (error) {
      logger.error('Failed to publish notification', {
        error: error.message,
        userId: command.userId,
        type: command.type,
      })

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        throw error // Re-throw validation errors as-is
      }

      throw ErrorFactory.databaseError(
        'notification_publish',
        'Failed to publish notification',
        error,
        {
          correlationId: `publish-${command.userId}`,
          source: 'PublishNotificationCommandHandler.execute',
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
