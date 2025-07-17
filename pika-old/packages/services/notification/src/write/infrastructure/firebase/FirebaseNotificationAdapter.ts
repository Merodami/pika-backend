import type { NotificationServicePort } from '@notification-write/application/index.js'
import type { Notification } from '@notification-write/domain/index.js'
import { ErrorFactory, logger } from '@pika/shared'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

import { PushNotificationService } from '../push/PushNotificationService.js'

export class FirebaseNotificationAdapter implements NotificationServicePort {
  private readonly db: admin.firestore.Firestore
  private readonly fcm: admin.messaging.Messaging
  private readonly pushService: PushNotificationService

  constructor(db: admin.firestore.Firestore, fcm: admin.messaging.Messaging) {
    this.db = db
    this.fcm = fcm
    this.pushService = new PushNotificationService()
  }

  async publish(notification: Notification): Promise<void> {
    try {
      const notificationData = notification.toPersistence()

      // Save to Firestore
      const docRef = this.db
        .collection('users')
        .doc(notification.userId)
        .collection('notifications')
        .doc(notification.id)

      await docRef.set(notificationData)

      logger.info('Notification saved to Firestore', {
        notificationId: notification.id,
        userId: notification.userId,
      })

      // Send push notification (best effort - don't fail if push fails)
      try {
        await this.sendPushNotificationToUser(notification)
      } catch (pushError) {
        logger.warn(
          'Failed to send push notification, but notification was saved',
          {
            error: (pushError as Error).message,
            notificationId: notification.id,
            userId: notification.userId,
          },
        )
        // Don't throw - notification was saved successfully
      }
    } catch (error) {
      logger.error('Failed to save notification to Firestore', error as Error, {
        notificationId: notification.id,
        userId: notification.userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to save notification', {
        source: 'FirebaseNotificationAdapter.publish',
      })
    }
  }

  async publishBatch(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return

    // Firestore has a limit of 500 operations per batch
    const BATCH_SIZE = 500
    const chunks: Notification[][] = []

    // Split notifications into chunks
    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      chunks.push(notifications.slice(i, i + BATCH_SIZE))
    }

    try {
      // Process each chunk
      for (const chunk of chunks) {
        const batch = this.db.batch()

        for (const notification of chunk) {
          const notificationData = notification.toPersistence()
          const docRef = this.db
            .collection('users')
            .doc(notification.userId)
            .collection('notifications')
            .doc(notification.id)

          batch.set(docRef, notificationData)
        }

        await batch.commit()

        // Send push notifications for this chunk (parallel execution)
        await Promise.allSettled(
          chunk.map((notification) =>
            this.sendPushNotificationToUser(notification),
          ),
        )
      }

      logger.info('Batch notifications saved to Firestore', {
        count: notifications.length,
        chunks: chunks.length,
      })
    } catch (error) {
      logger.error(
        'Failed to save batch notifications to Firestore',
        error as Error,
        {
          count: notifications.length,
        },
      )
      throw ErrorFactory.fromError(
        error,
        'Failed to save batch notifications',
        {
          source: 'FirebaseNotificationAdapter.publishBatch',
        },
      )
    }
  }

  private async sendPushNotificationToUser(
    notification: Notification,
  ): Promise<void> {
    try {
      // Get user's FCM tokens from Firestore
      const userDoc = await this.db
        .collection('users')
        .doc(notification.userId)
        .get()

      if (!userDoc.exists) {
        logger.warn('User document not found for push notification', {
          userId: notification.userId,
          notificationId: notification.id,
        })

        return
      }

      const userData = userDoc.data()
      const fcmTokens = userData?.fcmTokens as string[] | undefined

      if (!fcmTokens || fcmTokens.length === 0) {
        logger.info('No FCM tokens found for user', {
          userId: notification.userId,
          notificationId: notification.id,
        })

        return
      }

      // Send push notification
      const result = await this.pushService.sendToTokens(fcmTokens, {
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          ...(notification.entityRef && {
            entityType: notification.entityRef.entityType,
            entityId: notification.entityRef.entityId,
          }),
        },
        badge: 1,
      })

      // Clean up invalid tokens
      if (result.failedTokens.length > 0) {
        await this.cleanupInvalidTokens(
          notification.userId,
          result.failedTokens,
        )
      }

      logger.info('Push notification sent successfully', {
        userId: notification.userId,
        notificationId: notification.id,
        successCount: result.successCount,
        failureCount: result.failureCount,
      })
    } catch (error) {
      logger.error('Failed to send push notification', error as Error, {
        userId: notification.userId,
        notificationId: notification.id,
      })
      // Don't throw error to avoid breaking the notification save operation
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notificationRef = this.db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)

      // Check if notification exists
      const doc = await notificationRef.get()

      if (!doc.exists) {
        throw ErrorFactory.resourceNotFound('Notification', notificationId, {
          source: 'FirebaseNotificationAdapter.markAsRead',
          suggestion: 'Ensure the notification exists and belongs to you',
        })
      }

      // Update the read status
      await notificationRef.update({
        read: true,
        readAt: FieldValue.serverTimestamp(),
      })

      logger.info('Notification marked as read', {
        notificationId,
        userId,
      })
    } catch (error) {
      if ((error as any).name === 'ResourceNotFoundError') {
        throw error
      }

      logger.error('Failed to mark notification as read', error as Error, {
        notificationId,
        userId,
      })

      throw ErrorFactory.fromError(
        error,
        'Failed to mark notification as read',
        {
          source: 'FirebaseNotificationAdapter.markAsRead',
          metadata: { notificationId, userId },
        },
      )
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const batch = this.db.batch()

      const unreadNotifications = await this.db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .where('read', '==', false)
        .get()

      if (unreadNotifications.empty) {
        logger.info('No unread notifications to mark as read', { userId })

        return
      }

      unreadNotifications.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()

      logger.info('All notifications marked as read', {
        userId,
        count: unreadNotifications.size,
      })
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error as Error, {
        userId,
      })

      throw ErrorFactory.fromError(
        error,
        'Failed to mark all notifications as read',
        {
          source: 'FirebaseNotificationAdapter.markAllAsRead',
          metadata: { userId },
        },
      )
    }
  }

  async getNotification(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    try {
      const doc = await this.db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .get()

      if (!doc.exists) {
        return null
      }

      const data = doc.data()

      // Check if the notification belongs to the user
      if (data?.userId !== userId) {
        return null
      }

      // Import Notification class dynamically to avoid circular dependency
      const { Notification } = await import(
        '@notification-write/domain/index.js'
      )

      return Notification.fromPersistence({
        id: doc.id,
        ...data,
      } as any)
    } catch (error) {
      logger.error('Failed to get notification', error as Error, {
        notificationId,
        userId,
      })

      throw ErrorFactory.fromError(error, 'Failed to get notification', {
        source: 'FirebaseNotificationAdapter.getNotification',
        metadata: { notificationId, userId },
      })
    }
  }

  private async cleanupInvalidTokens(
    userId: string,
    invalidTokens: string[],
  ): Promise<void> {
    try {
      const userRef = this.db.collection('users').doc(userId)
      const userDoc = await userRef.get()

      if (!userDoc.exists) return

      const userData = userDoc.data()
      const currentTokens = userData?.fcmTokens as string[] | undefined

      if (!currentTokens) return

      // Remove invalid tokens
      const validTokens = currentTokens.filter(
        (token) => !invalidTokens.includes(token),
      )

      await userRef.update({
        fcmTokens: validTokens,
        lastTokenCleanup: new Date(),
      })

      logger.info('Cleaned up invalid FCM tokens', {
        userId,
        removedTokens: invalidTokens.length,
        remainingTokens: validTokens.length,
      })
    } catch (error) {
      logger.error('Failed to cleanup invalid FCM tokens', error as Error, {
        userId,
        invalidTokensCount: invalidTokens.length,
      })
    }
  }
}
