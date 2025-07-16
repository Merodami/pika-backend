import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika
vi.unmock('@pika

// Force Vitest to use the actual implementation
vi.mock('@pikanc () => {
  const actualApi =
    await vi.importActual<typeof import('@pikap@p@p@p@p@pika

  return actualApi
})

vi.mock('@pikaasync () => {
  const actualShared =
    await vi.importActual<typeof import('@pika('@p@p@p@p@p@pika

  // Mock only the SubscriptionServiceClient
  return {
    ...actualShared,
    SubscriptionServiceClient: vi.fn().mockImplementation(() => ({
      updateSubscriptionStatus: vi.fn().mockResolvedValue({ success: true }),
      updateUserMembership: vi.fn().mockResolvedValue({ success: true }),
      getSubscriptionByStripeId: vi.fn().mockResolvedValue({
        id: 'mock-subscription-id',
        userId: 'test-user-id',
        plan: {
          id: 'test-plan-id',
          creditsAmount: 100,
        },
      }),
      createSubscriptionFromStripe: vi.fn().mockResolvedValue({
        id: 'mock-subscription-id',
        userId: 'test-user-id',
        planId: 'test-plan-id',
        status: 'active',
      }),
      processSubscriptionCredits: vi.fn().mockResolvedValue({ success: true }),
    })),
  }
})

import { PrismaClient } from '@prisma/client'
import { MemoryCacheService } from '@pika
import { logger } from '@pika
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  E2EAuthHelper,
  StripeMockHelper,
} from '@pika
import { UserRole } from '@pika
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createPaymentServer } from '../../../server.js'

// Test data seeding function for memberships
async function seedTestMembership(
  prismaClient: PrismaClient,
  userId: string,
  options?: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    active?: boolean
    planType?: string
  },
): Promise<any> {
  logger.debug('Seeding test membership...')

  const membership = await prismaClient.membership.create({
    data: {
      userId,
      stripeCustomerId: options?.stripeCustomerId || 'cus_test_' + uuid(),
      stripeSubscriptionId: options?.stripeSubscriptionId,
      active: options?.active ?? true,
      subscriptionStatus: options?.stripeSubscriptionId ? 'active' : 'inactive',
      planType: options?.planType || 'basic',
    },
  })

  return membership
}

describe('Payment Service - Membership & Subscription Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let memberClient: AuthenticatedRequestClient

  beforeAll(async () => {
    logger.debug('Setting up Payment Service membership integration tests...')

    // Create test database
    testDb = await createTestDatabase()

    // Create cache service
    const cacheService = new MemoryCacheService()

    // Wait for stripe-mock to be ready
    await StripeMockHelper.waitForStripeMock()

    // Create stripe instance with stripe-mock endpoint
    const stripeInstance = StripeMockHelper.createMockStripeInstance()

    // Create payment server with mock Stripe instance
    const { app: paymentApp } = await createPaymentServer({
      port: 0, // Random port for testing
      host: 'localhost',
      prisma: testDb.prisma,
      cacheService,
      stripeInstance, // Inject stripe-mock instance
    })

    app = paymentApp

    // Setup authentication
    authHelper = createE2EAuthHelper(app)

    // Create test users with different roles
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    memberClient = await authHelper.getMemberClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear database between tests
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      // Clear cached tokens since users will have new IDs
      authHelper.clearTokens()
      // Recreate test users after clearing
      await authHelper.createAllTestUsers(testDb.prisma)

      // Refresh authenticated clients to get new tokens with correct user IDs
      memberClient = await authHelper.getMemberClient(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (authHelper) {
      authHelper.clearTokens()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Membership API Tests
  describe('Membership Management', () => {
    describe('GET /memberships/:id', () => {
      it('should return membership details for authenticated user', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })

        const membership = await seedTestMembership(testDb.prisma, user!.id)

        const response = await memberClient
          .get(`/memberships/${membership.id}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({
          id: membership.id,
          userId: user!.id,
          active: true,
          planType: 'basic',
          subscriptionStatus: 'inactive',
        })
      })
    })

    describe('GET /memberships/user/:userId', () => {
      it('should return membership by user ID', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })

        await seedTestMembership(testDb.prisma, user!.id)

        const response = await memberClient
          .get(`/memberships/user/${user!.id}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({
          userId: user!.id,
          active: true,
        })
      })

      it('should return 404 when user has no membership', async () => {
        const user = await testDb.prisma.user.create({
          data: {
            email: 'nomembership@test.com',
            firstName: 'No',
            lastName: 'Membership',
            role: UserRole.MEMBER,
          },
        })

        await memberClient
          .get(`/memberships/user/${user.id}`)
          .set('Accept', 'application/json')
          .expect(404)
      })
    })

    describe('POST /memberships/create-customer', () => {
      it('should create Stripe customer and membership', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })

        const response = await memberClient
          .post('/memberships/create-customer')
          .send({
            userId: user!.id,
            email: user!.email,
            name: `${user!.firstName} ${user!.lastName}`,
          })
          .set('Accept', 'application/json')

        if (response.status !== 201) {
          console.error('Create customer failed:', response.body)
        }
        expect(response.status).toBe(201)

        expect(response.body).toMatchObject({
          userId: user!.id,
          active: true,
          subscriptionStatus: 'inactive',
        })
        expect(response.body.stripeCustomerId).toBeTruthy()
        expect(response.body.stripeCustomerId).toMatch(/^cus_/)
      })

      it('should reject duplicate membership creation', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })

        await seedTestMembership(testDb.prisma, user!.id)

        await memberClient
          .post('/memberships/create-customer')
          .send({
            userId: user!.id,
            email: user!.email,
            name: `${user!.firstName} ${user!.lastName}`,
          })
          .set('Accept', 'application/json')
          .expect(422)
      })
    })

    describe('DELETE /memberships/:id/subscription', () => {
      it('should cancel subscription', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })
        const membership = await seedTestMembership(testDb.prisma, user!.id, {
          stripeSubscriptionId: 'sub_test_' + uuid(),
        })

        const response = await memberClient
          .delete(`/memberships/${membership.id}/subscription`)
          .set('Accept', 'application/json')
          .expect(200)

        // Stripe typically doesn't immediately cancel - it marks for cancellation at period end
        expect(response.body.subscriptionStatus).toMatch(/active|canceled/)
      })
    })
  })

  // Webhook Tests
  describe('Stripe Webhooks', () => {
    describe('POST /webhooks/stripe', () => {
      it('should handle subscription.deleted webhook', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })
        const membership = await seedTestMembership(testDb.prisma, user!.id, {
          stripeSubscriptionId: 'sub_test_123',
        })

        // Use StripeMockHelper to generate properly formatted webhook event
        const { payload, signature } = StripeMockHelper.generateWebhookEvent(
          'customer.subscription.deleted',
          {
            id: 'sub_test_123',
            status: 'canceled',
            customer: 'cus_test_123',
          },
        )

        const response = await supertest(app)
          .post('/webhooks/stripe')
          .send(payload)
          .set('stripe-signature', signature)
          .set('Content-Type', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({ received: true })

        // Verify membership was updated
        const updatedMembership = await testDb.prisma.membership.findUnique({
          where: { id: membership.id },
        })

        expect(updatedMembership?.subscriptionStatus).toBe('cancelled')
      })

      it('should handle invoice.payment_succeeded webhook', async () => {
        const user = await testDb.prisma.user.findFirst({
          where: { email: 'member@e2etest.com' },
        })
        const membership = await seedTestMembership(testDb.prisma, user!.id, {
          stripeSubscriptionId: 'sub_test_456',
        })

        // Use StripeMockHelper to generate properly formatted webhook event
        const { payload, signature } = StripeMockHelper.generateWebhookEvent(
          'invoice.payment_succeeded',
          {
            id: 'in_test_' + uuid(),
            subscription: 'sub_test_456',
            created: Math.floor(Date.now() / 1000),
            amount_paid: 1000,
            customer: 'cus_test_123',
          },
        )

        const response = await supertest(app)
          .post('/webhooks/stripe')
          .send(payload)
          .set('stripe-signature', signature)
          .set('Content-Type', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({ received: true })

        // Verify membership was updated with payment date
        const updatedMembership = await testDb.prisma.membership.findUnique({
          where: { id: membership.id },
        })

        expect(updatedMembership?.lastPaymentDate).toBeTruthy()
      })
    })
  })
})
