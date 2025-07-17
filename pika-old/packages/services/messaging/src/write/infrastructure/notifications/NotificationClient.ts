import { NOTIFICATION_API_URL } from '@pika/environment'
import { logger } from '@pika/shared'

import { NotificationServicePort } from '../../domain/ports/NotificationServicePort.js'

export class NotificationClient implements NotificationServicePort {
  private readonly notificationServiceUrl: string

  constructor(notificationServiceUrl: string = NOTIFICATION_API_URL) {
    this.notificationServiceUrl = notificationServiceUrl
  }

  async notifyNewMessage(params: {
    recipientId: string
    senderId: string
    conversationId: string
    messageId: string
    content: string
  }): Promise<void> {
    try {
      const response = await fetch(
        `${this.notificationServiceUrl}/notifications/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: params.recipientId,
            type: 'MESSAGE_RECEIVED',
            title: 'New Message',
            body: params.content,
            entityRef: {
              entityType: 'message',
              entityId: params.messageId,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          `Failed to send notification: ${response.status} ${response.statusText}. ${errorData.message || ''}`,
        )
      }

      logger.info('Notification sent successfully via HTTP', {
        recipientId: params.recipientId,
        conversationId: params.conversationId,
        messageId: params.messageId,
      })
    } catch (error) {
      logger.error('Failed to send notification via HTTP', error as Error, {
        recipientId: params.recipientId,
        conversationId: params.conversationId,
        messageId: params.messageId,
        notificationServiceUrl: this.notificationServiceUrl,
      })

      // Don't throw the error to avoid breaking message sending
      // The message should still be sent even if notification fails
    }
  }
}
