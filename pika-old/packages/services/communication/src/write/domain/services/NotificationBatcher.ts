import { PushNotificationPayload } from '@communication-shared/types/index.js'
import { logger } from '@pika/shared'

import { Message } from '../entities/Message.js'
import { Notification } from '../entities/Notification.js'

interface BufferedNotification {
  message: Message
  notification: Notification
  timestamp: Date
}

export interface PushNotificationQueue {
  enqueue(payload: PushNotificationPayload): Promise<void>
}

export class NotificationBatcher {
  private messageBuffer = new Map<string, BufferedNotification[]>()
  private flushTimers = new Map<string, NodeJS.Timeout>()

  constructor(
    private readonly pushQueue: PushNotificationQueue,
    private readonly windowMs: number = 30000, // 30 seconds
  ) {}

  async bufferMessage(
    userId: string,
    message: Message,
    notification: Notification,
  ): Promise<void> {
    try {
      const buffer = this.messageBuffer.get(userId) || []

      buffer.push({
        message,
        notification,
        timestamp: new Date(),
      })
      this.messageBuffer.set(userId, buffer)

      if (buffer.length === 1) {
        // First message - set timer to flush
        const timer = setTimeout(() => this.flushBuffer(userId), this.windowMs)

        this.flushTimers.set(userId, timer)

        logger.debug('Started notification batching window', {
          userId,
          windowMs: this.windowMs,
        })
      } else {
        logger.debug('Added message to notification batch', {
          userId,
          batchSize: buffer.length,
          messageId: message.id,
        })
      }
    } catch (error) {
      logger.error('Failed to buffer notification', {
        error,
        userId,
        messageId: message.id,
      })

      // Fallback: send immediate notification
      await this.sendImmediateNotification(userId, message, notification)
    }
  }

  private async flushBuffer(userId: string): Promise<void> {
    try {
      const buffer = this.messageBuffer.get(userId) || []

      this.messageBuffer.delete(userId)

      const timer = this.flushTimers.get(userId)

      if (timer) {
        clearTimeout(timer)
        this.flushTimers.delete(userId)
      }

      if (buffer.length === 0) {
        return
      }

      if (buffer.length === 1) {
        // Single notification
        await this.sendSingleNotification(userId, buffer[0])
      } else {
        // Grouped notification
        await this.sendGroupedNotification(userId, buffer)
      }

      logger.info('Flushed notification batch', {
        userId,
        messageCount: buffer.length,
        type: buffer.length === 1 ? 'single' : 'grouped',
      })
    } catch (error) {
      logger.error('Failed to flush notification buffer', {
        error,
        userId,
      })
    }
  }

  private async sendSingleNotification(
    userId: string,
    buffered: BufferedNotification,
  ): Promise<void> {
    const { message, notification } = buffered

    await this.pushQueue.enqueue({
      userId,
      title:
        typeof notification.title === 'string'
          ? notification.title
          : notification.title?.en || 'New message',
      body:
        typeof notification.body === 'string'
          ? notification.body
          : notification.body?.en || 'You have a new message',
      data: {
        type: 'message',
        notificationId: notification.id,
        conversationId: message.conversationId,
        messageId: message.id,
      },
      priority: 'NORMAL',
    })
  }

  private async sendGroupedNotification(
    userId: string,
    buffer: BufferedNotification[],
  ): Promise<void> {
    const firstNotification = buffer[0].notification
    const conversationId = buffer[0].message.conversationId
    const senderName =
      typeof firstNotification.title === 'string'
        ? firstNotification.title
        : firstNotification.title?.en || 'Someone'

    await this.pushQueue.enqueue({
      userId,
      title: senderName,
      body: `${buffer.length} new messages`,
      data: {
        type: 'messages',
        conversationId,
        messageCount: buffer.length,
        messageIds: buffer.map((b) => b.message.id),
      },
      priority: 'NORMAL',
    })
  }

  private async sendImmediateNotification(
    userId: string,
    message: Message,
    notification: Notification,
  ): Promise<void> {
    await this.pushQueue.enqueue({
      userId,
      title:
        typeof notification.title === 'string'
          ? notification.title
          : notification.title?.en || 'New message',
      body:
        typeof notification.body === 'string'
          ? notification.body
          : notification.body?.en || 'You have a new message',
      data: {
        type: 'message',
        notificationId: notification.id,
        conversationId: message.conversationId,
        messageId: message.id,
      },
      priority: 'HIGH', // Immediate notifications get higher priority
    })
  }

  // Cleanup method to clear expired timers
  cleanup(): void {
    for (const [userId, timer] of this.flushTimers) {
      clearTimeout(timer)
      this.flushTimers.delete(userId)

      // Flush any remaining messages
      const buffer = this.messageBuffer.get(userId)

      if (buffer && buffer.length > 0) {
        this.flushBuffer(userId)
      }
    }
  }
}
