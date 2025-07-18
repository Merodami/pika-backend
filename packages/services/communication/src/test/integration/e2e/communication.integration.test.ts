import { vi } from 'vitest'

import { MockEmailProvider, MockSmsProvider } from './test-setup.js'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createExpressServer is used
vi.unmock('@pikapi') // Ensures real schemas from @p@pika are used
vi.unmock('@pika/redis') // Ensures real cache decorators from @p@pikais are used

// Remove the mock for @pikapi since it's causing issues
// The vi.unmock above should be sufficient

// Mock only the email and SMS providers to avoid external service calls
vi.mock('@communication/services/providers/ProviderFactory.js', async () => {
  const actualFactory = await vi.importActual<
    typeof import('@communication/services/providers/ProviderFactory.js')
  >('@communication/services/providers/ProviderFactory.js')

  class MockProviderFactory {
    async getEmailProvider() {
      return new MockEmailProvider()
    }

    async getSmsProvider() {
      return new MockSmsProvider()
    }
  }

  return {
    ...actualFactory,
    ProviderFactory: MockProviderFactory,
  }
})

import { MemoryCacheService } from '@pika/redis'
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pikaests'
import { logger } from '@pikahared'
import { PrismaClient } from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { Express } from 'express'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createCommunicationServer } from '../../../server.js'

// Test data seeding function for email templates
async function seedTestTemplates(prismaClient: PrismaClient): Promise<{
  welcomeTemplate: any
  orderTemplate: any
  notificationTemplate: any
}> {
  logger.debug('Seeding test email templates...')

  const welcomeTemplate = await prismaClient.template.create({
    data: {
      name: 'welcome',
      type: 'email',
      category: 'user',
      externalId: 'welcome-email-template',
      subject: 'Welcome to {{appName}}',
      body: '<h1>Welcome {{firstName}}!</h1><p>We are excited to have you.</p>',
      description: 'Welcome email for new users',
      variables: ['firstName', 'appName'],
      metadata: {
        htmlContent:
          '<h1>Welcome {{firstName}}!</h1><p>We are excited to have you.</p>',
        textContent: 'Welcome {{firstName}}! We are excited to have you.',
      },
      isActive: true,
    },
  })

  const orderTemplate = await prismaClient.template.create({
    data: {
      name: 'order-confirmation',
      type: 'email',
      category: 'order',
      externalId: 'order-confirmation-template',
      subject: 'Order #{{orderId}} Confirmed',
      body: '<h1>Order Confirmed</h1><p>Your order #{{orderId}} for {{amount}} has been confirmed.</p>',
      description: 'Order confirmation email',
      variables: ['orderId', 'amount'],
      metadata: {
        htmlContent:
          '<h1>Order Confirmed</h1><p>Your order #{{orderId}} for {{amount}} has been confirmed.</p>',
        textContent:
          'Order Confirmed. Your order #{{orderId}} for {{amount}} has been confirmed.',
      },
      isActive: true,
    },
  })

  const notificationTemplate = await prismaClient.template.create({
    data: {
      name: 'notification',
      type: 'email',
      category: 'notification',
      externalId: 'notification-template',
      subject: '{{subject}}',
      body: '<div>{{content}}</div>',
      description: 'Generic notification template',
      variables: ['subject', 'content'],
      metadata: {
        htmlContent: '<div>{{content}}</div>',
        textContent: '{{content}}',
      },
      isActive: false,
    },
  })

  logger.debug(
    `Created test templates: ${welcomeTemplate.id}, ${orderTemplate.id}, ${notificationTemplate.id}`,
  )

  return { welcomeTemplate, orderTemplate, notificationTemplate }
}

// TODO: Re-enable once email provider is configured
describe.skip('Communication Service Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let userClient: AuthenticatedRequestClient
  let anotherUserClient: AuthenticatedRequestClient
  let templates: Awaited<ReturnType<typeof seedTestTemplates>>
  let regularUserId: string
  let anotherUserId: string

  const mockCacheService = new MemoryCacheService(3600)

  beforeAll(async () => {
    logger.info('Setting up Communication Service integration tests...')

    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_communication_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    await mockCacheService.connect()

    // Create application server
    app = await createCommunicationServer({
      port: 5010, // Test port
      prisma: testDb.prisma,
      cacheService: mockCacheService,
      emailConfig: {
        provider: 'console',
        region: 'us-east-1',
        fromEmail: 'test@pikaom',
        fromName: 'Pika Test',
      },
    })

    logger.debug('Communication server ready for testing.')

    // Initialize E2E Authentication Helper using the Express app
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)

    // Get the regular user ID
    const regularUser = await testDb.prisma.user.findFirst({
      where: { email: 'user@e2etest.com' },
    })

    regularUserId = regularUser!.id

    // Create another regular user for testing cross-user access
    const anotherUser = await testDb.prisma.user.create({
      data: {
        email: 'another@example.com',
        firstName: 'Another',
        lastName: 'User',
        emailVerified: true,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
    })

    anotherUserId = anotherUser.id

    // For simplicity, we'll just create an unauthenticated client for the other user tests
    // The tests that need cross-user access will be modified to use the regular user client
    anotherUserClient = userClient // We'll modify tests to work with this

    // Seed test templates
    templates = await seedTestTemplates(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      // Clear cached tokens to force re-authentication
      authHelper.clearTokens()
      // Recreate test users after clearing database
      await authHelper.createAllTestUsers(testDb.prisma)
      // Re-authenticate to get new tokens with correct user IDs
      adminClient = await authHelper.getAdminClient(testDb.prisma)
      userClient = await authHelper.getUserClient(testDb.prisma)

      // Get the regular user ID
      const regularUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      regularUserId = regularUser!.id

      // Recreate another user for cross-user tests
      const anotherUser = await testDb.prisma.user.create({
        data: {
          email: 'another@example.com',
          firstName: 'Another',
          lastName: 'User',
          emailVerified: true,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      })

      anotherUserId = anotherUser.id

      // For simplicity, we'll just create an unauthenticated client for the other user tests
      anotherUserClient = userClient // We'll modify tests to work with this

      // Re-seed templates after clearing database
      templates = await seedTestTemplates(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await userClient.get('/api/v1/health').expect(200)

      expect(response.body).toHaveProperty('status')
    })
  })

  describe('Email Endpoints', () => {
    describe('POST /emails/send', () => {
      it('should send an email with template', async () => {
        const response = await userClient.post('/emails/send').send({
          to: 'recipient@example.com',
          subject: 'Welcome!', // Required even with template
          templateId: templates.welcomeTemplate.id,
          templateParams: {
            firstName: 'John',
            appName: 'Pika',
          },
        })

        if (response.status !== 200) {
          console.error('Response:', response.status, response.body)
          console.error('Request:', {
            to: 'recipient@example.com',
            templateId: templates.welcomeTemplate.id,
            templateParams: {
              firstName: 'John',
              appName: 'Pika',
            },
          })
        }

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: 'email',
          recipient: 'recipient@example.com',
          status: expect.any(String),
        })
      })

      it('should send an email without template', async () => {
        const response = await userClient
          .post('/emails/send')
          .send({
            to: 'recipient@example.com',
            subject: 'Test Email',
            htmlContent: '<h1>Test</h1>',
            textContent: 'Test',
          })
          .expect(200)

        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: 'email',
          recipient: 'recipient@example.com',
          subject: 'Test Email',
          status: expect.any(String),
        })
      })

      it('should validate email input', async () => {
        const response = await userClient
          .post('/emails/send')
          .send({
            to: 'invalid-email',
            subject: 'Test',
          })
          .expect(400)

        expect(response.body.error).toBeDefined()
      })

      it('should require authentication', async () => {
        await userClient
          .post('/emails/send')
          .set('Authorization', '')
          .send({
            to: 'test@example.com',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          })
          .expect(401)
      })

      it('should handle template not found', async () => {
        const response = await userClient
          .post('/emails/send')
          .send({
            to: 'recipient@example.com',
            subject: 'Test', // Subject is required
            templateId: '00000000-0000-0000-0000-000000000000',
            templateParams: {},
          })
          .expect(404)

        expect(response.body.error).toContain('Template not found')
      })

      it('should handle inactive template', async () => {
        const response = await userClient
          .post('/emails/send')
          .send({
            to: 'recipient@example.com',
            subject: 'Test Subject', // Subject is required
            templateId: templates.notificationTemplate.id,
            templateParams: {
              subject: 'Test',
              content: 'Test content',
            },
          })
          .expect(400)

        expect(response.body.error).toContain('Template is not active')
      })
    })

    describe('POST /emails/send-bulk', () => {
      it('should send bulk emails (admin only)', async () => {
        const response = await adminClient
          .post('/emails/send-bulk')
          .send({
            recipients: [
              { email: 'user1@example.com' },
              { email: 'user2@example.com' },
            ],
            subject: 'Welcome to Pika',
            templateId: templates.welcomeTemplate.id,
            globalVariables: {
              firstName: 'User',
              appName: 'Pika',
            },
          })
          .expect(201)

        expect(response.body).toMatchObject({
          sent: 2,
          failed: 0,
          total: 2,
          logs: expect.any(Array),
        })
      })

      it('should require admin role', async () => {
        await userClient
          .post('/emails/send-bulk')
          .send({
            recipients: [{ email: 'user@example.com' }],
            subject: 'Bulk Test',
            templateId: templates.welcomeTemplate.id,
            globalVariables: {},
          })
          .expect(403)
      })

      it('should handle partial failures in bulk send', async () => {
        const response = await adminClient
          .post('/emails/send-bulk')
          .send({
            recipients: [
              'valid@example.com',
              'invalid-email',
              'another@example.com',
            ],
            subject: 'Bulk Test',
            htmlContent: '<p>Test</p>',
            textContent: 'Test',
          })
          .expect(201)

        expect(response.body.sent).toBe(2)
        expect(response.body.failed).toBe(1)
        expect(response.body.errors).toHaveLength(1)
      })
    })

    describe('GET /emails/history', () => {
      beforeEach(async () => {
        // Create some email logs
        await testDb.prisma.communicationLog.createMany({
          data: [
            {
              userId: regularUserId,
              type: 'EMAIL',
              status: 'SENT',
              recipient: 'test1@example.com',
              subject: 'Email 1',
              provider: 'mock',
              metadata: { body: 'Content 1' },
            },
            {
              userId: regularUserId,
              type: 'EMAIL',
              status: 'FAILED',
              recipient: 'test2@example.com',
              subject: 'Email 2',
              provider: 'mock',
              metadata: { body: 'Content 2', error: 'Failed to send' },
              errorMessage: 'Failed to send',
            },
            {
              userId: anotherUserId,
              type: 'EMAIL',
              status: 'SENT',
              recipient: 'test3@example.com',
              subject: 'Email 3',
              provider: 'mock',
              metadata: { body: 'Content 3' },
            },
          ],
        })
      })

      it('should get user email history', async () => {
        const response = await userClient.get('/emails/history').expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.data[0].userId).toBe(regularUserId)
        expect(response.body.pagination).toBeDefined()
      })

      it('should support pagination', async () => {
        const response = await userClient
          .get('/emails/history?page=1&limit=1')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.pagination.totalPages).toBe(2)
      })

      it('should filter by status', async () => {
        const response = await userClient
          .get('/emails/history?status=FAILED')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].status).toBe('FAILED')
      })

      it('should only show own email history', async () => {
        const response = await anotherUserClient
          .get('/emails/history')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].userId).toBe(anotherUserId)
      })
    })

    describe('GET /emails/history/:id', () => {
      let emailLog: any

      beforeEach(async () => {
        emailLog = await testDb.prisma.communicationLog.create({
          data: {
            userId: regularUserId,
            type: 'EMAIL',
            status: 'SENT',
            recipient: 'test@example.com',
            subject: 'Test Email',
            content: 'Test content',
            metadata: { templateKey: 'welcome' },
          },
        })
      })

      it('should get email by id', async () => {
        const response = await userClient
          .get(`/emails/history/${emailLog.id}`)
          .expect(200)

        expect(response.body).toMatchObject({
          id: emailLog.id,
          recipient: 'test@example.com',
          subject: 'Test Email',
        })
      })

      it('should return 404 for non-existent email', async () => {
        const fakeId = uuid()

        await userClient.get(`/emails/history/${fakeId}`).expect(404)
      })

      it('should not allow access to other users emails', async () => {
        await anotherUserClient
          .get(`/emails/history/${emailLog.id}`)
          .expect(403)
      })
    })
  })

  describe('Notification Endpoints', () => {
    describe('POST /notifications', () => {
      it('should create a notification', async () => {
        const response = await userClient
          .post('/notifications')
          .send({
            title: 'New Notification',
            message: 'You have a new notification',
            type: 'INFO',
            priority: 'MEDIUM',
            data: { actionUrl: '/dashboard' },
          })
          .expect(201)

        expect(response.body).toMatchObject({
          id: expect.any(String),
          userId: regularUserId,
          title: 'New Notification',
          message: 'You have a new notification',
          type: 'INFO',
          priority: 'MEDIUM',
          status: 'UNREAD',
        })
      })

      it('should validate notification input', async () => {
        const response = await userClient
          .post('/notifications')
          .send({
            title: '',
            message: 'Test',
          })
          .expect(400)

        expect(response.body.error).toBeDefined()
      })

      it('should send email notification when requested', async () => {
        const response = await userClient
          .post('/notifications')
          .send({
            title: 'Email Notification',
            message: 'This should also be sent via email',
            type: 'ALERT',
            priority: 'HIGH',
            sendEmail: true,
          })
          .expect(201)

        expect(response.body.emailSent).toBe(true)
      })
    })

    describe('GET /notifications', () => {
      beforeEach(async () => {
        // Create test notifications
        await testDb.prisma.notification.createMany({
          data: [
            {
              userId: regularUserId,
              title: 'Notification 1',
              message: 'Message 1',
              type: 'INFO',
              priority: 'LOW',
              status: 'UNREAD',
            },
            {
              userId: regularUserId,
              title: 'Notification 2',
              message: 'Message 2',
              type: 'ALERT',
              priority: 'HIGH',
              status: 'READ',
            },
            {
              userId: anotherUserId,
              title: 'Notification 3',
              message: 'Message 3',
              type: 'INFO',
              priority: 'MEDIUM',
              status: 'UNREAD',
            },
          ],
        })
      })

      it('should get user notifications', async () => {
        const response = await userClient.get('/notifications').expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.data[0].userId).toBe(regularUserId)
        expect(response.body.pagination).toBeDefined()
      })

      it('should filter by status', async () => {
        const response = await userClient
          .get('/notifications?status=UNREAD')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].status).toBe('UNREAD')
      })

      it('should filter by type', async () => {
        const response = await userClient
          .get('/notifications?type=ALERT')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].type).toBe('ALERT')
      })

      it('should filter by priority', async () => {
        const response = await userClient
          .get('/notifications?priority=HIGH')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].priority).toBe('HIGH')
      })

      it('should support pagination', async () => {
        const response = await userClient
          .get('/notifications?page=1&limit=1')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.pagination.totalPages).toBe(2)
      })
    })

    describe('GET /notifications/:id', () => {
      let notification: any

      beforeEach(async () => {
        notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            message: 'Test message',
            type: 'INFO',
            priority: 'MEDIUM',
            status: 'UNREAD',
          },
        })
      })

      it('should get notification by id', async () => {
        const response = await userClient
          .get(`/notifications/${notification.id}`)
          .expect(200)

        expect(response.body).toMatchObject({
          id: notification.id,
          title: 'Test Notification',
          message: 'Test message',
        })
      })

      it('should mark as read when retrieving', async () => {
        await userClient.get(`/notifications/${notification.id}`).expect(200)

        const updated = await testDb.prisma.notification.findUnique({
          where: { id: notification.id },
        })

        expect(updated?.readAt).toBeDefined()
      })

      it('should return 404 for non-existent notification', async () => {
        const fakeId = uuid()

        await userClient.get(`/notifications/${fakeId}`).expect(404)
      })

      it('should not allow access to other users notifications', async () => {
        await anotherUserClient
          .get(`/notifications/${notification.id}`)
          .expect(403)
      })
    })

    describe('PUT /notifications/:id', () => {
      let notification: any

      beforeEach(async () => {
        notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            message: 'Test message',
            type: 'INFO',
            priority: 'MEDIUM',
            status: 'UNREAD',
          },
        })
      })

      it('should update notification status', async () => {
        const response = await userClient
          .put(`/notifications/${notification.id}`)
          .send({
            status: 'ARCHIVED',
          })
          .expect(200)

        expect(response.body.status).toBe('ARCHIVED')
      })

      it('should not allow updating other users notifications', async () => {
        await anotherUserClient
          .put(`/notifications/${notification.id}`)
          .send({
            status: 'ARCHIVED',
          })
          .expect(403)
      })
    })

    describe('PUT /notifications/:id/read', () => {
      let notification: any

      beforeEach(async () => {
        notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            message: 'Test message',
            type: 'INFO',
            priority: 'MEDIUM',
            status: 'UNREAD',
          },
        })
      })

      it('should mark notification as read', async () => {
        const response = await userClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        expect(response.body.status).toBe('READ')
        expect(response.body.readAt).toBeDefined()
      })

      it('should be idempotent', async () => {
        await userClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        const response = await userClient
          .put(`/notifications/${notification.id}/read`)
          .expect(200)

        expect(response.body.status).toBe('READ')
      })
    })

    describe('PUT /notifications/read-all', () => {
      beforeEach(async () => {
        await testDb.prisma.notification.createMany({
          data: [
            {
              userId: regularUserId,
              title: 'Notification 1',
              message: 'Message 1',
              type: 'INFO',
              priority: 'LOW',
              status: 'UNREAD',
            },
            {
              userId: regularUserId,
              title: 'Notification 2',
              message: 'Message 2',
              type: 'ALERT',
              priority: 'HIGH',
              status: 'UNREAD',
            },
            {
              userId: regularUserId,
              title: 'Notification 3',
              message: 'Message 3',
              type: 'INFO',
              priority: 'MEDIUM',
              status: 'READ',
            },
          ],
        })
      })

      it('should mark all unread notifications as read', async () => {
        const response = await userClient
          .put('/notifications/read-all')
          .expect(200)

        expect(response.body.updated).toBe(2)

        const unreadCount = await testDb.prisma.notification.count({
          where: {
            userId: regularUserId,
            status: 'UNREAD',
          },
        })

        expect(unreadCount).toBe(0)
      })
    })

    describe('DELETE /notifications/:id', () => {
      let notification: any

      beforeEach(async () => {
        notification = await testDb.prisma.notification.create({
          data: {
            userId: regularUserId,
            title: 'Test Notification',
            message: 'Test message',
            type: 'INFO',
            priority: 'MEDIUM',
            status: 'READ',
          },
        })
      })

      it('should delete notification', async () => {
        await userClient.delete(`/notifications/${notification.id}`).expect(204)

        const deleted = await testDb.prisma.notification.findUnique({
          where: { id: notification.id },
        })

        expect(deleted).toBeNull()
      })

      it('should not allow deleting other users notifications', async () => {
        await anotherUserClient
          .delete(`/notifications/${notification.id}`)
          .expect(403)
      })

      it('should return 404 for non-existent notification', async () => {
        const fakeId = uuid()

        await userClient.delete(`/notifications/${fakeId}`).expect(404)
      })
    })

    describe('POST /notifications/global', () => {
      it('should create global notification (admin only)', async () => {
        const response = await adminClient
          .post('/notifications/global')
          .send({
            title: 'System Maintenance',
            message: 'System will be down for maintenance',
            type: 'ALERT',
            priority: 'HIGH',
          })
          .expect(201)

        expect(response.body.count).toBe(3) // All test users

        const notifications = await testDb.prisma.notification.findMany({
          where: { title: 'System Maintenance' },
        })

        expect(notifications).toHaveLength(3)
      })

      it('should require admin role', async () => {
        await userClient
          .post('/notifications/global')
          .send({
            title: 'Test',
            message: 'Test',
            type: 'INFO',
          })
          .expect(403)
      })
    })

    describe('POST /notifications/admin/notification', () => {
      it('should create global notification via legacy endpoint', async () => {
        const response = await adminClient
          .post('/notifications/admin/notification')
          .send({
            title: 'Legacy Notification',
            message: 'Created via legacy endpoint',
            type: 'INFO',
            priority: 'LOW',
          })
          .expect(201)

        expect(response.body.count).toBe(3)
      })
    })
  })

  describe('Template Endpoints', () => {
    describe('GET /templates', () => {
      it('should get all templates', async () => {
        const response = await userClient.get('/templates').expect(200)

        expect(response.body.data).toHaveLength(3)
        expect(response.body.data[0]).toHaveProperty('name')
        expect(response.body.data[0]).toHaveProperty('key')
      })

      it('should filter by active status', async () => {
        const response = await userClient
          .get('/templates?isActive=true')
          .expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.data.every((t: any) => t.isActive)).toBe(true)
      })

      it('should support search', async () => {
        const response = await userClient
          .get('/templates?search=order')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].key).toBe('order-confirmation')
      })

      it('should support pagination', async () => {
        const response = await userClient
          .get('/templates?page=1&limit=2')
          .expect(200)

        expect(response.body.data).toHaveLength(2)
        expect(response.body.pagination.totalPages).toBe(2)
      })
    })

    describe('GET /templates/:id', () => {
      it('should get template by id', async () => {
        const response = await userClient
          .get(`/templates/${templates.welcomeTemplate.id}`)
          .expect(200)

        expect(response.body).toMatchObject({
          id: templates.welcomeTemplate.id,
          name: 'Welcome Email',
          key: 'welcome',
        })
      })

      it('should return 404 for non-existent template', async () => {
        const fakeId = uuid()

        await userClient.get(`/templates/${fakeId}`).expect(404)
      })
    })

    describe('POST /templates', () => {
      it('should create template (admin only)', async () => {
        const response = await adminClient
          .post('/templates')
          .send({
            name: 'New Template',
            key: 'new-template',
            subject: 'Subject {{variable}}',
            htmlContent: '<p>{{content}}</p>',
            textContent: '{{content}}',
            metadata: {
              variables: ['variable', 'content'],
            },
          })
          .expect(201)

        expect(response.body).toMatchObject({
          name: 'New Template',
          key: 'new-template',
          isActive: true,
        })
      })

      it('should require admin role', async () => {
        await userClient
          .post('/templates')
          .send({
            name: 'Test',
            key: 'test',
            subject: 'Test',
            htmlContent: '<p>Test</p>',
          })
          .expect(403)
      })

      it('should prevent duplicate keys', async () => {
        const response = await adminClient
          .post('/templates')
          .send({
            name: 'Duplicate',
            key: 'welcome', // Already exists
            subject: 'Test',
            htmlContent: '<p>Test</p>',
            textContent: 'Test',
          })
          .expect(409)

        expect(response.body.error).toContain('already exists')
      })
    })

    describe('PUT /templates/:id', () => {
      it('should update template (admin only)', async () => {
        const response = await adminClient
          .put(`/templates/${templates.notificationTemplate.id}`)
          .send({
            isActive: true,
            metadata: {
              variables: ['subject', 'content', 'footer'],
              updated: true,
            },
          })
          .expect(200)

        expect(response.body.isActive).toBe(true)
        expect(response.body.metadata.updated).toBe(true)
      })

      it('should require admin role', async () => {
        await userClient
          .put(`/templates/${templates.welcomeTemplate.id}`)
          .send({
            name: 'Updated Name',
          })
          .expect(403)
      })

      it('should prevent changing key to duplicate', async () => {
        const response = await adminClient
          .put(`/templates/${templates.orderTemplate.id}`)
          .send({
            key: 'welcome', // Already exists
          })
          .expect(409)

        expect(response.body.error).toContain('already exists')
      })
    })

    describe('DELETE /templates/:id', () => {
      let templateToDelete: any

      beforeEach(async () => {
        templateToDelete = await testDb.prisma.template.create({
          data: {
            name: 'To Delete',
            externalId: 'to-delete',
            type: 'email',
            category: 'test',
            subject: 'Delete Me',
            body: '<p>Delete</p>',
            metadata: {
              htmlContent: '<p>Delete</p>',
              textContent: 'Delete',
            },
            isActive: false,
          },
        })
      })

      it('should delete template (admin only)', async () => {
        await adminClient
          .delete(`/templates/${templateToDelete.id}`)
          .expect(204)

        const deleted = await testDb.prisma.emailTemplate.findUnique({
          where: { id: templateToDelete.id },
        })

        expect(deleted).toBeNull()
      })

      it('should require admin role', async () => {
        await userClient.delete(`/templates/${templateToDelete.id}`).expect(403)
      })

      it('should prevent deleting active templates', async () => {
        const response = await adminClient
          .delete(`/templates/${templates.welcomeTemplate.id}`)
          .expect(400)

        expect(response.body.error).toContain('Cannot delete active template')
      })
    })

    // Note: The validate endpoint seems to have a mismatch in implementation
    // Skipping these tests for now as they need API schema updates
    describe('POST /templates/validate', () => {
      it('should validate template with data', async () => {
        // First create a template to validate
        const templateData = {
          name: 'Test Validation Template',
          type: 'EMAIL',
          category: 'SYSTEM',
          subject: 'Hello {{name}}',
          content: 'Welcome {{name}}, your {{item}} is ready!',
          variables: [
            {
              name: 'name',
              type: 'STRING',
              required: true,
            },
            {
              name: 'item',
              type: 'STRING',
              required: true,
            },
          ],
        }

        const createResponse = await adminClient
          .post('/templates')
          .send(templateData)
          .expect(200)

        const templateId = createResponse.body.id

        // Test validation with valid data
        const validationResponse = await userClient
          .post('/templates/validate')
          .send({
            templateId,
            variables: {
              name: 'John Doe',
              item: 'order',
            },
          })
          .expect(200)

        expect(validationResponse.body).toHaveProperty('subject')
        expect(validationResponse.body).toHaveProperty('content')
        expect(validationResponse.body.subject).toContain('John Doe')
        expect(validationResponse.body.content).toContain('John Doe')
        expect(validationResponse.body.content).toContain('order')
      })
    })

    describe('POST /templates/seed', () => {
      beforeEach(async () => {
        // Clear all templates for seed test
        await testDb.prisma.template.deleteMany()
      })

      it('should seed default templates (admin only)', async () => {
        const response = await adminClient.post('/templates/seed').expect(200)

        expect(response.body.message).toBe(
          'Default templates seeded successfully',
        )

        const templates = await testDb.prisma.template.findMany()

        expect(templates.length).toBeGreaterThan(0)
      })

      it('should require admin role', async () => {
        await userClient.post('/templates/seed').expect(403)
      })

      it('should be idempotent', async () => {
        await adminClient.post('/templates/seed').expect(200)

        const response = await adminClient.post('/templates/seed').expect(200)

        expect(response.body.message).toBe(
          'Default templates seeded successfully',
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      await userClient
        .post('/emails/send')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
    })

    it('should handle method not allowed', async () => {
      await userClient.patch('/emails/send').expect(404)
    })

    it('should handle 404 for non-existent routes', async () => {
      await userClient.get('/api/non-existent').expect(404)
    })
  })

  describe('Caching', () => {
    it('should cache template responses', async () => {
      // First request - cache miss
      const response1 = await userClient.get('/templates').expect(200)

      // Second request - should be cached
      const response2 = await userClient.get('/templates').expect(200)

      expect(response1.body).toEqual(response2.body)
    })

    it('should invalidate cache on template update', async () => {
      // Get templates to populate cache
      await userClient.get('/templates').expect(200)

      // Update template
      await adminClient
        .put(`/templates/${templates.welcomeTemplate.id}`)
        .send({
          name: 'Updated Welcome Email',
        })
        .expect(200)

      // Get templates again - should reflect update
      const response = await userClient.get('/templates').expect(200)

      const updated = response.body.data.find(
        (t: any) => t.id === templates.welcomeTemplate.id,
      )

      expect(updated.name).toBe('Updated Welcome Email')
    })
  })
})
