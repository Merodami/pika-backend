import {
  MessageType,
  NotificationType,
} from '@communication-shared/types/index.js'
import { logger } from '@pika/shared'
import { MultilingualText } from '@pika/types-core'

import { Conversation } from '../entities/Conversation.js'
import { Message } from '../entities/Message.js'
import { Notification } from '../entities/Notification.js'
import { NotificationWriteRepositoryPort } from '../ports/NotificationWriteRepositoryPort.js'
import { NotificationBatcher } from './NotificationBatcher.js'

export interface UserProfile {
  id: string
  name: string
  type: 'CUSTOMER' | 'PROVIDER'
}

export interface NotificationOrchestrator {
  handleMessageSent(message: Message, conversation: Conversation): Promise<void>
}

export class NotificationOrchestrator implements NotificationOrchestrator {
  constructor(
    private readonly notificationRepo: NotificationWriteRepositoryPort,
    private readonly batcher: NotificationBatcher,
    private readonly userService: {
      getUserProfile: (userId: string) => Promise<UserProfile | null>
    },
  ) {}

  async handleMessageSent(
    message: Message,
    conversation: Conversation,
  ): Promise<void> {
    try {
      // Find recipient (the participant who is not the sender)
      const recipientId = conversation.participantIds.find(
        (id) => id !== message.senderId,
      )

      if (!recipientId) {
        logger.warn('No recipient found for message', {
          messageId: message.id,
          conversationId: conversation.id,
        })

        return
      }

      // Skip notification if recipient has muted the conversation
      if (conversation.mutedBy.includes(recipientId)) {
        logger.debug('Skipping notification for muted conversation', {
          messageId: message.id,
          conversationId: conversation.id,
          recipientId,
        })

        return
      }

      // Get sender profile for better notification content
      const senderProfile = await this.userService.getUserProfile(
        message.senderId,
      )
      const senderName = senderProfile?.name || 'Someone'

      // Create notification
      const notification = await this.createMessageNotification(
        recipientId,
        message,
        conversation,
        senderName,
      )

      // Add to batching queue for push notifications
      await this.batcher.bufferMessage(recipientId, message, notification)

      logger.info('Message notification created', {
        messageId: message.id,
        conversationId: conversation.id,
        notificationId: notification.id,
        recipientId,
      })
    } catch (error) {
      logger.error('Failed to handle message notification', {
        error,
        messageId: message.id,
        conversationId: conversation.id,
      })
      // Don't throw - message sending should not fail because of notification issues
    }
  }

  private async createMessageNotification(
    recipientId: string,
    message: Message,
    conversation: Conversation,
    senderName: string,
  ): Promise<Notification> {
    const title = this.createMultilingualTitle(senderName)
    const body = this.createMultilingualBody(message)

    const notification = Notification.create({
      userId: recipientId,
      type: NotificationType.MESSAGE_RECEIVED,
      title,
      body,
      entityRef: {
        entityType: 'conversation',
        entityId: conversation.id,
      },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    return this.notificationRepo.create(notification)
  }

  private createMultilingualTitle(senderName: string): MultilingualText {
    return {
      en: senderName,
      es: senderName,
      gn: senderName,
      pt: senderName,
    }
  }

  private createMultilingualBody(message: Message): MultilingualText {
    const content = this.truncateMessage(message)

    return {
      en: content,
      es: content,
      gn: content,
      pt: content,
    }
  }

  private truncateMessage(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.length > 100
          ? message.content.substring(0, 97) + '...'
          : message.content
      case MessageType.IMAGE:
        return '📷 Image'
      case MessageType.FILE:
        return `📎 ${message.metadata?.fileName || 'File'}`
      case MessageType.SYSTEM:
        return message.content
      default:
        return 'New message'
    }
  }
}
