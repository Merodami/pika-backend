import { logger } from '@pika/shared'
import { firestore, messaging } from 'firebase-admin'
import { get } from 'lodash-es'

interface NotificationData {
  id: string
  userId: string
  type: string
  title: string
  body: string
  icon?: string
  entityRef?: {
    entityType: string
    entityId: string
  }
  read: boolean
  createdAt: string
  expiresAt?: string
}

interface UserTokens {
  fcmTokens?: string[]
}

export async function pushOnNewNotification(
  snapshot: firestore.DocumentSnapshot,
  context: any,
) {
  const { userId, notificationId } = context.params
  const notification = snapshot.data() as NotificationData

  logger.info('New notification created', {
    userId,
    notificationId,
    type: notification.type,
  })

  try {
    // Get user's FCM tokens
    const userDoc = await firestore().collection('users').doc(userId).get()

    if (!userDoc.exists) {
      logger.warn('User not found', { userId })

      return
    }

    const userData = userDoc.data() as UserTokens
    const fcmTokens = userData.fcmTokens || []

    if (fcmTokens.length === 0) {
      logger.info('No FCM tokens found for user', { userId })

      return
    }

    // Prepare FCM message
    const message: messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        userId: notification.userId,
        ...(notification.entityRef && {
          entityType: notification.entityRef.entityType,
          entityId: notification.entityRef.entityId,
        }),
      },
      android: {
        priority: 'high',
        notification: {
          icon: notification.icon || 'ic_notification',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    }

    // Send push notification
    const response = await messaging().sendEachForMulticast(message)

    logger.info('Push notification sent', {
      userId,
      notificationId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = []

      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code

          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(get(fcmTokens, idx))
          }
        }
      })

      if (invalidTokens.length > 0) {
        const validTokens = fcmTokens.filter(
          (token) => !invalidTokens.includes(token),
        )

        await userDoc.ref.update({ fcmTokens: validTokens })
        logger.info('Removed invalid FCM tokens', {
          userId,
          removedCount: invalidTokens.length,
        })
      }
    }
  } catch (error) {
    logger.error('Failed to send push notification', error as Error, {
      userId,
      notificationId,
    })
  }
}
