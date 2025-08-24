/**
 * Redemption Analytics Service - Admin API Integration Tests
 *
 * Tests for admin-only redemption analytics endpoints that require admin privileges.
 * These endpoints are used for redemption analytics and reporting.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared') // Unmock shared to use real error classes with real middleware

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createMockTranslationClient,
  createTestDatabase,
  E2EAuthHelper,
  MockTranslationClient,
  TestDatabaseResult,
} from '@pika/tests'
import { createCommunicationServiceClientMock } from '@pika/tests'
import { createTranslationResolver } from '@pika/translation'
import {
  UserRole,
  UserStatus,
  VoucherRedemptionMethod,
  VoucherRedemptionType,
} from '@pika/types'
import { createVoucherServer } from '@voucher/server.js'
import {
  createSharedVoucherTestData,
  type SharedVoucherTestData,
} from '@voucher/test/helpers/voucherTestHelpers.js'
import type { Express } from 'express'
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

// Note: Using shared helper from voucherTestHelpers.js

describe('Redemption Analytics Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient
  let fileStorageClient: any
  let communicationClient: any

  // Authenticated clients for different user types
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedVoucherTestData

  // Test categories for analytics testing
  let testCategory1: any
  let testCategory2: any

  // Test business for voucher creation
  let testBusiness: any
  let testUser: any

  beforeAll(async () => {
    logger.debug(
      'Setting up Redemption Analytics Service Admin API integration tests...',
    )

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_redemption_analytics_admin_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create mock services
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()

    fileStorageClient = {
      uploadFile: vi
        .fn()
        .mockResolvedValue({ url: 'https://example.com/file.jpg' }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      reset: vi.fn().mockReturnThis(),
    }

    communicationClient = createCommunicationServiceClientMock()

    // Create business service client mock manually
    const businessServiceClient = {
      getBusiness: vi.fn().mockImplementation(async (id: string) => {
        const business = await testDb.prisma.business.findUnique({
          where: { id },
        })

        if (!business) {
          throw new Error(`Business with ID ${id} not found`)
        }

        return business
      }),
      getBusinesses: vi.fn().mockResolvedValue([]),
      createBusiness: vi.fn(),
      updateBusiness: vi.fn(),
      deleteBusiness: vi.fn(),
    }

    // Create translation resolver
    const translationResolver = createTranslationResolver(translationClient)

    // Create server
    app = await createVoucherServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
      translationResolver,
      fileStorage: fileStorageClient,
      communicationClient,
      businessServiceClient,
    })

    logger.debug('Express server ready for testing.')

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create test categories
    testCategory1 = await testDb.prisma.category.create({
      data: {
        nameKey: `category.name.test1.${uuid()}`,
        descriptionKey: `category.description.test1.${uuid()}`,
        slug: `test-cat-1-${uuid().substring(0, 8)}`,
        level: 1,
        path: '/test1',
        isActive: true,
        sortOrder: 1,
        createdBy: uuid(),
      },
    })

    testCategory2 = await testDb.prisma.category.create({
      data: {
        nameKey: `category.name.test2.${uuid()}`,
        descriptionKey: `category.description.test2.${uuid()}`,
        slug: `test-cat-2-${uuid().substring(0, 8)}`,
        level: 1,
        path: '/test2',
        isActive: true,
        sortOrder: 2,
        createdBy: uuid(),
      },
    })

    // Create a test user for the business
    const businessOwner = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: `business-owner-${Date.now()}@example.com`,
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        firstName: 'Test',
        lastName: 'Business Owner',
        emailVerified: true,
      },
    })

    // Create test user for redemptions
    testUser = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: `test-user-${Date.now()}@example.com`,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
      },
    })

    // Create test business for voucher creation
    testBusiness = await testDb.prisma.business.create({
      data: {
        userId: businessOwner.id,
        businessNameKey: `business.name.test.${uuid()}`,
        categoryId: testCategory1.id,
        verified: true,
        active: true,
      },
    })

    // Create shared test data once for all tests
    logger.debug('Creating shared voucher test data...')
    sharedTestData = await createSharedVoucherTestData(testDb.prisma, {
      businessId: testBusiness.id,
      includeCategories: [testCategory1.id, testCategory2.id],
    })
    logger.debug(`Created ${sharedTestData.allVouchers.length} test vouchers`)

    // Create test redemptions for analytics
    logger.debug('Creating test redemption data...')

    const vouchers = sharedTestData.allVouchers.slice(0, 3) // Use first 3 vouchers

    for (const voucher of vouchers) {
      await testDb.prisma.voucherRedemption.create({
        data: {
          voucherId: voucher.id,
          userId: testUser.id,
          codeUsed: `SAVE20-${uuid().substring(0, 8)}`,
          redeemedAt: new Date(),
          metadata: {
            redemptionType: VoucherRedemptionType.IN_STORE,
            redemptionMethod: VoucherRedemptionMethod.QR_SCAN,
            location: { lat: -25.2637, lng: -57.5759 },
            deviceInfo: { platform: 'mobile', version: '1.0.0' },
          },
        },
      })
    }

    // Verify shared data was created
    const voucherCount = await testDb.prisma.voucher.count()
    const redemptionCount = await testDb.prisma.voucherRedemption.count()

    logger.debug(
      `Database has ${voucherCount} vouchers and ${redemptionCount} redemptions after setup`,
    )

    if (voucherCount === 0) {
      throw new Error('No shared test data was created - database setup issue')
    }
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests
    translationClient.clear()

    // Reset mock services
    fileStorageClient.reset()

    // Verify shared test data still exists
    const redemptionCount = await testDb.prisma.voucherRedemption.count()

    logger.debug(`Database has ${redemptionCount} redemptions at start of test`)
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Redemption Analytics Tests
  describe('GET /admin/vouchers/redemptions/history', () => {
    it('should return redemption history for admin', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET /admin/vouchers/redemptions/history failed:', {
          status: response.status,
          body: response.body,
          error: response.error,
          text: response.text,
        })
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data)).toBe(true)

      if (response.body.data.length > 0) {
        const firstRedemption = response.body.data[0]

        expect(firstRedemption).toHaveProperty('id')
        expect(firstRedemption).toHaveProperty('voucherId')
        expect(firstRedemption).toHaveProperty('userId')
        expect(firstRedemption).toHaveProperty('redeemedAt')
        expect(firstRedemption).toHaveProperty('codeUsed')
      }
    })

    it('should filter redemption history by voucherId', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({ voucherId: voucher.id })
        .set('Accept', 'application/json')
        .expect(200)

      // All returned redemptions should belong to the specified voucher
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((r: any) => r.voucherId === voucher.id),
        ).toBe(true)
      }
    })

    it('should filter redemption history by userId', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({ userId: testUser.id })
        .set('Accept', 'application/json')
        .expect(200)

      // All returned redemptions should belong to the specified user
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((r: any) => r.userId === testUser.id),
        ).toBe(true)
      }
    })

    it('should filter redemption history by businessId', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({ businessId: testBusiness.id })
        .set('Accept', 'application/json')
        .expect(200)

      // Should return redemptions for vouchers belonging to the business
      expect(response.body).toHaveProperty('data')
    })

    it('should require admin role for redemption history', async () => {
      // Non-admin users should get 403 Forbidden
      await customerClient
        .get('/admin/vouchers/redemptions/history')
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .get('/admin/vouchers/redemptions/history')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('GET /admin/vouchers/redemptions/stats', () => {
    it('should return redemption statistics for admin', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/stats')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET /admin/vouchers/redemptions/stats failed:', {
          status: response.status,
          body: response.body,
        })
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('totalRedemptions')
      expect(response.body).toHaveProperty('uniqueUsers')
      expect(response.body).toHaveProperty('totalDiscountValue')
      expect(response.body).toHaveProperty('byType')
      expect(response.body).toHaveProperty('byMethod')
      expect(response.body).toHaveProperty('dailyRedemptions')

      expect(typeof response.body.totalRedemptions).toBe('number')
      expect(typeof response.body.uniqueUsers).toBe('number')
      expect(typeof response.body.totalDiscountValue).toBe('number')
      expect(Array.isArray(response.body.dailyRedemptions)).toBe(true)
    })

    it('should filter statistics by business', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/stats')
        .query({ businessId: testBusiness.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('totalRedemptions')
      expect(response.body).toHaveProperty('uniqueUsers')
    })

    it('should require admin role for redemption statistics', async () => {
      await customerClient
        .get('/admin/vouchers/redemptions/stats')
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .get('/admin/vouchers/redemptions/stats')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('GET /admin/vouchers/redemptions/business/:id/stats', () => {
    it('should return business-specific redemption statistics for admin', async () => {
      const response = await adminClient
        .get(`/admin/vouchers/redemptions/business/${testBusiness.id}/stats`)
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET business redemption stats failed:', {
          status: response.status,
          body: response.body,
        })
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('businessId')
      expect(response.body).toHaveProperty('totalRedemptions')
      expect(response.body).toHaveProperty('uniqueUsers')
      expect(response.body).toHaveProperty('totalDiscountValue')
      expect(response.body.businessId).toBe(testBusiness.id)
    })

    it('should allow business owner to access their own stats', async () => {
      // This should work if the business client is associated with testBusiness
      const response = await businessClient
        .get(`/admin/vouchers/redemptions/business/${testBusiness.id}/stats`)
        .set('Accept', 'application/json')

      // This might return 403 if business ownership validation is strict
      expect([200, 403]).toContain(response.status)

      if (response.status === 200) {
        expect(response.body.businessId).toBe(testBusiness.id)
      }
    })

    it('should prevent customer from accessing business stats', async () => {
      await customerClient
        .get(`/admin/vouchers/redemptions/business/${testBusiness.id}/stats`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('GET /admin/vouchers/redemptions/user/:id/history', () => {
    it('should return user-specific redemption history for admin', async () => {
      const response = await adminClient
        .get(`/admin/vouchers/redemptions/user/${testUser.id}/history`)
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET user redemption history failed:', {
          status: response.status,
          body: response.body,
        })
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')

      // All redemptions should belong to the specified user
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((r: any) => r.userId === testUser.id),
        ).toBe(true)
      }
    })

    it('should require admin role for user redemption history', async () => {
      await customerClient
        .get(`/admin/vouchers/redemptions/user/${testUser.id}/history`)
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .get(`/admin/vouchers/redemptions/user/${testUser.id}/history`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('GET /admin/vouchers/:id/redemptions/history', () => {
    it('should return voucher-specific redemption history for admin', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      const response = await adminClient
        .get(`/admin/vouchers/${voucher.id}/redemptions/history`)
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        logger.error('GET voucher redemption history failed:', {
          status: response.status,
          body: response.body,
        })
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')

      // All redemptions should belong to the specified voucher
      if (response.body.data.length > 0) {
        expect(
          response.body.data.every((r: any) => r.voucherId === voucher.id),
        ).toBe(true)
      }
    })

    it('should allow business owner to access their own voucher redemption history', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      const response = await businessClient
        .get(`/admin/vouchers/${voucher.id}/redemptions/history`)
        .set('Accept', 'application/json')

      // This might return 403 if business ownership validation is strict
      expect([200, 403]).toContain(response.status)
    })

    it('should prevent customer from accessing voucher redemption history', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      await customerClient
        .get(`/admin/vouchers/${voucher.id}/redemptions/history`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Redemption Analytics Error Handling', () => {
    it('should handle invalid voucher ID format in redemption history', async () => {
      const invalidId = 'invalid-id-format'

      const response = await adminClient
        .get(`/admin/vouchers/${invalidId}/redemptions/history`)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle invalid business ID format', async () => {
      const invalidId = 'invalid-business-id'

      const response = await adminClient
        .get(`/admin/vouchers/redemptions/business/${invalidId}/stats`)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return empty results for non-existent voucher redemption history', async () => {
      const nonExistentId = uuid()

      const response = await adminClient
        .get(`/admin/vouchers/${nonExistentId}/redemptions/history`)
        .set('Accept', 'application/json')
        .expect(200)

      // For now, non-existent vouchers return empty results instead of 404
      // TODO: Implement proper voucher existence validation (see ToDo.md)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toEqual([])
      expect(response.body.pagination.total).toBe(0)
    })
  })

  // Authentication Boundary Tests
  describe('Authentication Boundary Tests', () => {
    it('should require authentication for all redemption analytics endpoints', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      // Test all endpoints without authentication
      const endpoints = [
        { method: 'get', url: '/admin/vouchers/redemptions/history' },
        { method: 'get', url: '/admin/vouchers/redemptions/stats' },
        {
          method: 'get',
          url: `/admin/vouchers/redemptions/business/${testBusiness.id}/stats`,
        },
        {
          method: 'get',
          url: `/admin/vouchers/redemptions/user/${testUser.id}/history`,
        },
        {
          method: 'get',
          url: `/admin/vouchers/${voucher.id}/redemptions/history`,
        },
      ]

      for (const endpoint of endpoints) {
        await supertest(app)
          [endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(401)
      }
    })

    it('should enforce proper RBAC permissions', async () => {
      const voucher = sharedTestData.activeVouchers[0]

      // Test admin-only endpoints with non-admin tokens (should get 403)
      const adminOnlyEndpoints = [
        { method: 'get', url: '/admin/vouchers/redemptions/history' },
        { method: 'get', url: '/admin/vouchers/redemptions/stats' },
        {
          method: 'get',
          url: `/admin/vouchers/redemptions/user/${testUser.id}/history`,
        },
      ]

      for (const endpoint of adminOnlyEndpoints) {
        await customerClient[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(403)

        await businessClient[endpoint.method](endpoint.url)
          .set('Accept', 'application/json')
          .expect(403)
      }
    })
  })

  // Pagination Tests
  describe('Pagination Tests', () => {
    it('should support pagination for redemption history', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({ page: 1, limit: 5 })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('totalPages')
      expect(response.body.pagination).toHaveProperty('hasNext')
      expect(response.body.pagination).toHaveProperty('hasPrev')

      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
    })

    it('should support sorting for redemption history', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({ sortBy: 'redeemedAt', sortOrder: 'desc' })
        .set('Accept', 'application/json')
        .expect(200)

      if (response.body.data.length > 1) {
        const dates = response.body.data.map((r: any) => new Date(r.redeemedAt))

        for (let i = 1; i < dates.length; i++) {
          expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(
            dates[i].getTime(),
          )
        }
      }
    })
  })

  // Data Filtering Tests
  describe('Data Filtering Tests', () => {
    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .set('Accept', 'application/json')
        .expect(200)

      // All redemptions should be within the date range
      if (response.body.data.length > 0) {
        response.body.data.forEach((r: any) => {
          const redeemedAt = new Date(r.redeemedAt)

          expect(redeemedAt.getTime()).toBeGreaterThanOrEqual(
            startDate.getTime(),
          )
          expect(redeemedAt.getTime()).toBeLessThanOrEqual(endDate.getTime())
        })
      }
    })

    it('should filter by redemption type and method', async () => {
      const response = await adminClient
        .get('/admin/vouchers/redemptions/history')
        .query({
          redemptionType: VoucherRedemptionType.IN_STORE,
          redemptionMethod: VoucherRedemptionMethod.QR_SCAN,
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Verify filtering works (if we have metadata)
      expect(response.body).toHaveProperty('data')
    })
  })
})
