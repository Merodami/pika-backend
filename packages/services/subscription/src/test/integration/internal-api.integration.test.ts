import type { InternalAPIClient, TestDatabase } from '@pika'
import {
    cleanupTestDatabase,
    createE2EAuthHelper,
    createTestDatabase,
    E2EAuthHelper,
    E2EClient,
    InternalAPITestHelper, MemoryCacheService
} from '@pika'
import type {
    CheckSubscriptionAccessRequest,
    ProcessSubscriptionWebhookRequest,
    SendSubscriptionNotificationRequest,
    UpdateSubscriptionFromPaymentRequest,
} from '@pika/api/internal'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSubscriptionServer } from '../../server.js'

// Mock CommunicationServiceClient before imports
const mockSendTransactionalEmail = vi.fn().mockResolvedValue({})
const mockSendSystemNotification = vi.fn().mockResolvedValue({})

vi.mock('@pikad', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@pikad')>()

  return {
    ...actual,
    CommunicationServiceClient: vi.fn().mockImplementation(() => ({
      sendTransactionalEmail: mockSendTransactionalEmail,
      sendSystemNotification: mockSendSystemNotification,
    })),
  }
})

// Helper function to seed subscription plan
async function seedSubscriptionPlan(
  prisma: any,
  overrides: Partial<{
    name: string
    price: number
    features: string[]
  }> = {},
) {
  return prisma.subscriptionPlan.create({
    data: {
      name: overrides.name || 'Test Plan',
      description: 'Test plan description',
      price: overrides.price || 999,
      currency: 'USD',
      interval: 'MONTH',
      intervalCount: 1,
      creditsAmount: 10,
      features: overrides.features || ['feature1', 'feature2'],
      isActive: true,
      stripePriceId: 'price_test_' + uuid(),
      stripeProductId: 'prod_test_' + uuid(),
    },
  })
}

describe('Subscription Internal API Integration Tests', () => {
  let app: Express
  let testDb: TestDatabase
  let authHelper: E2EAuthHelper
  let adminClient: E2EClient
  let userClient: E2EClient
  let internalClient: InternalAPIClient
  let internalAPIHelper: InternalAPITestHelper
  let cacheService: MemoryCacheService
  let testUserIds: { admin: string; user: string; member: string }

  beforeAll(async () => {
    // Setup internal API test helper
    internalAPIHelper = new InternalAPITestHelper(
      'dev-service-api-key-change-in-production',
    )
    internalAPIHelper.setup()

    console.log('SERVICE_API_KEY from env:', process.env.SERVICE_API_KEY)

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_subscription_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Create server
    cacheService = new MemoryCacheService()

    const server = await createSubscriptionServer({
      prisma: testDb.prisma,
      cacheService,
    })

    app = server.app

    // Setup auth helper
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    // Create authenticated clients
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)

    // Get test user IDs from database
    const adminUser = await testDb.prisma.user.findUnique({
      where: { email: 'admin@e2etest.com' },
    })
    const normalUser = await testDb.prisma.user.findUnique({
      where: { email: 'user@e2etest.com' },
    })
    const memberUser = await testDb.prisma.user.findUnique({
      where: { email: 'member@e2etest.com' },
    })

    testUserIds = {
      admin: adminUser?.id || uuid(),
      user: normalUser?.id || uuid(),
      member: memberUser?.id || uuid(),
    }

    // Create internal API client
    internalClient = internalAPIHelper.createClient(app)

    console.log('Test API Key:', internalAPIHelper.getApiKey())
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendTransactionalEmail.mockClear()
    mockSendSystemNotification.mockClear()
    // Clear cache
    await cacheService.clear()
    // Clear subscriptions and plans but preserve users
    await testDb.prisma.subscription.deleteMany()
    await testDb.prisma.subscriptionPlan.deleteMany()
  })

  describe('POST /internal/subscriptions/webhook', () => {
    it('should process webhook events with service authentication', async () => {
      const webhookRequest: ProcessSubscriptionWebhookRequest = {
        event: {
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test123',
              status: 'active',
            },
          },
          created: Math.floor(Date.now() / 1000),
        },
      }

      const response = await internalClient
        .post('/internal/subscriptions/webhook')
        .send(webhookRequest)
        .expect(200)

      expect(response.body).toMatchObject({
        processed: false,
        action: 'subscription_sync',
      })
    })

    it('should reject webhook requests without service authentication', async () => {
      const webhookRequest: ProcessSubscriptionWebhookRequest = {
        event: {
          type: 'customer.subscription.created',
          data: { object: {} },
          created: Date.now(),
        },
      }

      await supertest(app)
        .post('/internal/subscriptions/webhook')
        .send(webhookRequest)
        .expect(401)
    })

    it('should reject webhook requests with invalid API key', async () => {
      const webhookRequest: ProcessSubscriptionWebhookRequest = {
        event: {
          type: 'customer.subscription.created',
          data: { object: {} },
          created: Date.now(),
        },
      }

      await supertest(app)
        .post('/internal/subscriptions/webhook')
        .set('x-api-key', 'invalid-key')
        .send(webhookRequest)
        .expect(401)
    })
  })

  describe('PUT /internal/subscriptions/update-from-payment', () => {
    it('should update subscription from payment service', async () => {
      // Create test plan and subscription
      const plan = await seedSubscriptionPlan(testDb.prisma, {
        name: 'Test Plan',
        price: 999,
      })

      const stripeSubscriptionId = 'sub_test_' + uuid()

      // Create subscription
      const subscription = await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
          stripeSubscriptionId,
          stripeCustomerId: 'cus_test123',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const updateRequest: UpdateSubscriptionFromPaymentRequest = {
        stripeSubscriptionId,
        status: 'PAST_DUE',
        cancelAtPeriodEnd: true,
      }

      const response = await internalClient
        .put('/internal/subscriptions/update-from-payment')
        .send(updateRequest)
        .expect(200)

      expect(response.body).toEqual({ success: true })

      // Verify subscription was updated
      const updatedSubscription = await testDb.prisma.subscription.findUnique({
        where: { id: subscription.id },
      })

      expect(updatedSubscription?.status).toBe('PAST_DUE')
      expect(updatedSubscription?.cancelAtPeriodEnd).toBe(true)
    })

    it('should return 404 for non-existent subscription', async () => {
      const updateRequest: UpdateSubscriptionFromPaymentRequest = {
        stripeSubscriptionId: 'sub_nonexistent',
        status: 'CANCELED',
      }

      await internalClient
        .put('/internal/subscriptions/update-from-payment')
        .send(updateRequest)
        .expect(404)
    })
  })

  describe('POST /internal/subscriptions/check-access', () => {
    it('should check user subscription access', async () => {
      // Create test plan with features
      const plan = await seedSubscriptionPlan(testDb.prisma, {
        name: 'Pro Plan',
        price: 1999,
        features: ['feature1', 'feature2', 'advanced-analytics'],
      })

      // Create active subscription
      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_test123',
          stripeCustomerId: 'cus_test123',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const checkRequest: CheckSubscriptionAccessRequest = {
        userId: testUserIds.member,
        feature: 'advanced-analytics',
      }

      const response = await internalClient
        .post('/internal/subscriptions/check-access')
        .send(checkRequest)
        .expect(200)

      expect(response.body).toMatchObject({
        hasAccess: true,
        subscription: {
          planName: 'Pro Plan',
          status: 'ACTIVE',
          features: expect.arrayContaining(['advanced-analytics']),
        },
      })
    })

    it('should deny access for missing feature', async () => {
      const plan = await seedSubscriptionPlan(testDb.prisma, {
        name: 'Basic Plan',
        features: ['basic-feature'],
      })

      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
        },
      })

      const checkRequest: CheckSubscriptionAccessRequest = {
        userId: testUserIds.member,
        feature: 'premium-feature',
      }

      const response = await internalClient
        .post('/internal/subscriptions/check-access')
        .send(checkRequest)
        .expect(200)

      expect(response.body).toMatchObject({
        hasAccess: false,
        reason: 'Feature not included: premium-feature',
      })
    })

    it('should deny access for wrong plan', async () => {
      const plan = await seedSubscriptionPlan(testDb.prisma, {
        name: 'Basic Plan',
      })

      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
        },
      })

      const checkRequest: CheckSubscriptionAccessRequest = {
        userId: testUserIds.member,
        requiredPlan: 'Pro Plan',
      }

      const response = await internalClient
        .post('/internal/subscriptions/check-access')
        .send(checkRequest)
        .expect(200)

      expect(response.body).toMatchObject({
        hasAccess: false,
        reason: 'Required plan: Pro Plan',
      })
    })

    it('should deny access for inactive subscription', async () => {
      const checkRequest: CheckSubscriptionAccessRequest = {
        userId: testUserIds.member,
      }

      const response = await internalClient
        .post('/internal/subscriptions/check-access')
        .send(checkRequest)
        .expect(200)

      expect(response.body).toMatchObject({
        hasAccess: false,
        reason: 'No active subscription',
      })
    })
  })

  describe('GET /internal/subscriptions/stripe/:stripeSubscriptionId', () => {
    it('should get subscription by Stripe ID', async () => {
      const plan = await seedSubscriptionPlan(testDb.prisma)
      const stripeSubscriptionId = 'sub_test_' + uuid()

      const subscription = await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
          stripeSubscriptionId,
          stripeCustomerId: 'cus_' + uuid(),
        },
      })

      const response = await internalClient
        .get(`/internal/subscriptions/stripe/${stripeSubscriptionId}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: subscription.id,
        userId: subscription.userId,
        status: 'ACTIVE',
        stripeSubscriptionId,
      })
    })

    it('should return 404 for non-existent Stripe ID', async () => {
      await internalClient
        .get('/internal/subscriptions/stripe/sub_nonexistent')
        .expect(404)
    })
  })

  describe('GET /internal/subscriptions/users/:userId/subscriptions', () => {
    it('should get user subscriptions', async () => {
      const plan = await seedSubscriptionPlan(testDb.prisma)

      // Create multiple subscriptions
      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
        },
      })

      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'CANCELED',
        },
      })

      const response = await internalClient
        .get(
          `/internal/subscriptions/users/${testUserIds.member}/subscriptions`,
        )
        .expect(200)

      expect(response.body).toMatchObject({
        subscriptions: expect.any(Array),
        total: 1, // Only active by default
      })
      expect(response.body.subscriptions).toHaveLength(1)
      expect(response.body.subscriptions[0].status).toBe('ACTIVE')
    })

    it('should include inactive subscriptions when requested', async () => {
      const plan = await seedSubscriptionPlan(testDb.prisma)

      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'ACTIVE',
        },
      })

      await testDb.prisma.subscription.create({
        data: {
          userId: testUserIds.member,
          planId: plan.id,
          status: 'CANCELED',
        },
      })

      const response = await internalClient
        .get(
          `/internal/subscriptions/users/${testUserIds.member}/subscriptions?includeInactive=true`,
        )
        .expect(200)

      expect(response.body.subscriptions).toHaveLength(2)
      expect(response.body.total).toBe(2)
    })
  })

  describe('POST /internal/subscriptions/notify', () => {
    it('should send subscription notification', async () => {
      const notifyRequest: SendSubscriptionNotificationRequest = {
        userId: testUserIds.member,
        type: 'CREATED',
        subscriptionData: {
          planName: 'Pro Plan',
          price: '$19.99',
          interval: 'monthly',
          creditsAmount: 100,
        },
      }

      const response = await internalClient
        .post('/internal/subscriptions/notify')
        .send(notifyRequest)
        .expect(200)

      expect(response.body).toEqual({ success: true })
    })

    it('should reject invalid notification type', async () => {
      const notifyRequest = {
        userId: testUserIds.member,
        type: 'INVALID_TYPE',
        subscriptionData: {},
      }

      await internalClient
        .post('/internal/subscriptions/notify')
        .send(notifyRequest)
        .expect(400)
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject all internal endpoints without x-api-key', async () => {
      const endpoints = [
        { method: 'post', path: '/internal/subscriptions/webhook' },
        { method: 'put', path: '/internal/subscriptions/update-from-payment' },
        { method: 'post', path: '/internal/subscriptions/check-access' },
        { method: 'get', path: '/internal/subscriptions/stripe/test' },
        {
          method: 'get',
          path: '/internal/subscriptions/users/test/subscriptions',
        },
        { method: 'post', path: '/internal/subscriptions/notify' },
      ]

      for (const endpoint of endpoints) {
        const request = supertest(app)[endpoint.method](endpoint.path)

        if (endpoint.method !== 'get') {
          request.send({})
        }

        await request.expect(401)
      }
    })

    it('should accept requests with valid service API key', async () => {
      // Just test one endpoint to verify the middleware works
      const validUuid = uuid()
      const response = await internalClient
        .get(`/internal/subscriptions/users/${validUuid}/subscriptions`)
        .expect(200)

      expect(response.body).toMatchObject({
        subscriptions: [],
        total: 0,
      })
    })

    it('should not allow JWT authentication on internal endpoints', async () => {
      // Try to access internal endpoint with user JWT
      await userClient.get('/internal/subscriptions/by-user/test').expect(401)

      // Try with admin JWT
      await adminClient.get('/internal/subscriptions/by-user/test').expect(401)
    })
  })

  afterAll(async () => {
    // Cleanup
    internalAPIHelper.cleanup()
    authHelper.clearTokens()
    await cleanupTestDatabase(testDb)
  })
})
