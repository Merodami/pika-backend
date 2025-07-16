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

  return actualShared
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
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createPaymentServer } from '../../../server.js'

// Test data seeding function for credits
async function seedTestCredits(
  prismaClient: PrismaClient,
  userId: string,
  options?: { demandCredits?: number; subCredits?: number },
): Promise<any> {
  logger.debug('Seeding test credits...')

  const credits = await prismaClient.credits.create({
    data: {
      userId,
      amountDemand: options?.demandCredits || 100,
      amountSub: options?.subCredits || 50,
    },
  })

  return credits
}

// Test data seeding for promo codes
async function seedTestPromoCodes(prismaClient: PrismaClient): Promise<any[]> {
  logger.debug('Seeding test promo codes...')

  const validPromoCode = await prismaClient.promoCode.create({
    data: {
      code: 'VALID20',
      discount: 20,
      active: true,
      allowedTimes: 100,
      amountAvailable: 100,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdBy: uuid(),
    },
  })

  const expiredPromoCode = await prismaClient.promoCode.create({
    data: {
      code: 'EXPIRED50',
      discount: 50,
      active: true,
      allowedTimes: 100,
      amountAvailable: 100,
      expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      createdBy: uuid(),
    },
  })

  const exhaustedPromoCode = await prismaClient.promoCode.create({
    data: {
      code: 'EXHAUSTED30',
      discount: 30,
      active: true,
      allowedTimes: 100,
      amountAvailable: 0, // No uses left
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      createdBy: uuid(),
    },
  })

  return [validPromoCode, expiredPromoCode, exhaustedPromoCode]
}

describe('Payment Service - Credits Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let memberClient: AuthenticatedRequestClient
  let professionalClient: AuthenticatedRequestClient

  beforeAll(async () => {
    logger.debug('Setting up Payment Service integration tests...')

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
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    memberClient = await authHelper.getMemberClient(testDb.prisma)
    professionalClient = await authHelper.getProfessionalClient(testDb.prisma)

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
      adminClient = await authHelper.getAdminClient(testDb.prisma)
      memberClient = await authHelper.getMemberClient(testDb.prisma)
      professionalClient = await authHelper.getProfessionalClient(testDb.prisma)
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

  // Credits Read API Tests
  describe('GET /credits/users/:userId', () => {
    it('should return user credits when authenticated as owner', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id)

      const response = await memberClient
        .get(`/credits/users/${user!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        userId: user!.id,
        amountDemand: 100,
        amountSub: 50,
      })
    })

    it('should return 403 when accessing other user credits as member', async () => {
      const otherUser = await testDb.prisma.user.create({
        data: {
          email: 'other@test.com',
          firstName: 'Other',
          lastName: 'User',
          role: UserRole.MEMBER,
        },
      })

      await seedTestCredits(testDb.prisma, otherUser.id)

      await memberClient
        .get(`/credits/users/${otherUser.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should allow admin to view any user credits', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id)

      const response = await adminClient
        .get(`/credits/users/${user!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('userId', user!.id)
    })
  })

  // Credits History API Tests
  describe('GET /credits/users/:userId/history', () => {
    it('should return user credits history', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })
      const credits = await seedTestCredits(testDb.prisma, user!.id)

      // Create some history
      await testDb.prisma.creditsHistory.create({
        data: {
          userId: user!.id,
          creditsId: credits.id,
          amount: 10,
          description: 'Test purchase',
          operation: 'increase',
          type: 'demand',
        },
      })

      const response = await memberClient
        .get(`/credits/users/${user!.id}/history`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        amount: 10,
        description: 'Test purchase',
        operation: 'increase',
        type: 'demand',
      })
    })
  })

  // Credits Consumption API Tests
  describe('POST /credits/users/:userId/consume', () => {
    it('should consume user credits successfully', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id, {
        demandCredits: 100,
        subCredits: 50,
      })

      const response = await memberClient
        .post(`/credits/users/${user!.id}/consume`)
        .send({
          demandAmount: 10,
          subAmount: 5,
          description: 'Test session booking',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        amountDemand: 90, // 100 - 10
        amountSub: 45, // 50 - 5
      })
    })

    it('should fail when consuming more credits than available', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id, {
        demandCredits: 10,
        subCredits: 5,
      })

      await memberClient
        .post(`/credits/users/${user!.id}/consume`)
        .send({
          demandAmount: 20,
          subAmount: 10,
          description: 'Test over-consumption',
        })
        .set('Accept', 'application/json')
        .expect(422) // BusinessRuleViolationError returns 422 Unprocessable Entity
    })
  })

  // Smart Credits Consumption API Tests
  describe('POST /credits/users/:userId/consume-smart', () => {
    it('should consume subscription credits first', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id, {
        demandCredits: 100,
        subCredits: 50,
      })

      const response = await memberClient
        .post(`/credits/users/${user!.id}/consume-smart`)
        .send({
          totalAmount: 30,
          description: 'Test smart consumption',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        amountDemand: 100, // Unchanged
        amountSub: 20, // 50 - 30
      })
    })

    it('should use both subscription and demand credits when needed', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      await seedTestCredits(testDb.prisma, user!.id, {
        demandCredits: 100,
        subCredits: 20,
      })

      const response = await memberClient
        .post(`/credits/users/${user!.id}/consume-smart`)
        .send({
          totalAmount: 50,
          description: 'Test overflow consumption',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        amountDemand: 70, // 100 - (50 - 20)
        amountSub: 0, // All consumed
      })
    })
  })

  // Credits Transfer API Tests
  describe('POST /credits/users/:userId/transfer', () => {
    it('should allow member to transfer credits within limit', async () => {
      const fromUser = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })
      const toUser = await testDb.prisma.user.create({
        data: {
          email: 'recipient@test.com',
          firstName: 'Recipient',
          lastName: 'User',
          role: UserRole.MEMBER,
        },
      })

      await seedTestCredits(testDb.prisma, fromUser!.id, { demandCredits: 100 })

      const response = await memberClient
        .post(`/credits/users/${fromUser!.id}/transfer`)
        .send({
          toUserId: toUser.id,
          amount: 30,
          description: 'Test transfer',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.from).toMatchObject({
        amountDemand: 70, // 100 - 30
      })
      expect(response.body.to).toMatchObject({
        amountDemand: 30,
      })
    })

    it('should reject member transfer above limit (50 credits)', async () => {
      const fromUser = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })
      const toUser = await testDb.prisma.user.create({
        data: {
          email: 'recipient@test.com',
          firstName: 'Recipient',
          lastName: 'User',
          role: UserRole.MEMBER,
        },
      })

      await seedTestCredits(testDb.prisma, fromUser!.id, { demandCredits: 100 })

      const response = await memberClient
        .post(`/credits/users/${fromUser!.id}/transfer`)
        .send({
          toUserId: toUser.id,
          amount: 60, // Above 50 limit
          description: 'Test large transfer',
        })
        .set('Accept', 'application/json')
        .expect(422)

      expect(response.body.error.message).toContain('Transfer limit exceeded')
    })

    it('should allow professional to transfer unlimited credits', async () => {
      const fromUser = await testDb.prisma.user.findFirst({
        where: { email: 'professional@e2etest.com' },
      })
      const toUser = await testDb.prisma.user.create({
        data: {
          email: 'recipient@test.com',
          firstName: 'Recipient',
          lastName: 'User',
          role: UserRole.MEMBER,
        },
      })

      await seedTestCredits(testDb.prisma, fromUser!.id, { demandCredits: 200 })

      const response = await professionalClient
        .post(`/credits/users/${fromUser!.id}/transfer`)
        .send({
          toUserId: toUser.id,
          amount: 150, // Above member limit
          description: 'Professional large transfer',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.from).toMatchObject({
        amountDemand: 50, // 200 - 150
      })
    })
  })

  // Promo Code API Tests
  describe('POST /credits/add-credits', () => {
    it('should add credits with valid promo code', async () => {
      await seedTestPromoCodes(testDb.prisma)

      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      const response = await memberClient
        .post('/credits/add-credits')
        .send({
          creditsObject: {
            userId: user!.id,
            amountDemand: 50,
          },
          promoCode: 'VALID20',
          price: 10,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'Credits added!',
        credits: {
          userId: user!.id,
          amountDemand: 50,
        },
      })
    })

    it('should reject expired promo code with exact error message', async () => {
      await seedTestPromoCodes(testDb.prisma)

      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      const response = await memberClient
        .post('/credits/add-credits')
        .send({
          creditsObject: {
            userId: user!.id,
            amountDemand: 50,
          },
          promoCode: 'EXPIRED50',
          price: 10,
        })
        .set('Accept', 'application/json')
        .expect(500)

      expect(response.body.error.message).toBe('Unavailable promotional code.')
    })

    it('should reject non-existent promo code with exact error message', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      const response = await memberClient
        .post('/credits/add-credits')
        .send({
          creditsObject: {
            userId: user!.id,
            amountDemand: 50,
          },
          promoCode: 'NONEXISTENT',
          price: 10,
        })
        .set('Accept', 'application/json')
        .expect(500)

      expect(response.body.error.message).toBe(
        'Promotional code does not exists.',
      )
    })
  })

  // Admin Credit Management Tests
  describe('Admin Credit Operations', () => {
    it('should allow admin to manually add credits', async () => {
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'member@e2etest.com' },
      })

      const response = await adminClient
        .post(`/credits/users/${user!.id}/add`)
        .send({
          amount: 100,
          description: 'Admin credit adjustment',
        })
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.error('Admin add credits failed:', response.body)
      }
      expect(response.status).toBe(200)

      expect(response.body).toMatchObject({
        amountDemand: 100,
      })
    })

    it('should allow admin to create new credits record', async () => {
      const user = await testDb.prisma.user.create({
        data: {
          email: 'newuser@test.com',
          firstName: 'New',
          lastName: 'User',
          role: UserRole.MEMBER,
        },
      })

      const response = await adminClient
        .post('/credits')
        .send({
          userId: user.id,
          amountDemand: 50,
          amountSub: 25,
        })
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body).toMatchObject({
        userId: user.id,
        amountDemand: 50,
        amountSub: 25,
      })
    })
  })
})
