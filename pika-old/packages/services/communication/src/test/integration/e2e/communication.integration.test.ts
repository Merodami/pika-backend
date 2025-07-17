/**
 * Integration tests for the Communication Service API
 *
 * Tests all endpoints with Firebase emulator using Supertest.
 */
import { vi } from 'vitest'

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared
})
// --- END MOCKING CONFIGURATION ---

import { startCommunicationService } from '@communication/app.js'
import {
  ConversationType,
  MessageType,
  NotificationType,
} from '@communication-shared/types/index.js'
import { FIREBASE_EMULATOR_CONFIG } from '@pika/environment'
import { FirebaseAdminClient, logger } from '@pika/shared'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { FastifyInstance } from 'fastify'
import type { Firestore } from 'firebase-admin/firestore'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Communication Service Integration Tests', () => {
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let customerClient: AuthenticatedRequestClient
  let adminClient: AuthenticatedRequestClient
  let firestore: Firestore

  beforeAll(async () => {
    // Debug: Check if INTERNAL_API_TOKEN is loaded
    logger.debug(
      'INTERNAL_API_TOKEN:',
      process.env.INTERNAL_API_TOKEN?.substring(0, 20) + '...',
    )
    // Ensure Firebase emulator is configured
    if (!FIREBASE_EMULATOR_CONFIG.useEmulator) {
      throw new Error(
        'Firebase emulator must be enabled for integration tests. ' +
          'Set FIREBASE_EMULATOR=true in your environment.',
      )
    }

    // Get Firebase instance (will connect to emulator)
    const admin = FirebaseAdminClient.getInstance()

    firestore = admin.firestore

    // Create the app
    app = await startCommunicationService()

    await app.ready()

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Note: Communication service uses Firebase, not Prisma, so we pass null
    logger.debug('Setting up E2E authentication for communication...')
    await authHelper.createAllTestUsers(null) // No Prisma for communication service

    // Get authenticated clients for different user types
    customerClient = await authHelper.getCustomerClient(null)
    adminClient = await authHelper.getAdminClient(null)

    logger.debug('E2E authentication setup complete for communication')
  })

  beforeEach(async () => {
    // Comprehensive cleanup - clear everything
    try {
      // Clear all conversations and their messages
      const conversationsSnapshot = await firestore
        .collection('communication')
        .doc('conversations')
        .collection('data')
        .get()

      for (const conversationDoc of conversationsSnapshot.docs) {
        // Delete all messages in this conversation
        const messagesSnapshot = await firestore
          .collection('communication')
          .doc('messages')
          .collection('data')
          .where('conversationId', '==', conversationDoc.id)
          .get()

        const batch = firestore.batch()

        messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

        // Delete the conversation itself
        batch.delete(conversationDoc.ref)

        if (!messagesSnapshot.empty || conversationsSnapshot.docs.length > 0) {
          await batch.commit()
        }
      }

      // Clear all user notifications
      const usersSnapshot = await firestore
        .collection('communication')
        .doc('notifications')
        .collection('data')
        .get()

      if (!usersSnapshot.empty) {
        const batch = firestore.batch()

        usersSnapshot.docs.forEach((doc) => batch.delete(doc.ref))
        await batch.commit()
      }
    } catch (error) {
      console.warn('Error during test cleanup:', error)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up communication integration test resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    // Properly close the Fastify app to avoid SSH2 errors
    if (app) {
      try {
        await app.close()
      } catch (error) {
        console.warn('Error closing app:', error)
      }
    }

    logger.debug('Communication integration test resources cleaned up.')
  }, 30000) // Increase timeout for cleanup

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await customerClient.get('/health').expect(200)

      expect(response.body.status).toBe('healthy')
      expect(response.body).toHaveProperty('services')
      expect(response.body.services).toBeInstanceOf(Array)
      expect(response.body.services.length).toBeGreaterThan(0)
    })
  })

  describe('POST /conversations', () => {
    it('should create a conversation and store it in Firebase', async () => {
      const otherUserId = uuid()
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId

      const conversationData = {
        participant_ids: [customerUserId, otherUserId],
        type: ConversationType.CUSTOMER_PROVIDER,
        metadata: {
          providerId: otherUserId,
          customerId: customerUserId,
        },
      }

      const response = await customerClient.post(
        '/conversations',
        conversationData,
      )

      if (response.status !== 201) {
        console.error('Error response:', response.status, response.body)
        throw new Error(
          `Expected 201, got ${response.status}: ${JSON.stringify(response.body)}`,
        )
      }

      expect(response.body).toHaveProperty('id')

      const { id: conversationId } = response.body

      // Verify conversation was actually created in Firebase
      const conversationDoc = await firestore
        .collection('conversations')
        .doc(conversationId)
        .get()

      expect(conversationDoc.exists).toBe(true)

      const data = conversationDoc.data()!

      expect(data.participantIds).toContain(customerUserId)
      expect(data.participantIds).toContain(otherUserId)
    })

    it('should reject invalid conversation data', async () => {
      const invalidData = {
        participant_ids: ['single-user'], // Only one participant
      }

      await customerClient.post('/conversations', invalidData).expect(400)
    })
  })

  describe('GET /conversations', () => {
    it('should return empty list when no conversations exist', async () => {
      const response = await customerClient.get('/conversations').expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should support pagination parameters', async () => {
      const response = await customerClient
        .get('/conversations?page=1&limit=10')
        .expect(200)

      expect(response.body.pagination).toHaveProperty('limit', 10)
      expect(response.body.pagination).toHaveProperty('page', 1)
      expect(response.body.pagination).toHaveProperty('total')
      expect(typeof response.body.pagination.total).toBe('number')
    })
  })

  describe('POST /conversations/:conversationId/messages', () => {
    it('should send a message to a conversation', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId
      const otherUserId = uuid()

      // Create a conversation first
      const convResponse = await customerClient
        .post('/conversations', {
          participant_ids: [customerUserId, otherUserId],
          type: ConversationType.CUSTOMER_PROVIDER,
          metadata: {
            providerId: otherUserId,
            customerId: customerUserId,
          },
        })
        .expect(201)

      const conversationId = convResponse.body.id

      // Send a message
      const messageData = {
        type: MessageType.TEXT,
        content: 'Hello, world!',
      }

      const response = await customerClient
        .post(`/conversations/${conversationId}/messages`, messageData)
        .expect(201)

      expect(response.body).toHaveProperty('id')

      // Verify message was stored in Firebase
      const messageDoc = await firestore
        .collection('communication')
        .doc('messages')
        .collection('data')
        .doc(response.body.id)
        .get()

      expect(messageDoc.exists).toBe(true)

      const messageData2 = messageDoc.data()!

      expect(messageData2.content).toBe('Hello, world!')
      expect(messageData2.type).toBe(MessageType.TEXT)
    })

    it('should reject message to non-existent conversation', async () => {
      const messageData = {
        type: MessageType.TEXT,
        content: 'Hello, world!',
      }

      await customerClient
        .post('/conversations/non-existent-id/messages', messageData)
        .expect(400)
    })
  })

  describe('GET /conversations/:conversationId/messages', () => {
    it('should retrieve messages from a conversation', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId
      const otherUserId = uuid()

      // Create a conversation
      const convResponse = await customerClient
        .post('/conversations', {
          participant_ids: [customerUserId, otherUserId],
          type: ConversationType.CUSTOMER_PROVIDER,
          metadata: {
            providerId: otherUserId,
            customerId: customerUserId,
          },
        })
        .expect(201)

      const conversationId = convResponse.body.id

      // Add messages to the conversation
      for (let i = 0; i < 3; i++) {
        await customerClient
          .post(`/conversations/${conversationId}/messages`, {
            type: MessageType.TEXT,
            content: `Test message ${i + 1}`,
          })
          .expect(201)
      }

      // Retrieve messages
      const response = await customerClient
        .get(`/conversations/${conversationId}/messages`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3)

      // Verify messages content
      response.body.data.forEach((msg: any, index: number) => {
        expect(msg.content).toBe(`Test message ${index + 1}`)
        expect(msg.type).toBe(MessageType.TEXT)
      })
    })

    it('should return 404 for non-existent conversation', async () => {
      await customerClient.get(`/conversations/${uuid()}/messages`).expect(404)
    })
  })

  describe('POST /conversations/:conversationId/messages/read', () => {
    it('should mark messages as read', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId
      const otherUserId = uuid()

      // Create a conversation
      const convResponse = await customerClient
        .post('/conversations', {
          participant_ids: [customerUserId, otherUserId],
          type: ConversationType.CUSTOMER_PROVIDER,
          metadata: {
            providerId: otherUserId,
            customerId: customerUserId,
          },
        })
        .expect(201)

      const conversationId = convResponse.body.id

      // Send a message
      const msgResponse = await customerClient
        .post(`/conversations/${conversationId}/messages`, {
          type: MessageType.TEXT,
          content: 'Test message',
        })
        .expect(201)

      const messageId = msgResponse.body.id

      // Mark as read
      const response = await customerClient
        .post(`/conversations/${conversationId}/messages/read`, {
          message_ids: [messageId],
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })

    it('should require valid message IDs', async () => {
      await customerClient
        .post('/conversations/some-id/messages/read', {
          message_ids: [],
        })
        .expect(400)
    })
  })

  describe('Notification Endpoints', () => {
    const createTestNotification = (overrides?: Partial<any>) => ({
      user_id: uuid(),
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Test Notification',
      body: 'This is a test notification',
      ...overrides,
    })

    describe('POST /notifications/publish', () => {
      it('should publish a notification successfully', async () => {
        const notification = createTestNotification()

        const response = await adminClient
          .post('/notifications/publish')
          .send(notification)
          .expect(200)

        expect(response.body).toEqual({ success: true })

        // Verify notification was saved to Firebase
        const notificationsSnapshot = await firestore
          .collection('communication')
          .doc('notifications')
          .collection('data')
          .where('userId', '==', notification.user_id)
          .get()

        expect(notificationsSnapshot.size).toBe(1)

        const savedNotification = notificationsSnapshot.docs[0].data()

        expect(savedNotification).toMatchObject({
          userId: notification.user_id,
          type: notification.type,
          read: false,
        })
        expect(savedNotification.id).toBeDefined()
        expect(savedNotification.createdAt).toBeDefined()
      })

      it('should validate notification type enum', async () => {
        const notification = createTestNotification({
          type: 'INVALID_TYPE',
        })

        const response = await adminClient
          .post('/notifications/publish')
          .send(notification)
          .expect(400)

        expect(response.body.error).toBeDefined()
        expect(response.body.error.code).toBe('VALIDATION_ERROR')
      })

      it('should validate required fields', async () => {
        const invalidNotifications = [
          { ...createTestNotification(), user_id: undefined },
          { ...createTestNotification(), type: undefined },
          { ...createTestNotification(), title: undefined },
          { ...createTestNotification(), body: undefined },
        ]

        for (const invalidNotification of invalidNotifications) {
          const response = await adminClient
            .post('/notifications/publish')
            .send(invalidNotification)
            .expect(400)

          expect(response.body.error).toBeDefined()
          expect(response.body.error.code).toBe('VALIDATION_ERROR')
        }
      })
    })

    describe('GET /notifications', () => {
      it('should return user notifications with pagination', async () => {
        // Get the actual customer user ID from the JWT token
        const customerToken = await authHelper.loginAs('CUSTOMER', null)
        const jwt = require('jsonwebtoken')
        const decoded = jwt.decode(customerToken)
        const customerUserId = decoded.userId

        // Create test notifications for the customer
        const notifications = Array.from({ length: 5 }, (_, i) =>
          createTestNotification({
            user_id: customerUserId,
            title: `Notification ${i + 1}`,
          }),
        )

        // Publish all notifications
        for (const notification of notifications) {
          await adminClient.post('/notifications/publish').send(notification)
          // Small delay to avoid overwhelming Firebase emulator
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        // Test pagination
        const response = await customerClient
          .get('/notifications')
          .query({ offset: 0, limit: 10 })
          .expect(200)

        expect(response.body.data).toHaveLength(5)
        expect(response.body.total).toBe(5)
        expect(response.body.unread_count).toBe(5) // All are unread
      })

      it('should filter unread notifications only', async () => {
        // Get the actual customer user ID from the JWT token
        const customerToken = await authHelper.loginAs('CUSTOMER', null)
        const jwt = require('jsonwebtoken')
        const decoded = jwt.decode(customerToken)
        const customerUserId = decoded.userId

        // Create unread notifications for the customer
        await adminClient.post('/notifications/publish').send(
          createTestNotification({
            user_id: customerUserId,
            title: 'Unread 1',
          }),
        )
        await adminClient.post('/notifications/publish').send(
          createTestNotification({
            user_id: customerUserId,
            title: 'Unread 2',
          }),
        )

        const response = await customerClient
          .get('/notifications')
          .query({ unread_only: true })
          .expect(200)

        expect(response.body.data).toHaveLength(2)
        response.body.data.forEach((notification: any) => {
          expect(notification.read).toBe(false)
        })
      })
    })

    describe('PATCH /notifications/:notificationId/read', () => {
      it('should mark notification as read', async () => {
        // Get the actual customer user ID from the JWT token
        const customerToken = await authHelper.loginAs('CUSTOMER', null)
        const jwt = require('jsonwebtoken')
        const decoded = jwt.decode(customerToken)
        const customerUserId = decoded.userId

        // Create notification
        const notification = createTestNotification({ user_id: customerUserId })

        await adminClient.post('/notifications/publish').send(notification)

        // Get notification ID
        const notificationsSnapshot = await firestore
          .collection('communication')
          .doc('notifications')
          .collection('data')
          .where('userId', '==', customerUserId)
          .get()

        const notificationId = notificationsSnapshot.docs[0].data().id

        // Mark as read
        await customerClient
          .patch(`/notifications/${notificationId}/read`)
          .expect(204)

        // Verify it's marked as read
        const updatedDoc = await firestore
          .collection('communication')
          .doc('notifications')
          .collection('data')
          .doc(notificationsSnapshot.docs[0].id)
          .get()

        expect(updatedDoc.data()?.read).toBe(true)
      })

      it('should return 404 for non-existent notification', async () => {
        await customerClient.patch(`/notifications/${uuid()}/read`).expect(404)
      })
    })
  })
})
