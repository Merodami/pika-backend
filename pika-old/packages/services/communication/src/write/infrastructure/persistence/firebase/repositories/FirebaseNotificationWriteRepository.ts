import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { Notification } from '@communication-write/domain/entities/Notification.js'
import { NotificationWriteRepositoryPort } from '@communication-write/domain/ports/NotificationWriteRepositoryPort.js'
import { FirebaseAdminClient } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'

export class FirebaseNotificationWriteRepository
  implements NotificationWriteRepositoryPort
{
  private readonly db: Firestore

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
  }

  async create(notification: Notification): Promise<Notification> {
    const notificationRef = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .doc(notification.id)

    const notificationData = {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      entityRef: notification.entityRef,
      read: notification.read,
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
    }

    await notificationRef.set(notificationData)

    return notification
  }

  async update(notification: Notification): Promise<Notification> {
    const notificationRef = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .doc(notification.id)

    const updateData = {
      type: notification.type,
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      entityRef: notification.entityRef,
      read: notification.read,
      expiresAt: notification.expiresAt,
    }

    await notificationRef.update(updateData)

    return notification
  }

  async findById(
    userId: string,
    notificationId: string,
  ): Promise<Notification | null> {
    const doc = await this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .doc(notificationId)
      .get()

    if (!doc.exists) {
      return null
    }

    return this.fromFirebaseData(notificationId, doc.data()!)
  }

  async findByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean
      types?: NotificationType[]
      limit?: number
      offset?: number
    },
  ): Promise<Notification[]> {
    let query = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')

    if (options?.unreadOnly) {
      query = query.where('read', '==', false)
    }

    if (options?.types && options.types.length > 0) {
      query = query.where('type', 'in', options.types)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    const snapshot = await query.get()

    return snapshot.docs.map((doc) => this.fromFirebaseData(doc.id, doc.data()))
  }

  async findByEntity(
    entityRef: EntityReference,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    },
  ): Promise<Notification[]> {
    let query = this.db
      .collectionGroup('data')
      .where('entityRef.entityType', '==', entityRef.entityType)
      .where('entityRef.entityId', '==', entityRef.entityId)
      .orderBy('createdAt', 'desc')

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    const snapshot = await query.get()
    const notifications = snapshot.docs.map((doc) =>
      this.fromFirebaseData(doc.id, doc.data()),
    )

    // Filter by userId if specified
    if (options?.userId) {
      return notifications.filter((n) => n.userId === options.userId)
    }

    return notifications
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .doc(notificationId)

    await notificationRef.update({ read: true })
  }

  async save(notification: Notification): Promise<Notification> {
    return this.create(notification)
  }

  async saveBatch(notifications: Notification[]): Promise<void> {
    const batch = this.db.batch()

    for (const notification of notifications) {
      const notificationRef = this.db
        .collection('communication')
        .doc('notifications')
        .collection('data')
        .doc(notification.id)

      const notificationData = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        entityRef: notification.entityRef,
        read: notification.read,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
      }

      batch.set(notificationRef, notificationData)
    }

    await batch.commit()
  }

  async markAllAsRead(
    userId: string,
    types?: NotificationType[],
  ): Promise<number> {
    let query = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .where('read', '==', false)

    if (types && types.length > 0) {
      query = query.where('type', 'in', types)
    }

    const batch = this.db.batch()
    const snapshot = await query.get()

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()

    return snapshot.size
  }

  async markBatchAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<number> {
    const batch = this.db.batch()

    let count = 0

    for (const notificationId of notificationIds) {
      const notificationRef = this.db
        .collection('notifications')
        .doc(userId)
        .collection('items')
        .doc(notificationId)

      batch.update(notificationRef, { read: true })
      count++
    }

    await batch.commit()

    return count
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const notificationRef = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .doc(notificationId)

    await notificationRef.delete()
  }

  async deleteExpired(): Promise<number> {
    const cutoffDate = new Date()
    const batch = this.db.batch()

    let deletedCount = 0

    // Use collectionGroup to find expired notifications across all users
    const snapshot = await this.db
      .collectionGroup('data')
      .where('expiresAt', '<', cutoffDate)
      .get()

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
      deletedCount++
    })

    if (deletedCount > 0) {
      await batch.commit()
    }

    return deletedCount
  }

  async getUnreadCount(
    userId: string,
    types?: NotificationType[],
  ): Promise<number> {
    let query = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .where('read', '==', false)

    if (types && types.length > 0) {
      query = query.where('type', 'in', types)
    }

    const snapshot = await query.count().get()

    return snapshot.data().count
  }

  private fromFirebaseData(id: string, data: any): Notification {
    const notificationData = {
      id,
      userId: data.userId,
      type: data.type as NotificationType,
      title: data.title,
      body: data.body,
      icon: data.icon,
      entityRef: data.entityRef,
      read: data.read,
      createdAt: data.createdAt?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate(),
    }

    return Notification.reconstitute(notificationData)
  }
}
