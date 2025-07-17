import { FirebaseAdminClient } from '@pika/shared'

import { NotificationServicePort } from '../../domain/ports/NotificationServicePort.js'

export class FirebaseNotificationAdapter implements NotificationServicePort {
  private readonly db = FirebaseAdminClient.getInstance().firestore

  async notifyNewMessage(params: {
    recipientId: string
    senderId: string
    conversationId: string
    messageId: string
    content: string
  }): Promise<void> {
    // Create notification in the same way as the notification service does
    const notificationRef = this.db
      .collection('users')
      .doc(params.recipientId)
      .collection('notifications')
      .doc()

    await notificationRef.set({
      userId: params.recipientId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      body: params.content,
      entityRef: {
        entityType: 'message',
        entityId: params.messageId,
      },
      data: {
        conversationId: params.conversationId,
        senderId: params.senderId,
      },
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // The notification service's Firebase function will handle push notifications
  }
}
