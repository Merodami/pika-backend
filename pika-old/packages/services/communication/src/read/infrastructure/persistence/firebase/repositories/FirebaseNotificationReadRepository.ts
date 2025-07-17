import { Notification } from '@communication-read/domain/entities/Notification.js'
import { NotificationReadRepositoryPort } from '@communication-read/domain/ports/NotificationReadRepositoryPort.js'
import {
  EntityReference,
  NotificationType,
} from '@communication-shared/types/index.js'
import { FirebaseAdminClient } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'
import { get, set } from 'lodash-es'

export class FirebaseNotificationReadRepository
  implements NotificationReadRepositoryPort
{
  private readonly db: Firestore

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
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

    return Notification.fromFirebaseData(notificationId, doc.data())
  }

  async findByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean
      types?: NotificationType[]
      limit?: number
      offset?: number
    },
  ): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
  }> {
    let query = this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')

    // Build base query for filtering
    let baseQuery = query

    if (options?.unreadOnly) {
      query = query.where('read', '==', false)
      baseQuery = baseQuery.where('read', '==', false)
    }

    if (options?.types && options.types.length > 0) {
      query = query.where('type', 'in', options.types)
      baseQuery = baseQuery.where('type', 'in', options.types)
    }

    // Get total count with filters
    const totalSnapshot = await baseQuery.count().get()
    const total = totalSnapshot.data().count

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    const snapshot = await query.get()
    const notifications = snapshot.docs.map((doc) =>
      Notification.fromFirebaseData(doc.id, doc.data()),
    )

    // Get unread count (without other filters)
    const unreadSnapshot = await this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get()

    const unreadCount = unreadSnapshot.data().count

    return {
      notifications,
      total,
      unreadCount,
    }
  }

  async findByEntity(
    entityRef: EntityReference,
    options?: {
      userId?: string
      limit?: number
      offset?: number
    },
  ): Promise<{
    notifications: Notification[]
    total: number
  }> {
    let query = this.db
      .collectionGroup('items')
      .where('entityRef.entityType', '==', entityRef.entityType)
      .where('entityRef.entityId', '==', entityRef.entityId)
      .orderBy('createdAt', 'desc')

    // Count total first
    const totalSnapshot = await query.count().get()
    const total = totalSnapshot.data().count

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    const snapshot = await query.get()

    let notifications = snapshot.docs.map((doc) =>
      Notification.fromFirebaseData(doc.id, doc.data()),
    )

    // Filter by userId if specified
    if (options?.userId) {
      notifications = notifications.filter((n) => n.userId === options.userId)
    }

    return {
      notifications,
      total,
    }
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

  async getNotificationStats(userId: string): Promise<{
    total: number
    unread: number
    byType: Record<NotificationType, number>
  }> {
    const allNotificationsSnapshot = await this.db
      .collection('communication')
      .doc('notifications')
      .collection('data')
      .where('userId', '==', userId)
      .get()

    let total = 0
    let unread = 0

    const byType: Record<string, number> = {}

    for (const doc of allNotificationsSnapshot.docs) {
      const data = doc.data()

      total++

      if (!data.read) {
        unread++
      }

      const type = data.type as NotificationType

      set(byType, type, (get(byType, type) || 0) + 1)
    }

    return {
      total,
      unread,
      byType: byType as Record<NotificationType, number>,
    }
  }
}
