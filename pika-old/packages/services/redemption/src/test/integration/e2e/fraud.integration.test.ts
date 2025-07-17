// fraud.integration.test.ts

/**
 * Integration tests for the Fraud Management API
 *
 * Tests all fraud endpoints with a real PostgreSQL testcontainer using Supertest.
 */
import { vi } from 'vitest' // vi must be imported to be used

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared // Return all actual exports
})
// --- END MOCKING CONFIGURATION ---

import { logger } from '@pika/shared'
import {
  type AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createMockServiceClients,
  createTestDatabase,
  type E2EAuthHelper,
  MockCacheService,
  type TestDatabaseResult,
} from '@pika/tests'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createRedemptionServer } from '../../../server.js'
import { PrismaFraudCaseRepository } from '../../../write/infrastructure/persistence/pgsql/repositories/PrismaFraudCaseRepository.js'

describe('Fraud Management Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let providerClient: AuthenticatedRequestClient
  let fraudCaseRepo: PrismaFraudCaseRepository

  const mockCacheService = new MockCacheService()

  // Test data IDs - using different UUIDs to avoid conflicts with E2E auth helper
  let testProviderId: string // Will be set after getting the E2E auth provider
  let testProviderUserId: string // Will be set after getting the E2E auth provider user
  let testCustomerId: string // Will be set after getting the E2E auth customer
  let mockProviderServiceClient: any // Store reference to mock service client

  const testCustomerIdForSetup = '00000000-0000-0000-0000-000000000102'
  const testVoucherId = '00000000-0000-0000-0000-000000000103'
  const testRedemptionId = '00000000-0000-0000-0000-000000000104'
  const testCategoryId = '00000000-0000-0000-0000-000000000100'

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_fraud_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create test JWT keys - must be at least 32 characters for ShortCodeService
    const jwtKeys = {
      privateKey:
        'test-redemption-private-key-must-be-at-least-32-characters-long',
      publicKey:
        'test-redemption-public-key-must-be-at-least-32-characters-long',
    }

    // Create mock service clients
    const { voucherServiceClient, providerServiceClient } =
      createMockServiceClients()

    // Store reference to provider service client for test configuration
    mockProviderServiceClient = providerServiceClient

    // Create the server with standard dependencies
    app = await createRedemptionServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      jwtKeys,
      serviceClients: {
        voucherServiceClient: voucherServiceClient as any,
        providerServiceClient: providerServiceClient as any,
      },
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize supertest with the Fastify server instance
    // Supertest initialized but not stored - using auth clients instead

    // Initialize E2E authentication helpers
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
    providerClient = await authHelper.getProviderClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Initialize repository for test setup
    fraudCaseRepo = new PrismaFraudCaseRepository(testDb.prisma)

    // Get the provider created by E2E auth helper
    const providerUser = await testDb.prisma.user.findUnique({
      where: { email: 'provider@e2etest.com' },
      include: { provider: true },
    })

    if (providerUser?.provider) {
      testProviderId = providerUser.provider.id
      testProviderUserId = providerUser.id
      logger.debug('Using E2E auth provider', {
        testProviderId,
        testProviderUserId,
        email: providerUser.email,
      })
    } else {
      throw new Error('E2E auth provider not found')
    }

    // Get the customer created by E2E auth helper
    const customerUser = await testDb.prisma.user.findUnique({
      where: { email: 'customer@e2etest.com' },
    })

    if (customerUser) {
      testCustomerId = customerUser.id
      logger.debug('Using E2E auth customer', {
        testCustomerId,
        email: customerUser.email,
      })
    } else {
      throw new Error('E2E auth customer not found')
    }

    // Setup test data
    await setupTestData()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear cache to avoid idempotency conflicts between tests
    await mockCacheService.clearAll()

    // Configure the stored provider service mock to return the correct provider
    mockProviderServiceClient.getProviderByUserId.mockImplementation(
      async (userId: string) => {
        if (userId === testProviderUserId) {
          return {
            id: testProviderId,
            userId: testProviderUserId,
            businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
            email: 'provider@e2etest.com',
            status: 'ACTIVE',
            active: true,
          }
        }

        return null
      },
    )

    // Clear database before each test to ensure isolation
    if (testDb?.prisma) {
      // Delete in reverse order of dependencies to avoid foreign key constraint violations
      await testDb.prisma.fraudCase.deleteMany({})
      await testDb.prisma.voucherRedemption.deleteMany({})
      await testDb.prisma.voucher.deleteMany({})

      // Delete providers before users (to avoid foreign key constraint)
      await testDb.prisma.provider.deleteMany({
        where: {
          userId: {
            in: [
              testCustomerIdForSetup,
              '00000000-0000-0000-0000-000000000098',
            ],
          },
        },
      })

      // Now delete the test users
      await testDb.prisma.user.deleteMany({
        where: {
          id: {
            in: [
              testCustomerIdForSetup,
              '00000000-0000-0000-0000-000000000098',
            ],
          },
        },
      })

      await testDb.prisma.category.deleteMany({
        where: {
          id: testCategoryId,
        },
      })
    }
    // Re-setup test data for each test
    await setupTestData()
  })

  afterAll(async () => {
    await app.close()
    await cleanupTestDatabase(testDb)
  })

  async function setupTestData() {
    try {
      // Create system user for fraud case history (if not exists)
      await testDb.prisma.user.upsert({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'system@internal.pika',
          firstName: 'System',
          lastName: 'User',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      // Create a test category first (required for providers)
      await testDb.prisma.category.create({
        data: {
          id: testCategoryId,
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: {
            en: 'Test category for fraud tests',
            es: 'Categoría de prueba para pruebas de fraude',
          },
          slug: 'test-category-fraud',
          level: 1,
          path: '/',
          active: true,
          sortOrder: 1,
        },
      })

      // Create a test customer user
      await testDb.prisma.user.create({
        data: {
          id: testCustomerIdForSetup,
          email: 'fraud-test-customer@example.com',
          firstName: 'Test',
          lastName: 'Customer',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      })

      // Create a test voucher using the E2E auth provider
      await testDb.prisma.voucher.create({
        data: {
          id: testVoucherId,
          providerId: testProviderId,
          categoryId: testCategoryId,
          state: 'PUBLISHED',
          title: { en: 'Test Voucher', es: 'Cupón de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          terms: { en: 'Test terms', es: 'Términos de prueba' },
          discountType: 'PERCENTAGE',
          discountValue: 20,
          validFrom: new Date(),
          expiresAt: new Date(Date.now() + 86400000), // +1 day
        },
      })

      // Create a test redemption (requires voucherId and userId)
      await testDb.prisma.voucherRedemption.create({
        data: {
          id: testRedemptionId,
          voucherId: testVoucherId,
          userId: testCustomerIdForSetup,
          codeUsed: 'TEST-CODE-123',
          redeemedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error('Error setting up test data', { error })
      throw error
    }
  }

  describe('POST /fraud/cases', () => {
    it('should create a fraud case', async () => {
      const fraudCase = await fraudCaseRepo.createCase({
        redemptionId: testRedemptionId,
        riskScore: 85,
        flags: [
          {
            type: 'RAPID_REDEMPTION',
            severity: 'HIGH',
            message: 'Multiple redemptions within 1 minute',
          },
        ],
        customerId: testCustomerIdForSetup,
        providerId: testProviderId,
        voucherId: testVoucherId,
      })

      expect(fraudCase).toBeDefined()
      expect(fraudCase.caseNumber).toMatch(/^FRAUD-\d{4}-\d{4}$/)
      expect(fraudCase.status).toBe('PENDING')
    })
  })

  describe('GET /fraud/cases', () => {
    it('should list fraud cases for providers', async () => {
      const response = await providerClient.get('/fraud/cases')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
    })

    it('should filter fraud cases by status', async () => {
      const response = await providerClient.get('/fraud/cases?status=PENDING')

      expect(response.status).toBe(200)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((item: any) => {
        expect(item.status).toBe('PENDING')
      })
    })

    it('should filter fraud cases by risk score', async () => {
      const response = await providerClient.get(
        '/fraud/cases?min_risk_score=80',
      )

      expect(response.status).toBe(200)
      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((item: any) => {
        expect(item.risk_score).toBeGreaterThanOrEqual(80)
      })
    })
  })

  describe('GET /fraud/cases/:id', () => {
    it('should get fraud case details', async () => {
      // First create a case
      const fraudCase = await fraudCaseRepo.createCase({
        redemptionId: testRedemptionId,
        riskScore: 75,
        flags: [
          {
            type: 'VELOCITY',
            severity: 'MEDIUM',
            message: 'High travel speed detected',
          },
        ],
        customerId: testCustomerIdForSetup,
        providerId: testProviderId,
        voucherId: testVoucherId,
      })

      const response = await providerClient.get(`/fraud/cases/${fraudCase.id}`)

      if (response.status !== 200) {
        console.error('Fraud case GET error:', response.status, response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id', fraudCase.id)
      expect(response.body).toHaveProperty('case_number', fraudCase.caseNumber)
      expect(response.body).toHaveProperty('risk_score', 75)
      expect(response.body.flags).toHaveLength(1)
    })

    it('should return 404 for non-existent case', async () => {
      const response = await providerClient.get(
        '/fraud/cases/00000000-0000-0000-0000-000000000999',
      )

      expect(response.status).toBe(404)
    })

    it('should prevent providers from viewing other provider cases', async () => {
      // Create another provider
      const otherProviderId = '00000000-0000-0000-0000-000000000099'
      const otherUserId = '00000000-0000-0000-0000-000000000098'

      // Create user for the other provider
      await testDb.prisma.user.create({
        data: {
          id: otherUserId,
          email: 'other-provider@example.com',
          firstName: 'Other',
          lastName: 'Provider',
          role: 'PROVIDER',
          status: 'ACTIVE',
        },
      })

      await testDb.prisma.provider.create({
        data: {
          id: otherProviderId,
          userId: otherUserId,
          businessName: { en: 'Other Provider' },
          businessDescription: { en: 'Other' },
          categoryId: testCategoryId,
        },
      })

      // Create a case for the other provider
      const fraudCase = await fraudCaseRepo.createCase({
        redemptionId: testRedemptionId,
        riskScore: 60,
        flags: [],
        customerId: testCustomerIdForSetup,
        providerId: otherProviderId,
        voucherId: testVoucherId,
      })

      const response = await providerClient.get(`/fraud/cases/${fraudCase.id}`)

      expect(response.status).toBe(422) // Business rule violation
    })
  })

  describe('PUT /fraud/cases/:id/review', () => {
    it('should review a fraud case', async () => {
      // Create a pending case
      const fraudCase = await fraudCaseRepo.createCase({
        redemptionId: testRedemptionId,
        riskScore: 90,
        flags: [
          {
            type: 'LOCATION_ANOMALY',
            severity: 'HIGH',
            message: 'Unusual location detected',
          },
        ],
        customerId: testCustomerIdForSetup,
        providerId: testProviderId,
        voucherId: testVoucherId,
      })

      const response = await providerClient.put(
        `/fraud/cases/${fraudCase.id}/review`,
        {
          status: 'REJECTED',
          notes: 'Confirmed fraudulent activity',
          actions: [
            {
              type: 'block_customer',
              details: { duration_days: 30 },
            },
          ],
        },
      )

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'REJECTED')
      expect(response.body).toHaveProperty('reviewed_by', testProviderUserId)
      expect(response.body).toHaveProperty('review_notes')
      expect(response.body.actions_taken).toHaveLength(1)
    })

    it('should not allow reviewing already reviewed cases', async () => {
      // Create and review a case
      const fraudCase = await fraudCaseRepo.createCase({
        redemptionId: testRedemptionId,
        riskScore: 50,
        flags: [],
        customerId: testCustomerIdForSetup,
        providerId: testProviderId,
        voucherId: testVoucherId,
      })

      // First review
      await providerClient.put(`/fraud/cases/${fraudCase.id}/review`, {
        status: 'APPROVED',
        notes: 'False positive',
      })

      // Try to review again
      const response = await providerClient.put(
        `/fraud/cases/${fraudCase.id}/review`,
        {
          status: 'REJECTED',
          notes: 'Changed my mind',
        },
      )

      expect(response.status).toBe(422) // Business rule violation
    })
  })

  describe('GET /fraud/statistics', () => {
    it('should get fraud statistics', async () => {
      const response = await providerClient.get('/fraud/statistics')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('total_cases')
      expect(response.body).toHaveProperty('pending_cases')
      expect(response.body).toHaveProperty('false_positive_rate')
      expect(response.body).toHaveProperty('average_risk_score')
      expect(response.body).toHaveProperty('top_fraud_types')
      expect(response.body).toHaveProperty('risk_score_distribution')
      expect(response.body.risk_score_distribution).toHaveProperty('low')
      expect(response.body.risk_score_distribution).toHaveProperty('medium')
      expect(response.body.risk_score_distribution).toHaveProperty('high')
    })

    it('should filter statistics by period', async () => {
      const response = await providerClient.get('/fraud/statistics?period=week')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('total_cases')
    })
  })

  describe('GET /redemptions/fraud-logs', () => {
    it('should get fraud logs for providers', async () => {
      const response = await providerClient.get(
        `/redemptions/fraud-logs?type=provider&id=${testProviderId}`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('logs')
      expect(response.body.logs).toBeInstanceOf(Array)
    })

    it('should get fraud logs for customers', async () => {
      const response = await customerClient.get(
        `/redemptions/fraud-logs?type=customer&id=${testCustomerId}`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('logs')
      expect(response.body.logs).toBeInstanceOf(Array)
    })

    it('should require admin access for admin logs', async () => {
      const response = await providerClient.get(
        '/redemptions/fraud-logs?type=admin',
      )

      expect(response.status).toBe(422) // Business rule violation
    })

    it('should get admin fraud logs', async () => {
      const response = await adminClient.get(
        '/redemptions/fraud-logs?type=admin',
      )

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('logs')
    })
  })
})
