import type { messaging } from 'firebase-admin'
import { get } from 'lodash-es'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Notification, NotificationType } from '../../domain/index.js'
import { FirebaseNotificationAdapter } from './FirebaseNotificationAdapter.js'

// Mock Firestore types
type MockDocumentReference = {
  id: string
  set: vi.Mock
  update: vi.Mock
  delete: vi.Mock
}

type MockCollectionReference = {
  doc: vi.Mock<[string], MockDocumentReference>
  add: vi.Mock
}

type MockFirestore = {
  collection: vi.Mock<[string], MockCollectionReference>
  batch: vi.Mock
}

describe('FirebaseNotificationAdapter', () => {
  let adapter: FirebaseNotificationAdapter
  let mockFirestore: MockFirestore
  let mockMessaging: messaging.Messaging
  let mockCollection: MockCollectionReference
  let mockDoc: MockDocumentReference

  beforeEach(() => {
    // Create mock document reference
    mockDoc = {
      id: 'mock-doc-id',
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }

    // Create mock collection reference for notifications
    const notificationsCollection = {
      doc: vi.fn().mockReturnValue(mockDoc),
      add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    }

    // Create user document reference with nested collection
    const userDoc = {
      id: 'user-doc-id',
      collection: vi.fn().mockReturnValue(notificationsCollection),
    }

    // Create users collection
    const usersCollection = {
      doc: vi.fn().mockReturnValue(userDoc),
    }

    // Create mock Firestore
    mockFirestore = {
      collection: vi.fn().mockImplementation((path: string) => {
        if (path === 'users') {
          return usersCollection
        }

        return mockCollection
      }),
      batch: vi.fn().mockReturnValue({
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }),
    }

    // Store references for assertions
    mockCollection = notificationsCollection

    // Create mock messaging
    mockMessaging = {} as any

    adapter = new FirebaseNotificationAdapter(
      mockFirestore as any,
      mockMessaging,
    )
  })

  describe('publish', () => {
    it('should save notification to correct Firestore path', async () => {
      const notification = createTestNotification()

      await adapter.publish(notification)

      // Verify collection path
      expect(mockFirestore.collection).toHaveBeenCalledWith('users')

      // Verify document was saved with correct ID
      expect(mockCollection.doc).toHaveBeenCalledWith(notification.id)

      // Verify document creation with date serialization
      expect(mockDoc.set).toHaveBeenCalledWith({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        entityRef: undefined,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        expiresAt: notification.expiresAt?.toISOString(),
      })
    })

    it('should include entity reference when provided', async () => {
      const notification = createTestNotification({
        entityRef: {
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174001',
        },
      })

      await adapter.publish(notification)

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          entityRef: {
            entityType: 'voucher',
            entityId: '123e4567-e89b-12d3-a456-426614174001',
          },
        }),
      )
    })

    it('should include expiration date when provided', async () => {
      const expiresAt = new Date('2025-12-31T23:59:59Z')
      const notification = createTestNotification({ expiresAt })

      await adapter.publish(notification)

      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          expiresAt: expiresAt.toISOString(),
        }),
      )
    })

    it('should handle Firestore errors', async () => {
      const notification = createTestNotification()
      const error = new Error('Firestore connection failed')

      mockDoc.set = vi.fn().mockRejectedValue(error)

      await expect(adapter.publish(notification)).rejects.toThrow(
        'Firestore connection failed',
      )
    })

    it('should not include undefined optional fields', async () => {
      const notification = createTestNotification({
        icon: undefined,
        entityRef: undefined,
        expiresAt: undefined,
      })

      await adapter.publish(notification)

      const savedData = mockDoc.set.mock.calls[0][0]

      expect(savedData.icon).toBeUndefined()
      expect(savedData.entityRef).toBeUndefined()
      expect(savedData.expiresAt).toBeUndefined()
    })
  })

  describe('publishBatch', () => {
    it('should save multiple notifications in batch', async () => {
      const notifications = [
        createTestNotification({ userId: 'user1' }),
        createTestNotification({ userId: 'user2' }),
        createTestNotification({ userId: 'user3' }),
      ]

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      mockFirestore.batch = vi.fn().mockReturnValue(mockBatch)

      await adapter.publishBatch(notifications)

      expect(mockFirestore.batch).toHaveBeenCalled()
      expect(mockBatch.set).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalled()
    })

    it('should handle empty batch', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      mockFirestore.batch = vi.fn().mockReturnValue(mockBatch)

      await adapter.publishBatch([])

      // Empty batch should not create batch or call commit
      expect(mockFirestore.batch).not.toHaveBeenCalled()
    })

    it('should process notifications in chunks of 500', async () => {
      // Create 1200 notifications
      const notifications = Array.from({ length: 1200 }, (_, i) =>
        createTestNotification({ userId: `user${i}` }),
      )

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      mockFirestore.batch = vi.fn().mockReturnValue(mockBatch)

      await adapter.publishBatch(notifications)

      // Should create 3 batches (500 + 500 + 200)
      expect(mockFirestore.batch).toHaveBeenCalledTimes(3)
      expect(mockBatch.commit).toHaveBeenCalledTimes(3)
      expect(mockBatch.set).toHaveBeenCalledTimes(1200)
    })

    it('should handle batch errors', async () => {
      const notifications = [createTestNotification()]
      const error = new Error('Batch commit failed')

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValue(error),
      }

      mockFirestore.batch = vi.fn().mockReturnValue(mockBatch)

      await expect(adapter.publishBatch(notifications)).rejects.toThrow(
        'Batch commit failed',
      )
    })

    it('should create correct document references for each user', async () => {
      const notifications = [
        createTestNotification({ userId: 'user1', id: 'notif1' }),
        createTestNotification({ userId: 'user1', id: 'notif2' }),
        createTestNotification({ userId: 'user2', id: 'notif3' }),
      ]

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      }

      mockFirestore.batch = vi.fn().mockReturnValue(mockBatch)

      // Create separate mock docs for each notification
      const mockDocs = {
        notif1: { id: 'notif1' },
        notif2: { id: 'notif2' },
        notif3: { id: 'notif3' },
      }

      mockCollection.doc = vi
        .fn()
        .mockImplementation((id: string) => get(mockDocs, id, mockDoc))

      await adapter.publishBatch(notifications)

      // Verify each notification is saved with correct reference
      expect(mockBatch.set).toHaveBeenCalledTimes(3)
      expect(mockCollection.doc).toHaveBeenCalledWith('notif1')
      expect(mockCollection.doc).toHaveBeenCalledWith('notif2')
      expect(mockCollection.doc).toHaveBeenCalledWith('notif3')
    })
  })
})

// Helper function to create test notifications
function createTestNotification(overrides?: Partial<any>): Notification {
  const defaultData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'Test Notification',
    body: 'This is a test notification',
    read: false,
    createdAt: new Date(),
    ...overrides,
  }

  // Use Object.create to create a notification-like object
  // since we can't use the private constructor
  return Object.assign(Object.create(Notification.prototype), defaultData)
}
