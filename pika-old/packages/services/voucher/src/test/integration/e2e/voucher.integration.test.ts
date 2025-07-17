// voucher.integration.test.ts

/**
 * Integration tests for the Voucher Service API
 *
 * Tests all endpoints with a real PostgreSQL (PostGIS) testcontainer using Supertest.
 */
import { vi } from 'vitest' // vi must be imported to be used

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
// This overrides any global mocks (e.g., from setupTests.ts).
// Assumes '@pika/api' is now fixed and can be imported without internal errors.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
// This is to ensure that functions like 'createSystemHealthCheck' are available
// and not overridden by a potentially incomplete global mock from setupTests.ts.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared // Return all actual exports
})
// --- END MOCKING CONFIGURATION ---

import { PrismaClient } from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import supertest from 'supertest' // Re-added supertest
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { v4 as uuid } from 'uuid' // Example: using the uuid package

import { createVoucherServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Placeholder for your seedTestVouchers function.
async function seedTestVouchers(
  prismaClient: PrismaClient,
  options?: { includeExpired?: boolean },
): Promise<{ vouchers: any[]; expiredVoucher?: any }> {
  logger.debug('Seeding test vouchers...')

  // First, create a test category for vouchers
  const category = await prismaClient.category.create({
    data: {
      name: { en: 'Test Category', es: 'Categoría de Prueba' },
      description: {
        en: 'Test category for vouchers',
        es: 'Categoría de prueba para cupones',
      },
      slug: `test-category-${uuid().substring(0, 8)}`,
      level: 1,
      path: '/',
      active: true,
      sortOrder: 1,
    },
  })

  // Create a test service provider for vouchers
  const user = await prismaClient.user.create({
    data: {
      email: `test-provider-${uuid().substring(0, 8)}@example.com`,
      firstName: 'Test',
      lastName: 'Provider',
      role: 'PROVIDER',
    },
  })

  const provider = await prismaClient.provider.create({
    data: {
      userId: user.id,
      businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
      businessDescription: {
        en: 'Test business for vouchers',
        es: 'Negocio de prueba para cupones',
      },
      categoryId: category.id,
      verified: true,
      active: true,
    },
  })

  const vouchers = []

  // Create regular voucher
  const voucherId = uuid()
  const voucher = await prismaClient.$transaction(async (tx) => {
    const v = await tx.voucher.create({
      data: {
        id: voucherId,
        providerId: provider.id,
        categoryId: category.id,
        state: 'PUBLISHED',
        title: {
          en: 'Test Voucher',
          es: 'Cupón de Prueba',
          gn: 'Test Voucher Guarani',
        },
        description: {
          en: 'Get 20% off your next purchase',
          es: 'Obtén 20% de descuento en tu próxima compra',
          gn: '20% descuento próxima compra-pe',
        },
        terms: {
          en: 'Valid for one use per customer',
          es: 'Válido para un uso por cliente',
          gn: 'Válido peteĩ jeporu cliente-pe',
        },
        discountType: 'PERCENTAGE',
        discountValue: 20,
        currency: 'PYG',
        // location is handled by PostGIS directly, not through Prisma
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
          voucherId: v.id,
          code: 'TEST1234',
          type: 'SHORT',
          isActive: true,
          metadata: {},
        },
        {
          voucherId: v.id,
          code: 'jwt-test-token-here',
          type: 'QR',
          isActive: true,
          metadata: { algorithm: 'HS256' },
        },
      ],
    })

    return v
  })

  vouchers.push(voucher)

  // Create expired voucher if requested
  let expiredVoucher = null

  if (options?.includeExpired) {
    const expiredId = uuid()

    expiredVoucher = await prismaClient.voucher.create({
      data: {
        id: expiredId,
        providerId: provider.id,
        categoryId: category.id,
        state: 'EXPIRED',
        title: {
          en: 'Expired Voucher',
          es: 'Cupón Vencido',
          gn: 'Cupón Vencido',
        },
        description: {
          en: 'This voucher has expired',
          es: 'Este cupón ha vencido',
          gn: 'Ko cupón oñembotýma',
        },
        terms: {
          en: 'No longer valid',
          es: 'Ya no es válido',
          gn: 'Ndoikoveíma',
        },
        discountType: 'PERCENTAGE',
        discountValue: 50,
        currency: 'PYG',
        // location is handled by PostGIS directly, not through Prisma
        validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        maxRedemptions: 10,
        maxRedemptionsPerUser: 1,
        currentRedemptions: 0,
        metadata: { source: 'test' },
      },
    })
  }

  logger.debug('Test vouchers seeded.')

  return { vouchers, expiredVoucher }
}

describe('Voucher API Integration Tests with Supertest', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test> // For supertest
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let redemptionServiceClient: AuthenticatedRequestClient // For redemption service requests

  const mockCacheService = new MockCacheService()

  const mockFileStorage: FileStoragePort = {
    upload: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/file.jpg',
      path: 'file.jpg',
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  }

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    app = await createVoucherServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize supertest with the Fastify server instance
    // The type assertion is a workaround for potential mismatches with @types/supertest
    request = supertest(
      app.server,
    ) as unknown as supertest.SuperTest<supertest.Test>

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
    redemptionServiceClient = authHelper.getServiceClient('redemption-service')

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper && typeof authHelper.cleanup === 'function') {
      authHelper.cleanup()
    }

    // Cleanup
    if (app) {
      await app.close()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })

  describe('GET /vouchers', () => {
    it('should return an empty list when no vouchers exist', async () => {
      const response = await customerClient.get('/vouchers').expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data).toHaveLength(0)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination.total).toBe(0)
    })

    it('should return vouchers when they exist', async () => {
      // Seed test data
      const seedData = await seedTestVouchers(testDb.prisma)

      expect(seedData.vouchers).toHaveLength(1)

      const response = await customerClient.get('/vouchers')

      if (response.status !== 200) {
        console.error('Error response:', response.body)
      }

      expect(response.status).toBe(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0]).toHaveProperty('id')
      expect(response.body.data[0]).toHaveProperty('title')
      expect(response.body.data[0]).toHaveProperty('discount_type')
      expect(response.body.data[0]).toHaveProperty('discount_value')
      expect(response.body.data[0]).toHaveProperty('state')
      expect(response.body.pagination.total).toBe(1)
    })

    it('should support pagination', async () => {
      // Create multiple vouchers for pagination test
      await seedTestVouchers(testDb.prisma)

      const response = await customerClient
        .get('/vouchers?page=1&limit=10')
        .expect(200)

      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(10)
    })

    it('should filter by state', async () => {
      await seedTestVouchers(testDb.prisma, { includeExpired: true })

      const response = await customerClient
        .get('/vouchers?state=PUBLISHED')
        .expect(200)

      expect(response.body.data).toBeInstanceOf(Array)
      response.body.data.forEach((voucher: any) => {
        expect(voucher.state).toBe('PUBLISHED')
      })
    })
  })

  describe('GET /vouchers/:id', () => {
    it('should return a specific voucher by ID', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      const response = await customerClient
        .get(`/vouchers/${voucherId}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', voucherId)
      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('description')
      expect(response.body).toHaveProperty('discount_type')
      expect(response.body).toHaveProperty('discount_value')
      expect(response.body).toHaveProperty('state')
    })

    it('should return 404 for non-existent voucher', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/vouchers/${nonExistentId}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error.code).toBe('NOT_FOUND')
    })

    it('should include codes when requested', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      const response = await customerClient.get(
        `/vouchers/${voucherId}?include_codes=true`,
      )

      // Debug log to see the response
      if (response.status !== 200) {
        console.error('Error response:', response.status, response.body)
      }

      expect(response.status).toBe(200)

      expect(response.body).toHaveProperty('codes')
      expect(response.body.codes).toBeInstanceOf(Array)
      expect(response.body.codes.length).toBeGreaterThan(0)
      expect(response.body.codes[0]).toHaveProperty('code')
      expect(response.body.codes[0]).toHaveProperty('type')
    })
  })

  describe('POST /vouchers (Admin only)', () => {
    it('should create a new voucher with admin authentication', async () => {
      // First create necessary test data
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-category-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
          sortOrder: 1,
        },
      })

      const user = await testDb.prisma.user.create({
        data: {
          email: `test-provider-${uuid().substring(0, 8)}@example.com`,
          firstName: 'Test',
          lastName: 'Provider',
          role: 'PROVIDER',
        },
      })

      const provider = await testDb.prisma.provider.create({
        data: {
          userId: user.id,
          businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
          businessDescription: { en: 'Test', es: 'Prueba' },
          categoryId: category.id,
          verified: true,
          active: true,
        },
      })

      const voucherData = {
        provider_id: provider.id,
        category_id: category.id,
        title: {
          en: 'New Test Voucher',
          es: 'Nuevo Cupón de Prueba',
          gn: 'Cupón Pyahu',
        },
        description: {
          en: 'Get 15% off',
          es: 'Obtén 15% de descuento',
          gn: '15% descuento',
        },
        terms: {
          en: 'Valid until expiration',
          es: 'Válido hasta vencimiento',
          gn: 'Válido vencimiento peve',
        },
        discount_type: 'PERCENTAGE',
        discount_value: 15,
        currency: 'PYG',
        valid_from: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        max_redemptions: 50,
        max_redemptions_per_user: 1,
      }

      const response = await adminClient.post('/vouchers').send(voucherData)

      if (response.status !== 201) {
        console.error('Create voucher error:', response.body)
      }

      expect(response.status).toBe(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('state', 'NEW')
      expect(response.body.title.en).toBe('New Test Voucher')
      expect(response.body.discount_type).toBe('PERCENTAGE')
      expect(response.body.discount_value).toBe('15')
    })

    it('should reject voucher creation without authentication', async () => {
      const voucherData = {
        provider_id: uuid(),
        category_id: uuid(),
        title: { en: 'Unauthorized Voucher' },
        description: { en: 'Should not be created' },
        terms: { en: 'Invalid' },
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        currency: 'PYG',
        location: {
          type: 'Point',
          coordinates: [-57.575926, -25.363611],
        },
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }

      // Use unauthenticated request to test 401
      await request.post('/vouchers').send(voucherData).expect(401)
    })
  })

  describe('PATCH /vouchers/:id (Admin only)', () => {
    it('should update an existing voucher', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      const updateData = {
        title: {
          en: 'Updated Voucher Title',
          es: 'Título de Cupón Actualizado',
        },
        discount_value: 25,
      }

      const response = await adminClient
        .patch(`/vouchers/${voucherId}`)
        .send(updateData)

      if (response.status !== 200) {
        console.error(
          'Update voucher error:',
          response.body,
          'voucherId:',
          voucherId,
        )
      }

      expect(response.status).toBe(200)

      expect(response.body).toHaveProperty('id', voucherId)
      expect(response.body.title.en).toBe('Updated Voucher Title')
      expect(response.body.discount_value).toBe('25')
    })

    it('should handle decimal values correctly', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // Test various decimal values
      const testCases = [
        { value: 10.5, expected: 10.5 },
        { value: 99.99, expected: 99.99 },
        { value: 0.01, expected: 0.01 },
        { value: 100, expected: 100 },
      ]

      for (const testCase of testCases) {
        const updateData = {
          discount_value: testCase.value,
        }

        const response = await adminClient
          .patch(`/vouchers/${voucherId}`)
          .send(updateData)
          .expect(200)

        expect(response.body.discount_value).toBe(testCase.expected.toString())
      }
    })
  })

  describe('POST /vouchers/:id/publish (Admin only)', () => {
    it('should publish a voucher', async () => {
      // Create a voucher in NEW state
      const seedData = await seedTestVouchers(testDb.prisma)

      // Update to NEW state for testing
      await testDb.prisma.voucher.update({
        where: { id: seedData.vouchers[0].id },
        data: { state: 'NEW' },
      })

      const response = await adminClient
        .post(`/vouchers/${seedData.vouchers[0].id}/publish`)
        .expect(200)

      expect(response.body).toHaveProperty('state', 'PUBLISHED')
    })
  })

  describe('POST /vouchers/:id/expire (Admin only)', () => {
    it('should expire a voucher', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      const response = await adminClient
        .post(`/vouchers/${voucherId}/expire`)
        .expect(200)

      expect(response.body).toHaveProperty('state', 'EXPIRED')
    })
  })

  describe('DELETE /vouchers/:id (Admin only)', () => {
    it('should delete a voucher that has not been redeemed', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)

      // Update to ensure no redemptions
      await testDb.prisma.voucher.update({
        where: { id: seedData.vouchers[0].id },
        data: { currentRedemptions: 0 },
      })

      await adminClient
        .delete(`/vouchers/${seedData.vouchers[0].id}`)
        .expect(204)

      // Verify deletion
      await customerClient
        .get(`/vouchers/${seedData.vouchers[0].id}`)
        .expect(404)
    })
  })

  describe('PUT /vouchers/:id/state (Service-to-service)', () => {
    it('should update voucher state from CLAIMED to REDEEMED', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // First, update voucher to CLAIMED state
      await testDb.prisma.voucher.update({
        where: { id: voucherId },
        data: { state: 'CLAIMED' },
      })

      // Use service-to-service authentication
      const response = await redemptionServiceClient
        .put(`/vouchers/${voucherId}/state`)
        .send({
          state: 'REDEEMED',
          redeemed_at: new Date().toISOString(),
          redeemed_by: 'customer-123',
          location: {
            lat: -25.2637,
            lng: -57.5759,
          },
        })
        .expect(200)

      expect(response.body).toHaveProperty('state', 'REDEEMED')
      expect(response.body).toHaveProperty('current_redemptions')

      // Verify redemption count was incremented
      const updatedVoucher = await testDb.prisma.voucher.findUnique({
        where: { id: voucherId },
      })

      expect(updatedVoucher?.currentRedemptions).toBe(1)
      expect(updatedVoucher?.metadata).toMatchObject({
        redeemedAt: expect.any(String),
        redeemedBy: 'customer-123',
        redemptionLocation: {
          lat: -25.2637,
          lng: -57.5759,
        },
      })
    })

    it('should reject invalid state transitions', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // Ensure voucher is in CLAIMED state
      await testDb.prisma.voucher.update({
        where: { id: voucherId },
        data: { state: 'CLAIMED' },
      })

      // Try invalid transition from CLAIMED to PUBLISHED
      const response = await redemptionServiceClient
        .put(`/vouchers/${voucherId}/state`)
        .send({
          state: 'PUBLISHED',
        })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent voucher', async () => {
      const nonExistentId = uuid()
      const response = await redemptionServiceClient
        .put(`/vouchers/${nonExistentId}/state`)
        .send({
          state: 'REDEEMED',
        })
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should allow EXPIRED transition from any state', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // Ensure voucher is in PUBLISHED state
      await testDb.prisma.voucher.update({
        where: { id: voucherId },
        data: { state: 'PUBLISHED' },
      })

      // Use service client for inter-service call to expire voucher
      const voucherServiceClient =
        authHelper.getServiceClient('voucher-service')
      const response = await voucherServiceClient
        .put(`/vouchers/${voucherId}/state`)
        .send({
          state: 'EXPIRED',
        })
        .expect(200)

      expect(response.body).toHaveProperty('state', 'EXPIRED')
    })

    it('should require service authentication headers', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // Try without service headers (using unauthenticated request)
      const response = await request
        .put(`/vouchers/${voucherId}/state`)
        .send({
          state: 'REDEEMED',
        })
        .expect(401)

      expect(response.body).toHaveProperty('error')
      // Check if error is a string or object
      if (typeof response.body.error === 'string') {
        expect(response.body.error).toMatch(/service authentication/)
      } else {
        expect(response.body.error.message || response.body.error.code).toMatch(
          /authentication|auth/i,
        )
      }
    })

    it('should handle concurrent state updates correctly', async () => {
      const seedData = await seedTestVouchers(testDb.prisma)
      const voucherId = seedData.vouchers[0].id

      // Set voucher to CLAIMED with some existing redemptions
      await testDb.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          state: 'CLAIMED',
          currentRedemptions: 5,
        },
      })

      // Make multiple concurrent redemption requests
      const promises = Array.from({ length: 3 }, (_, i) =>
        redemptionServiceClient.put(`/vouchers/${voucherId}/state`).send({
          state: 'REDEEMED',
          redeemed_at: new Date().toISOString(),
          redeemed_by: `customer-${i}`,
        }),
      )

      const results = await Promise.allSettled(promises)

      // At least one should succeed
      const successfulResults = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200,
      )

      expect(successfulResults.length).toBeGreaterThan(0)

      // Check final state
      const finalVoucher = await testDb.prisma.voucher.findUnique({
        where: { id: voucherId },
      })

      // Redemption count should have been incremented for each successful update
      expect(finalVoucher?.currentRedemptions).toBeGreaterThanOrEqual(6)
      expect(finalVoucher?.state).toBe('REDEEMED')
    })
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      // Health check doesn't require authentication
      const response = await request.get('/health').expect(200)

      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('services')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('version')
      expect(response.body).toHaveProperty('uptime')
    })
  })
})
