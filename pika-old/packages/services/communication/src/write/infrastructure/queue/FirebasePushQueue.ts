import { PushNotificationPayload } from '@communication-shared/types/index.js'
import { logger } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'
import { v4 as uuidv4 } from 'uuid'

import { PushNotificationQueue } from '../../domain/services/NotificationBatcher.js'

interface QueuedNotification extends PushNotificationPayload {
  id: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  attempts: number
  lastAttempt?: Date
  createdAt: Date
}

export class FirebasePushQueue implements PushNotificationQueue {
  private readonly collection: string = 'push_queue'

  constructor(private readonly firestore: Firestore) {}

  async enqueue(payload: PushNotificationPayload): Promise<void> {
    try {
      const id = uuidv4()
      const queuedNotification: QueuedNotification = {
        ...payload,
        id,
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
      }

      await this.firestore
        .collection(this.collection)
        .doc(id)
        .set(queuedNotification)

      logger.debug('Queued push notification', {
        id,
        userId: payload.userId,
        title: payload.title,
      })
    } catch (error) {
      logger.error('Failed to queue push notification', {
        error,
        payload,
      })
      throw error
    }
  }

  async dequeue(limit: number = 10): Promise<QueuedNotification[]> {
    try {
      const snapshot = await this.firestore
        .collection(this.collection)
        .where('status', '==', 'PENDING')
        .orderBy('createdAt', 'asc')
        .limit(limit)
        .get()

      const notifications: QueuedNotification[] = []

      snapshot.forEach((doc) => {
        notifications.push({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          lastAttempt: doc.data().lastAttempt?.toDate(),
        } as QueuedNotification)
      })

      return notifications
    } catch (error) {
      logger.error('Failed to dequeue push notifications', { error })

      return []
    }
  }

  async markAsSent(id: string): Promise<void> {
    try {
      await this.firestore.collection(this.collection).doc(id).update({
        status: 'SENT',
        lastAttempt: new Date(),
      })
    } catch (error) {
      logger.error('Failed to mark notification as sent', { error, id })
    }
  }

  async markAsFailed(id: string, attempts: number): Promise<void> {
    try {
      const maxAttempts = 3
      const status = attempts >= maxAttempts ? 'FAILED' : 'PENDING'

      await this.firestore.collection(this.collection).doc(id).update({
        status,
        attempts,
        lastAttempt: new Date(),
      })
    } catch (error) {
      logger.error('Failed to mark notification as failed', { error, id })
    }
  }

  async cleanup(olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date()

      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const snapshot = await this.firestore
        .collection(this.collection)
        .where('createdAt', '<', cutoffDate)
        .get()

      if (snapshot.empty) {
        return 0
      }

      const batch = this.firestore.batch()

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      logger.info('Cleaned up old push notifications', {
        count: snapshot.docs.length,
        olderThanDays,
      })

      return snapshot.docs.length
    } catch (error) {
      logger.error('Failed to cleanup push notifications', { error })

      return 0
    }
  }
}
