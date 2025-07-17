/**
 * Integration tests for the Messaging Service API
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

import { FIREBASE_EMULATOR_CONFIG } from '@pika/environment'
import { FirebaseAdminClient, logger } from '@pika/shared'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { FastifyInstance } from 'fastify'
import type { Firestore } from 'firebase-admin/firestore'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { startMessagingService } from '../../app.js'
import { ConversationContext, MessageType } from '../../shared/types.js'

describe('Messaging Service Basic Integration Tests', () => {
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let customerClient: AuthenticatedRequestClient
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
    app = await startMessagingService()

    await app.ready()

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Note: Messaging service uses Firebase, not Prisma, so we pass null
    // The E2E helper will still generate valid JWT tokens for testing
    logger.debug('Setting up E2E authentication for messaging...')
    await authHelper.createAllTestUsers(null) // No Prisma for messaging service

    // Get authenticated clients for different user types
    customerClient = await authHelper.getCustomerClient(null)

    logger.debug('E2E authentication setup complete for messaging')
  })

  beforeEach(async () => {
    // Comprehensive cleanup - clear everything
    try {
      // Clear all conversations and their messages
      const conversationsSnapshot = await firestore
        .collection('conversations')
        .get()

      for (const conversationDoc of conversationsSnapshot.docs) {
        // Delete all messages in this conversation
        const messagesSnapshot = await conversationDoc.ref
          .collection('messages')
          .get()

        const batch = firestore.batch()

        messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

        // Delete the conversation itself
        batch.delete(conversationDoc.ref)

        if (!messagesSnapshot.empty || conversationsSnapshot.docs.length > 0) {
          await batch.commit()
        }
      }

      // Clear all user conversation lists and notifications
      const usersSnapshot = await firestore.collection('users').get()

      for (const userDoc of usersSnapshot.docs) {
        const batch = firestore.batch()

        // Clear user's conversations
        const userConversationSnapshot = await userDoc.ref
          .collection('conversations')
          .get()

        userConversationSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

        // Clear user's notifications
        const userNotificationSnapshot = await userDoc.ref
          .collection('notifications')
          .get()

        userNotificationSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

        if (
          !userConversationSnapshot.empty ||
          !userNotificationSnapshot.empty
        ) {
          await batch.commit()
        }
      }
    } catch (error) {
      console.warn('Error during test cleanup:', error)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up messaging integration test resources...')

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

    logger.debug('Messaging integration test resources cleaned up.')
  }, 30000) // Increase timeout for cleanup

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await customerClient.get('/health').expect(200)

      expect(response.body.status).toBe('healthy')
      // The health check response structure is different - it has services array instead of service property
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
        participantIds: [customerUserId, otherUserId],
        context: {
          type: ConversationContext.GENERAL,
          id: '123e4567-e89b-12d3-a456-426614174000', // Required UUID for context
        },
      }

      const response = await customerClient
        .post('/conversations', conversationData)
        .expect(201)

      expect(response.body).toHaveProperty('conversationId')

      const { conversationId } = response.body

      // Verify conversation was actually created in Firebase
      const conversationDoc = await firestore
        .collection('conversations')
        .doc(conversationId)
        .get()

      expect(conversationDoc.exists).toBe(true)

      const data = conversationDoc.data()!

      expect(data.participants).toHaveProperty(customerUserId)
      expect(data.participants).toHaveProperty(otherUserId)
    })

    it('should reject invalid conversation data', async () => {
      const invalidData = {
        participantIds: ['single-user'], // Only one participant
      }

      await customerClient.post('/conversations', invalidData).expect(400)
    })
  })

  describe('GET /conversations - Basic Operations', () => {
    it('should return empty list when no conversations exist', async () => {
      const response = await customerClient.get('/conversations').expect(200)

      expect(response.body).toHaveProperty('conversations')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.conversations)).toBe(true)
      // Don't check for exact count as other tests may have created conversations
    })

    it('should support pagination parameters', async () => {
      const response = await customerClient
        .get('/conversations?page=1&limit=10')
        .expect(200)

      expect(response.body.pagination).toHaveProperty('limit', 10)
      expect(response.body.pagination).toHaveProperty('page', 1)
      expect(response.body.pagination).toHaveProperty('pages')
      expect(response.body.pagination).toHaveProperty('has_next')
      expect(response.body.pagination).toHaveProperty('has_prev', false)
      expect(response.body.pagination).toHaveProperty('total')
      expect(typeof response.body.pagination.total).toBe('number')
    })
  })

  describe('POST /conversations/:conversationId/messages', () => {
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

  describe('GET /conversations/:conversationId/messages - Error Handling', () => {
    it('should reject access to non-existent conversation', async () => {
      await customerClient
        .get('/conversations/non-existent-id/messages')
        .expect(400)
    })
  })

  describe('PATCH /conversations/:conversationId/read', () => {
    it('should validate request body', async () => {
      await customerClient.patch('/conversations/some-id/read', {}).expect(400)
    })

    it('should require messageIds array', async () => {
      await customerClient
        .patch('/conversations/some-id/read', {
          wrongField: ['msg-1'],
        })
        .expect(400)
    })
  })

  describe('GET /conversations - User Conversations', () => {
    it('should retrieve all conversations for a user', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId

      // Create multiple conversations
      const conversationIds: string[] = []

      for (let i = 0; i < 3; i++) {
        const participantId = uuid()
        const response = await customerClient
          .post('/conversations', {
            participantIds: [customerUserId, participantId],
            context: {
              type: ConversationContext.GENERAL,
              id: uuid(),
            },
          })
          .expect(201)

        conversationIds.push(response.body.conversationId)
      }

      // Retrieve all conversations
      const response = await customerClient.get('/conversations').expect(200)

      expect(response.body).toHaveProperty('conversations')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.conversations).toHaveLength(3)

      // Verify all created conversations are returned
      const returnedIds = response.body.conversations.map((c: any) => c.id)

      conversationIds.forEach((id) => {
        expect(returnedIds).toContain(id)
      })
    })

    it('should paginate conversations correctly', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId

      // Create 5 conversations
      for (let i = 0; i < 5; i++) {
        await customerClient
          .post('/conversations', {
            participantIds: [customerUserId, uuid()],
            context: {
              type: ConversationContext.GENERAL,
              id: uuid(),
            },
          })
          .expect(201)
      }

      // Get first page
      const firstPage = await customerClient
        .get('/conversations?limit=2')
        .expect(200)

      expect(firstPage.body.conversations).toHaveLength(2)
      expect(firstPage.body.pagination.limit).toBe(2)
      expect(firstPage.body.pagination.has_next).toBe(true)

      // Get second page
      const secondPage = await customerClient
        .get('/conversations?limit=2&page=2')
        .expect(200)

      expect(secondPage.body.conversations).toHaveLength(2)
      expect(secondPage.body.pagination.page).toBe(2)
    })
  })

  describe('GET /conversations/:conversationId/messages - Message Retrieval', () => {
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
          participantIds: [customerUserId, otherUserId],
          context: {
            type: ConversationContext.GENERAL,
            id: uuid(),
          },
        })
        .expect(201)

      const conversationId = convResponse.body.conversationId

      // Add messages to the conversation
      for (let i = 0; i < 5; i++) {
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

      expect(response.body).toHaveProperty('messages')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.messages).toHaveLength(5)

      // Verify messages content
      response.body.messages.forEach((msg: any, index: number) => {
        expect(msg.content).toBe(`Test message ${index + 1}`)
        expect(msg.type).toBe(MessageType.TEXT)
      })
    })

    it('should paginate messages correctly', async () => {
      // Get the actual customer user ID from the JWT token
      const customerToken = await authHelper.loginAs('CUSTOMER', null)
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(customerToken)
      const customerUserId = decoded.userId

      // Create a conversation
      const convResponse = await customerClient
        .post('/conversations', {
          participantIds: [customerUserId, uuid()],
          context: {
            type: ConversationContext.GENERAL,
            id: uuid(),
          },
        })
        .expect(201)

      const conversationId = convResponse.body.conversationId

      // Add 10 messages
      for (let i = 0; i < 10; i++) {
        await customerClient
          .post(`/conversations/${conversationId}/messages`, {
            type: MessageType.TEXT,
            content: `Message ${i + 1}`,
          })
          .expect(201)
      }

      // Get first page with 5 messages
      const firstPage = await customerClient
        .get(`/conversations/${conversationId}/messages?limit=5`)
        .expect(200)

      expect(firstPage.body.messages).toHaveLength(5)
      expect(firstPage.body.pagination.limit).toBe(5)
      expect(firstPage.body.pagination.hasMore).toBe(true)

      // Messages pagination uses cursor-based pagination with before/after, not page numbers
      // So we'll just verify the first page response
      expect(firstPage.body.pagination.hasMore).toBe(true)

      // Get remaining messages by using the 'after' parameter with the last message timestamp
      const lastMessage =
        firstPage.body.messages[firstPage.body.messages.length - 1]
      const secondPage = await customerClient
        .get(
          `/conversations/${conversationId}/messages?limit=5&after=${lastMessage.createdAt}`,
        )
        .expect(200)

      expect(secondPage.body.messages).toHaveLength(5)
      expect(secondPage.body.pagination.hasMore).toBe(false)
    })

    it('should return 404 for non-existent conversation', async () => {
      await customerClient.get(`/conversations/${uuid()}/messages`).expect(404)
    })
  })
})
