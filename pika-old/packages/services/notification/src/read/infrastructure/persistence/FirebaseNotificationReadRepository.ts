import type { NotificationRead } from '@notification-read/domain/entities/Notification.js'
import type {
  NotificationQueryOptions,
  NotificationReadRepositoryPort,
} from '@notification-read/domain/port/NotificationReadRepositoryPort.js'
import { logger } from '@pika/shared'
import * as admin from 'firebase-admin'

export class FirebaseNotificationReadRepository
  implements NotificationReadRepositoryPort
{
  constructor(private readonly db: admin.firestore.Firestore) {}

  async findByUser(
    options: NotificationQueryOptions,
  ): Promise<NotificationRead[]> {
    let query = this.db
      .collection('users')
      .doc(options.userId)
      .collection('notifications')
      .orderBy('createdAt', 'desc')

    if (options.unreadOnly) {
      query = query.where('read', '==', false)
    }

    if (options.types && options.types.length > 0) {
      query = query.where('type', 'in', options.types)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    const snapshot = await query.get()

    return snapshot.docs.map((doc) => this.mapToNotificationRead(doc))
  }

  async findById(id: string, userId: string): Promise<NotificationRead | null> {
    const doc = await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .doc(id)
      .get()

    if (!doc.exists) {
      return null
    }

    return this.mapToNotificationRead(doc)
  }

  async countUnread(userId: string): Promise<number> {
    const snapshot = await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false)
      .count()
      .get()

    return snapshot.data().count
  }

  async countByUser(
    userId: string,
    options?: { unreadOnly?: boolean; types?: string[] },
  ): Promise<number> {
    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('notifications') as admin.firestore.Query

    if (options?.unreadOnly) {
      query = query.where('read', '==', false)
    }

    if (options?.types && options.types.length > 0) {
      query = query.where('type', 'in', options.types)
    }

    const snapshot = await query.count().get()

    return snapshot.data().count
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .doc(id)
      .update({ read: true })

    logger.info('Notification marked as read', { id, userId })
  }

  async markAllAsRead(userId: string): Promise<void> {
    const batch = this.db.batch()

    const unreadNotifications = await this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('read', '==', false)
      .get()

    unreadNotifications.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()

    logger.info('All notifications marked as read', {
      userId,
      count: unreadNotifications.size,
    })
  }

  async findByEntity(
    userId: string,
    entityType: string,
    entityId: string,
    limit: number,
    offset: number,
  ): Promise<NotificationRead[]> {
    const query = this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('entityRef.entityType', '==', entityType)
      .where('entityRef.entityId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)

    const snapshot = await query.get()

    return snapshot.docs.map((doc) => this.mapToNotificationRead(doc))
  }

  async countByEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<number> {
    const query = this.db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .where('entityRef.entityType', '==', entityType)
      .where('entityRef.entityId', '==', entityId)

    const snapshot = await query.count().get()

    return snapshot.data().count
  }

  private mapToNotificationRead(
    doc: admin.firestore.DocumentSnapshot,
  ): NotificationRead {
    const data = doc.data()!

    return {
      id: doc.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      icon: data.icon,
      entityRef: data.entityRef,
      read: data.read,
      createdAt:
        data.createdAt instanceof Date
          ? data.createdAt
          : new Date(data.createdAt),
      expiresAt: data.expiresAt
        ? data.expiresAt instanceof Date
          ? data.expiresAt
          : new Date(data.expiresAt)
        : undefined,
    }
  }
}
