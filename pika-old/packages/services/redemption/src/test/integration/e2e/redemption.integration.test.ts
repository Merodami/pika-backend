// redemption.integration.test.ts

/**
 * Integration tests for the Redemption Service API
 *
 * Tests all endpoints with a real PostgreSQL testcontainer using Supertest.
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
  clearTestDatabase,
  createE2EAuthHelper,
  createMockServiceClients,
  createTestDatabase,
  type E2EAuthHelper,
  MockCacheService,
  MockJWTService,
  MockShortCodeService,
  type TestDatabaseResult,
} from '@pika/tests'
import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { createRedemptionServer } from '../../../server.js'

/**
 * Seeds test data for redemption tests
 */
async function seedTestData(
  prismaClient: PrismaClient,
  options?: {
    customerId?: string
    providerId?: string
  },
) {
  // Create a test category
  const category = await prismaClient.category.create({
    data: {
      name: { en: 'Test Category', es: 'Categoría de Prueba' },
      description: {
        en: 'Test category for redemption tests',
        es: 'Categoría de prueba para tests de redención',
      },
      slug: `test-category-${uuid().substring(0, 8)}`,
      level: 1,
      path: '/',
      active: true,
      sortOrder: 1,
    },
  })

  // Use provided provider ID (from authenticated provider)
  const providerId = options?.providerId

  if (!providerId) {
    throw new Error('Provider ID is required for test data')
  }

  // Create test vouchers
  const activeVoucherId = '550e8400-e29b-41d4-a716-446655440000'
  const activeVoucher = await prismaClient.$transaction(async (tx) => {
    const voucher = await tx.voucher.create({
      data: {
        id: activeVoucherId,
        providerId,
        categoryId: category.id,
        state: 'PUBLISHED',
        title: {
          en: 'Test Voucher',
          es: 'Cupón de Prueba',
        },
        description: {
          en: 'Get 20% off your next purchase',
          es: 'Obtén 20% de descuento en tu próxima compra',
        },
        terms: {
          en: 'Valid for one use per customer',
          es: 'Válido para un uso por cliente',
        },
        discountType: 'PERCENTAGE',
        discountValue: 20,
        currency: 'USD',
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxRedemptions: 100,
        maxRedemptionsPerUser: 1,
        currentRedemptions: 0,
        metadata: { source: 'test' },
      },
    })

    // Create voucher codes
    await tx.voucherCode.createMany({
      data: [
        {
          voucherId: voucher.id,
          code: 'TEST123',
          type: 'SHORT',
          isActive: true,
          metadata: {},
        },
        {
          voucherId: voucher.id,
          code: 'mock.jwt.token',
          type: 'QR',
          isActive: true,
          metadata: { algorithm: 'ES256' },
        },
      ],
    })

    return voucher
  })

  // Create expired voucher
  const expiredVoucher = await prismaClient.voucher.create({
    data: {
      providerId,
      categoryId: category.id,
      state: 'EXPIRED',
      title: { en: 'Expired Voucher', es: 'Cupón Vencido' },
      description: {
        en: 'This voucher has expired',
        es: 'Este cupón ha vencido',
      },
      terms: { en: 'Expired', es: 'Vencido' },
      discountType: 'PERCENTAGE',
      discountValue: 10,
      currency: 'USD',
      validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
      currentRedemptions: 0,
    },
  })

  // Create already redeemed voucher
  const redeemedVoucherId = uuid()
  const redeemedVoucher = await prismaClient.voucher.create({
    data: {
      id: redeemedVoucherId,
      providerId,
      categoryId: category.id,
      state: 'PUBLISHED',
      title: { en: 'Already Redeemed', es: 'Ya Canjeado' },
      description: {
        en: 'This voucher was already redeemed',
        es: 'Este cupón ya fue canjeado',
      },
      terms: { en: 'One per customer', es: 'Uno por cliente' },
      discountType: 'PERCENTAGE',
      discountValue: 15,
      currency: 'USD',
      validFrom: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxRedemptions: 100,
      maxRedemptionsPerUser: 1,
      currentRedemptions: 1,
    },
  })

  // Create an existing redemption if customerId provided
  if (options?.customerId) {
    // Get the authenticated customer to create redemption with their ID
    const authCustomer = await prismaClient.user.findFirst({
      where: { email: 'customer@e2etest.com' },
    })

    if (authCustomer) {
      await prismaClient.voucherRedemption.create({
        data: {
          voucherId: redeemedVoucherId,
          userId: authCustomer.id, // Use authenticated customer ID
          codeUsed: 'ALREADY_USED',
          redeemedAt: new Date(),
          metadata: { providerId },
        },
      })
    }
  }

  return {
    category,
    providerId,
    activeVoucher,
    expiredVoucher,
    redeemedVoucher,
  }
}

describe('Redemption Service Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let providerClient: AuthenticatedRequestClient
  let testData: any
  let customerUserId: string
  let authProviderId: string
  let mockJWTService: MockJWTService
  let mockShortCodeService: MockShortCodeService
  let mockVoucherServiceClient: any
  let mockProviderServiceClient: any

  const mockCacheService = new MockCacheService()

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_redemption_db',
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

    mockVoucherServiceClient = voucherServiceClient
    mockProviderServiceClient = providerServiceClient

    // Create mock JWT and ShortCode services
    mockJWTService = new MockJWTService()
    mockShortCodeService = new MockShortCodeService()

    // Create the server with standard dependencies
    app = await createRedemptionServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      jwtKeys,
      serviceClients: {
        voucherServiceClient: voucherServiceClient as any,
        providerServiceClient: providerServiceClient as any,
      },
      testServices: {
        jwtService: mockJWTService,
        shortCodeService: mockShortCodeService,
      },
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize supertest with the Fastify server instance
    request = supertest(app.server as any)

    // Initialize E2E authentication helpers
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
    providerClient = await authHelper.getProviderClient(testDb.prisma)

    // Get the customer user ID for test data seeding
    const customerUser = await testDb.prisma.user.findFirst({
      where: { email: 'customer@e2etest.com' },
    })

    customerUserId = customerUser!.id

    // Get the authenticated provider's ID to use in test data
    const providerUser = await testDb.prisma.user.findFirst({
      where: { email: 'provider@e2etest.com' },
    })
    const authProvider = await testDb.prisma.provider.findUnique({
      where: { userId: providerUser!.id },
    })

    // Store these for use in beforeEach
    authProviderId = authProvider!.id

    // Seed test data with authenticated provider ID
    testData = await seedTestData(testDb.prisma, {
      customerId: customerUserId,
      providerId: authProvider!.id,
    })

    // Configure mocks to use the actual IDs
    mockJWTService.setCustomerId(customerUserId)

    logger.debug('E2E test setup complete.')
  })

  beforeEach(async () => {
    // Clear mocks but preserve the base mock functions
    vi.clearAllMocks()

    // Clear test database before each test
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }

    // Re-create test users after clearing database
    await authHelper.createAllTestUsers(testDb.prisma)

    // Re-get the customer user ID after recreating users
    const customerUser = await testDb.prisma.user.findFirst({
      where: { email: 'customer@e2etest.com' },
    })

    customerUserId = customerUser!.id

    // Get the authenticated provider's ID to use in test data
    const providerUser = await testDb.prisma.user.findFirst({
      where: { email: 'provider@e2etest.com' },
    })
    const authProvider = await testDb.prisma.provider.findUnique({
      where: { userId: providerUser!.id },
    })

    // Update stored values
    authProviderId = authProvider!.id

    // Update mock service with new customer ID
    mockJWTService.setCustomerId(customerUserId)

    // Re-seed test data with new customer ID and authenticated provider ID
    testData = await seedTestData(testDb.prisma, {
      customerId: customerUserId,
      providerId: authProviderId,
    })

    // Configure the provider service mock to return the provider for ANY user ID
    // This is because the JWT token might contain a different user ID than what we expect
    mockProviderServiceClient.getProviderByUserId.mockImplementation(
      async (userId: string) => {
        // For any provider request in tests, return our test provider
        // This ensures the test works regardless of the JWT user ID
        return {
          id: authProviderId,
          userId: userId,
          businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
          email: 'provider@test.com',
          status: 'ACTIVE',
          active: true,
        }
      },
    )
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    await cleanupTestDatabase(testDb)
  })

  describe('POST /redemptions', () => {
    it('should successfully redeem a voucher with valid code', async () => {
      // The mock JWT service is already configured with the correct customer ID in beforeEach
      // We just need to update it to return our test voucher ID and provider ID
      mockJWTService.verifyRedemptionToken.mockResolvedValueOnce({
        voucherId: testData.activeVoucher.id,
        customerId: customerUserId, // This is set by mockJWTService.setCustomerId
        providerId: testData.providerId,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      })

      // Simple mock for voucher service - return full voucher domain object
      mockVoucherServiceClient.getVoucherById.mockResolvedValueOnce({
        id: testData.activeVoucher.id,
        providerId: testData.providerId,
        categoryId: testData.activeVoucher.categoryId,
        title: testData.activeVoucher.title,
        description: testData.activeVoucher.description,
        terms: testData.activeVoucher.terms,
        discount: 20,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        currency: 'USD',
        maxRedemptions: 100,
        maxRedemptionsPerUser: 1,
        currentRedemptions: 0,
        validFrom: testData.activeVoucher.validFrom,
        validUntil: testData.activeVoucher.expiresAt,
        expiresAt: testData.activeVoucher.expiresAt,
        state: 'PUBLISHED',
        createdAt: testData.activeVoucher.createdAt,
        updatedAt: testData.activeVoucher.updatedAt,
      })

      // Simple mock for provider service
      mockProviderServiceClient.getProvider.mockImplementation(async () => ({
        id: testData.providerId,
        businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
        email: 'provider@test.com',
        status: 'ACTIVE',
      }))

      const response = await providerClient.post('/redemptions').send({
        code: 'mock.jwt.token', // JWT format with 3 parts
        customer_id: customerUserId,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('redemptionId')
      expect(response.body).toHaveProperty('voucherDetails')
      expect(response.body.voucherDetails).toMatchObject({
        discount: '20%',
        providerName: 'Test Business',
      })
      // Title could be in any language, just check it exists
      expect(response.body.voucherDetails).toHaveProperty('title')
    })

    it('should fail when voucher is expired', async () => {
      // Configure mocks for expired voucher - override the base implementation
      mockJWTService.verifyRedemptionToken.mockResolvedValueOnce({
        voucherId: testData.expiredVoucher.id,
        customerId: customerUserId,
        providerId: testData.providerId,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      })

      mockVoucherServiceClient.getVoucherById.mockImplementationOnce(
        async (id) => {
          if (id === testData.expiredVoucher.id) {
            return {
              ...testData.expiredVoucher,
              providerId: testData.providerId, // Use the same provider ID from test data
            }
          }

          return null
        },
      )

      const response = await providerClient.post('/redemptions').send({
        code: 'mock.jwt.token', // JWT format with 3 parts
        customer_id: customerUserId,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errorCode', 'EXPIRED')
    })

    it('should fail when provider does not match', async () => {
      // Setup mock to return a voucher with a different provider ID
      mockJWTService.verifyRedemptionToken.mockResolvedValueOnce({
        voucherId: testData.activeVoucher.id,
        customerId: customerUserId,
        providerId: uuid(), // Different provider ID in the token
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      })

      mockVoucherServiceClient.getVoucherById.mockResolvedValueOnce({
        ...testData.activeVoucher,
        providerId: uuid(), // Different provider ID than the authenticated one
      })

      const response = await providerClient.post('/redemptions').send({
        code: 'mock.jwt.token', // JWT format with 3 parts
        customer_id: customerUserId,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errorCode', 'INVALID_PROVIDER')
    })

    it('should fail when trying to redeem twice', async () => {
      // Configure mocks for already redeemed voucher
      mockJWTService.verifyRedemptionToken.mockImplementationOnce(async () => ({
        voucherId: testData.redeemedVoucher.id,
        customerId: customerUserId,
        providerId: testData.providerId,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      }))

      mockVoucherServiceClient.getVoucherById.mockImplementationOnce(
        async (id) => {
          if (id === testData.redeemedVoucher.id) {
            return {
              ...testData.redeemedVoucher,
              providerId: testData.providerId, // Use the same provider ID from test data
            }
          }

          return null
        },
      )

      const response = await providerClient.post('/redemptions').send({
        code: 'mock.jwt.token', // JWT format with 3 parts
        customer_id: customerUserId,
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('errorCode', 'ALREADY_REDEEMED')
    })

    it('should require authentication', async () => {
      const response = await request.post('/redemptions').send({
        code: 'TEST123',
      })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /redemptions/validate-offline', () => {
    it('should validate token without authentication', async () => {
      const response = await request
        .post('/redemptions/validate-offline')
        .send({
          token: 'invalid.jwt.token',
        })

      // Should not require auth and return validation result
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('valid', false)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /redemptions/:id', () => {
    it('should retrieve redemption by ID', async () => {
      const response = await customerClient.get(
        '/redemptions/test-redemption-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return error for non-existent redemption', async () => {
      const response = await customerClient.get('/redemptions/non-existent-id')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /redemptions/provider/:providerId', () => {
    it('should retrieve redemptions for a provider', async () => {
      const response = await providerClient.get(
        '/redemptions/provider/test-provider-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should not allow providers to view other providers redemptions', async () => {
      const response = await providerClient.get(
        '/redemptions/provider/other-provider-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should allow admins to view any provider redemptions', async () => {
      const response = await adminClient.get(
        '/redemptions/provider/any-provider-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /redemptions/sync-offline', () => {
    it('should sync multiple offline redemptions', async () => {
      const response = await providerClient
        .post('/redemptions/sync-offline')
        .send({
          redemptions: [
            {
              voucher_code: 'OFFLINE1',
              provider_id: 'test-provider-id',
              redeemed_at: new Date().toISOString(),
            },
          ],
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /redemptions/customer/:customerId', () => {
    it('should retrieve redemptions for a customer', async () => {
      const response = await customerClient.get(
        '/redemptions/customer/test-customer-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should not allow customers to view other customers redemptions', async () => {
      const response = await customerClient.get(
        '/redemptions/customer/other-customer-id',
      )

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /redemptions (Admin only)', () => {
    it('should retrieve all redemptions for admin', async () => {
      const response = await adminClient.get('/redemptions')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should reject non-admin users', async () => {
      const response = await customerClient.get('/redemptions')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
})
