import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { firestore } from '@/lib/firebase/config'
import type { UserRole } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notifications.store'

export interface FirebaseNotification {
  id?: string
  userId: string
  userRole: UserRole
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>
  updatedAt?: Timestamp | ReturnType<typeof serverTimestamp>
  metadata?: Record<string, any>
}

class RealtimeNotificationService {
  private unsubscribe: (() => void) | null = null
  private userId: string | null = null
  private userRole: UserRole | null = null

  /**
   * Initialize real-time notifications for a user
   */
  startListening(userId: string, userRole: UserRole) {
    // Check if firestore is available
    if (!firestore) {
      console.error('Firestore not initialized')

      return
    }

    // Stop any existing listener
    this.stopListening()

    this.userId = userId
    this.userRole = userRole

    // Create query for user notifications
    const notificationsRef = collection(firestore, 'notifications')
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('userRole', '==', userRole),
      orderBy('createdAt', 'desc')
    )

    // Set up real-time listener
    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Update Zustand store
        const store = useNotificationStore.getState()

        // Process new notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = {
              id: change.doc.id,
              ...change.doc.data(),
            } as FirebaseNotification

            // Add to store and show toast if it's new
            if (!notification.read) {
              store.addNotification({
                title: notification.title,
                message: notification.message,
                type: notification.type,
              })
            }
          }
        })

        // Note: The current notification store doesn't track unread count
        // This could be added to the store interface if needed
      },
      (error) => {
        console.error('Error listening to notifications:', error)
      }
    )
  }

  /**
   * Stop listening to notifications
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.userId = null
    this.userRole = null
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    if (!this.userId || !firestore) return

    try {
      const notificationRef = doc(firestore, 'notifications', notificationId)

      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (!this.userId || !firestore) return

    try {
      const notificationsRef = collection(firestore, 'notifications')
      const q = query(
        notificationsRef,
        where('userId', '==', this.userId),
        where('read', '==', false)
      )

      const snapshot = await getDocs(q)
      const batch = writeBatch(firestore!)

      snapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          read: true,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string) {
    if (!this.userId || !firestore) return

    try {
      const notificationRef = doc(firestore, 'notifications', notificationId)

      await deleteDoc(notificationRef)
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  /**
   * Send a test notification (for development)
   */
  async sendTestNotification() {
    if (!this.userId || !this.userRole || !firestore) return

    try {
      const notificationsRef = collection(firestore, 'notifications')

      await addDoc(notificationsRef, {
        userId: this.userId,
        userRole: this.userRole,
        title: 'Test Notification',
        message: 'This is a test notification from Firebase',
        type: 'info',
        read: false,
        createdAt: serverTimestamp(),
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      } as FirebaseNotification)
    } catch (error) {
      console.error('Error sending test notification:', error)
      throw error
    }
  }
}

// Export singleton instance
export const realtimeNotificationService = new RealtimeNotificationService()
