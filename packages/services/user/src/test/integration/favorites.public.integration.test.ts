/**
 * User Service - Favorites Public API Integration Tests
 *
 * Tests for public-facing favorites endpoints that are accessible to authenticated users.
 * These endpoints allow users to manage their favorite businesses and vouchers.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi = await vi.importActual('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared = await vi.importActual('@pika/shared')

  return actualShared // Return all actual exports
})

import { keyManager } from '@pika/crypto'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  CommunicationServiceClientMock,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  type TestDatabaseResult,
} from '@pika/tests'
import { ErrorCode, UserRole, UserStatus } from '@pika/types'
import { VoucherState, VoucherType } from '@prisma/client'
import { createUserServer } from '@user/server.js'
import { createSharedUserTestData } from '@user/test/helpers/userTestHelpers.js'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

interface FileStoragePort {
  saveFile: (
    file: any,
    prefix?: string,
    options?: any,
  ) => Promise<{ url: string; path: string }>
  deleteFile: (filePath: string) => Promise<void>
  getFileUrl: (path: string) => Promise<string>
  fileExists: (path: string) => Promise<boolean>
}

describe('User Service - Favorites Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Test data for favorites
  let testBusiness1: any
  let testBusiness2: any
  let testVoucher1: any
  let testVoucher2: any
  let testCategory: any

  const mockCommunicationClient =
    new CommunicationServiceClientMock().setupEmailSuccess()

  const mockFileStorage: FileStoragePort = {
    saveFile: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/avatar.jpg',
      path: 'avatars/test-avatar.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getFileUrl: vi.fn((path: string) =>
      Promise.resolve(`http://mockstorage.com/${path}`),
    ),
    fileExists: vi.fn().mockResolvedValue(true),
  }

  beforeAll(async () => {
    logger.debug('Setting up User Service - Favorites integration tests...')

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_favorites_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()

    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService,
      fileStorage: mockFileStorage,
      communicationClient: mockCommunicationClient,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    await createSharedUserTestData(testDb.prisma)

    logger.debug(
      'Creating test category, businesses and vouchers for favorites...',
    )

    // Create admin user for category creation
    const adminUserId = uuid()

    await testDb.prisma.user.create({
      data: {
        id: adminUserId,
        email: `admin-${adminUserId.substring(0, 8)}@test.com`,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    })

    // Create a test category (don't set id, let database generate it, use UUID for createdBy)
    testCategory = await testDb.prisma.category.create({
      data: {
        nameKey: 'category.test.favorites',
        descriptionKey: 'category.test.favorites.description',
        icon: 'test-icon',
        slug: 'test-favorites-category',
        level: 1,
        path: '/test-favorites',
        sortOrder: 1,
        isActive: true,
        createdBy: adminUserId, // createdBy must be a valid UUID
      },
    })

    // Create business users for test businesses (let database generate IDs)
    const businessUser1 = await testDb.prisma.user.create({
      data: {
        email: 'business1@favorites-test.com',
        firstName: 'Business',
        lastName: 'Owner1',
        role: UserRole.business,
        status: UserStatus.active,
        emailVerified: true,
      },
    })

    const businessUser2 = await testDb.prisma.user.create({
      data: {
        email: 'business2@favorites-test.com',
        firstName: 'Business',
        lastName: 'Owner2',
        role: UserRole.business,
        status: UserStatus.active,
        emailVerified: true,
      },
    })

    // Create test businesses (let database generate IDs)
    testBusiness1 = await testDb.prisma.business.create({
      data: {
        userId: businessUser1.id,
        businessNameKey: 'business.test.favorites1',
        businessDescriptionKey: 'business.test.favorites1.description',
        categoryId: testCategory.id,
        verified: true,
        active: true,
        approved: true,
        favoriteCount: 0,
      },
    })

    testBusiness2 = await testDb.prisma.business.create({
      data: {
        userId: businessUser2.id,
        businessNameKey: 'business.test.favorites2',
        businessDescriptionKey: 'business.test.favorites2.description',
        categoryId: testCategory.id,
        verified: true,
        active: true,
        approved: true,
        favoriteCount: 0,
      },
    })

    // Create test vouchers (let database generate IDs, use correct field names)
    testVoucher1 = await testDb.prisma.voucher.create({
      data: {
        businessId: testBusiness1.id,
        // categoryId is optional - can be assigned later
        titleKey: 'voucher.test.favorites1',
        descriptionKey: 'voucher.test.favorites1.description',
        termsAndConditionsKey: 'voucher.test.favorites1.terms',
        type: VoucherType.percentage,
        discount: 10.0,
        currency: 'PYG',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxRedemptions: 100,
        redemptionsCount: 0,
        favoriteCount: 0,
        state: VoucherState.published,
      },
    })

    testVoucher2 = await testDb.prisma.voucher.create({
      data: {
        businessId: testBusiness2.id,
        // categoryId is optional - can be assigned later
        titleKey: 'voucher.test.favorites2',
        descriptionKey: 'voucher.test.favorites2.description',
        termsAndConditionsKey: 'voucher.test.favorites2.terms',
        type: VoucherType.percentage,
        discount: 20.0,
        currency: 'PYG',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxRedemptions: 50,
        redemptionsCount: 0,
        favoriteCount: 0,
        state: VoucherState.published,
      },
    })

    logger.debug(
      `Created test data: businesses ${testBusiness1.id}, ${testBusiness2.id} and vouchers ${testVoucher1.id}, ${testVoucher2.id}`,
    )
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only favorite-related data to preserve test data
    if (testDb?.prisma) {
      // Delete favorites data
      await testDb.prisma.favouriteBusiness.deleteMany({})
      await testDb.prisma.favouriteVoucher.deleteMany({})

      // Reset favorite counts
      await testDb.prisma.business.updateMany({
        data: { favoriteCount: 0 },
      })
      await testDb.prisma.voucher.updateMany({
        data: { favoriteCount: 0 },
      })
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Business Favorites Tests
  describe('Business Favorites', () => {
    describe('POST /users/me/favorites/businesses/:id', () => {
      it('should add business to favorites successfully', async () => {
        const response = await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .set('Accept', 'application/json')
          .expect(201)

        expect(response.body.message).toBe('Business added to favorites')
        expect(response.body.data).toBeDefined()
        expect(response.body.data.id).toBeDefined()
        expect(response.body.data.businessId).toBe(testBusiness1.id)
        expect(response.body.data.createdAt).toBeDefined()
      })

      it('should return 409 when trying to add same business twice', async () => {
        // Add business to favorites first time
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)

        // Try to add the same business again
        const response = await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .set('Accept', 'application/json')
          .expect(409)

        expect(response.body.error.code).toBe(ErrorCode.RESOURCE_CONFLICT)
      })

      it('should return 404 when trying to add non-existent business', async () => {
        const nonExistentId = uuid()

        const response = await customerClient
          .post(`/users/me/favorites/businesses/${nonExistentId}`)
          .set('Accept', 'application/json')
          .expect(404)

        expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
      })

      it('should require authentication', async () => {
        await request
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .set('Accept', 'application/json')
          .expect(401)
      })

      it('should validate UUID format in path parameter', async () => {
        await customerClient
          .post('/users/me/favorites/businesses/invalid-uuid')
          .set('Accept', 'application/json')
          .expect(400)
      })
    })

    describe('DELETE /users/me/favorites/businesses/:id', () => {
      beforeEach(async () => {
        // Add business to favorites for remove tests
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)
      })

      it('should remove business from favorites successfully', async () => {
        const response = await customerClient
          .delete(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.message).toBe('Item removed from favorites')
      })

      it('should return 404 when trying to remove non-favorited business', async () => {
        const response = await customerClient
          .delete(`/users/me/favorites/businesses/${testBusiness2.id}`)
          .set('Accept', 'application/json')
          .expect(404)

        expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
      })

      it('should require authentication', async () => {
        await request
          .delete(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('GET /users/me/favorites/businesses', () => {
      beforeEach(async () => {
        // Add multiple businesses to favorites
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness2.id}`)
          .expect(201)
      })

      it('should return paginated list of favorite businesses', async () => {
        const response = await customerClient
          .get('/users/me/favorites/businesses')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toBeDefined()
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(2)
        expect(response.body.pagination).toBeDefined()
        expect(response.body.pagination.total).toBe(2)
        expect(response.body.pagination.page).toBe(1)
        expect(response.body.pagination.hasNext).toBe(false)
        expect(response.body.pagination.hasPrev).toBe(false)

        // Check that we have the right business IDs
        const businessIds = response.body.data.map((fav: any) => fav.businessId)

        expect(businessIds).toContain(testBusiness1.id)
        expect(businessIds).toContain(testBusiness2.id)
      })

      it('should support pagination parameters', async () => {
        const response = await customerClient
          .get('/users/me/favorites/businesses')
          .query({ page: 1, limit: 1 })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.pagination.limit).toBe(1)
        expect(response.body.pagination.totalPages).toBe(2)
        expect(response.body.pagination.hasNext).toBe(true)
      })

      it('should support sorting by createdAt', async () => {
        const response = await customerClient
          .get('/users/me/favorites/businesses')
          .query({ sortBy: 'createdAt', sortOrder: 'desc' })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toHaveLength(2)

        // Most recent should be first when sorted desc
        const timestamps = response.body.data.map((fav: any) =>
          new Date(fav.createdAt).getTime(),
        )

        expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1])
      })

      it('should include business details when requested', async () => {
        const response = await customerClient
          .get('/users/me/favorites/businesses')
          .query({ include: 'business' })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data[0].business).toBeDefined()
        expect(response.body.data[0].business.businessName).toBeDefined()
      })

      it('should return empty list when no favorites', async () => {
        // Remove all favorites first
        await customerClient
          .delete(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(200)
        await customerClient
          .delete(`/users/me/favorites/businesses/${testBusiness2.id}`)
          .expect(200)

        const response = await customerClient
          .get('/users/me/favorites/businesses')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toEqual([])
        expect(response.body.pagination.total).toBe(0)
      })

      it('should require authentication', async () => {
        await request
          .get('/users/me/favorites/businesses')
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('GET /users/me/favorites/businesses/:id/status', () => {
      it('should return favorite status for favorited business', async () => {
        // Add business to favorites first
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)

        const response = await customerClient
          .get(`/users/me/favorites/businesses/${testBusiness1.id}/status`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.isFavorited).toBe(true)
        expect(response.body.favoritedAt).toBeDefined()
      })

      it('should return favorite status for non-favorited business', async () => {
        const response = await customerClient
          .get(`/users/me/favorites/businesses/${testBusiness1.id}/status`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.isFavorited).toBe(false)
        expect(response.body.favoritedAt).toBeUndefined()
      })

      it('should require authentication', async () => {
        await request
          .get(`/users/me/favorites/businesses/${testBusiness1.id}/status`)
          .set('Accept', 'application/json')
          .expect(401)
      })
    })
  })

  // Voucher Favorites Tests
  describe('Voucher Favorites', () => {
    describe('POST /users/me/favorites/vouchers/:id', () => {
      it('should add voucher to favorites successfully', async () => {
        const response = await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .set('Accept', 'application/json')
          .expect(201)

        expect(response.body.message).toBe('Voucher added to favorites')
        expect(response.body.data).toBeDefined()
        expect(response.body.data.id).toBeDefined()
        expect(response.body.data.voucherId).toBe(testVoucher1.id)
        expect(response.body.data.createdAt).toBeDefined()
      })

      it('should return 409 when trying to add same voucher twice', async () => {
        // Add voucher to favorites first time
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(201)

        // Try to add the same voucher again
        const response = await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .set('Accept', 'application/json')
          .expect(409)

        expect(response.body.error.code).toBe(ErrorCode.RESOURCE_CONFLICT)
      })

      it('should return 404 when trying to add non-existent voucher', async () => {
        const nonExistentId = uuid()

        const response = await customerClient
          .post(`/users/me/favorites/vouchers/${nonExistentId}`)
          .set('Accept', 'application/json')
          .expect(404)

        expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
      })

      it('should require authentication', async () => {
        await request
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('DELETE /users/me/favorites/vouchers/:id', () => {
      beforeEach(async () => {
        // Add voucher to favorites for remove tests
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(201)
      })

      it('should remove voucher from favorites successfully', async () => {
        const response = await customerClient
          .delete(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.message).toBe('Item removed from favorites')
      })

      it('should return 404 when trying to remove non-favorited voucher', async () => {
        const response = await customerClient
          .delete(`/users/me/favorites/vouchers/${testVoucher2.id}`)
          .set('Accept', 'application/json')
          .expect(404)

        expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
      })

      it('should require authentication', async () => {
        await request
          .delete(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('GET /users/me/favorites/vouchers', () => {
      beforeEach(async () => {
        // Add multiple vouchers to favorites
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(201)
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher2.id}`)
          .expect(201)
      })

      it('should return paginated list of favorite vouchers', async () => {
        const response = await customerClient
          .get('/users/me/favorites/vouchers')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toBeDefined()
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(2)
        expect(response.body.pagination).toBeDefined()
        expect(response.body.pagination.total).toBe(2)

        // Check that we have the right voucher IDs
        const voucherIds = response.body.data.map((fav: any) => fav.voucherId)

        expect(voucherIds).toContain(testVoucher1.id)
        expect(voucherIds).toContain(testVoucher2.id)
      })

      it('should support sorting by createdAt', async () => {
        const response = await customerClient
          .get('/users/me/favorites/vouchers')
          .query({ sortBy: 'createdAt', sortOrder: 'asc' })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toHaveLength(2)

        // Check that sorting is applied
        const timestamps = response.body.data.map((fav: any) =>
          new Date(fav.createdAt).getTime(),
        )

        expect(timestamps[0]).toBeLessThanOrEqual(timestamps[1])
      })

      it('should include voucher details when requested', async () => {
        const response = await customerClient
          .get('/users/me/favorites/vouchers')
          .query({ include: 'voucher' })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data[0].voucher).toBeDefined()
        expect(response.body.data[0].voucher.title).toBeDefined()
      })

      it('should return empty list when no favorites', async () => {
        // Remove all favorites first
        await customerClient
          .delete(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(200)
        await customerClient
          .delete(`/users/me/favorites/vouchers/${testVoucher2.id}`)
          .expect(200)

        const response = await customerClient
          .get('/users/me/favorites/vouchers')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data).toEqual([])
        expect(response.body.pagination.total).toBe(0)
      })

      it('should require authentication', async () => {
        await request
          .get('/users/me/favorites/vouchers')
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('GET /users/me/favorites/vouchers/:id/status', () => {
      it('should return favorite status for favorited voucher', async () => {
        // Add voucher to favorites first
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(201)

        const response = await customerClient
          .get(`/users/me/favorites/vouchers/${testVoucher1.id}/status`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.isFavorited).toBe(true)
        expect(response.body.favoritedAt).toBeDefined()
      })

      it('should return favorite status for non-favorited voucher', async () => {
        const response = await customerClient
          .get(`/users/me/favorites/vouchers/${testVoucher1.id}/status`)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.isFavorited).toBe(false)
        expect(response.body.favoritedAt).toBeUndefined()
      })

      it('should require authentication', async () => {
        await request
          .get(`/users/me/favorites/vouchers/${testVoucher1.id}/status`)
          .set('Accept', 'application/json')
          .expect(401)
      })
    })
  })

  // Batch Operations Tests
  describe('Batch Operations', () => {
    describe('POST /users/me/favorites/businesses/batch', () => {
      it('should add multiple businesses to favorites', async () => {
        const requestData = {
          add: [testBusiness1.id, testBusiness2.id],
        }

        const response = await customerClient
          .post('/users/me/favorites/businesses/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(2)
        expect(response.body.removed).toBe(0)
        expect(response.body.errors).toEqual([])
      })

      it('should remove multiple businesses from favorites', async () => {
        // Add businesses first
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness2.id}`)
          .expect(201)

        const requestData = {
          remove: [testBusiness1.id, testBusiness2.id],
        }

        const response = await customerClient
          .post('/users/me/favorites/businesses/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(0)
        expect(response.body.removed).toBe(2)
        expect(response.body.errors).toEqual([])
      })

      it('should handle mixed add and remove operations', async () => {
        // Add one business first
        await customerClient
          .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
          .expect(201)

        const requestData = {
          add: [testBusiness2.id],
          remove: [testBusiness1.id],
        }

        const response = await customerClient
          .post('/users/me/favorites/businesses/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(1)
        expect(response.body.removed).toBe(1)
        expect(response.body.errors).toEqual([])
      })

      it('should handle errors gracefully and report them', async () => {
        const nonExistentId = uuid()
        const requestData = {
          add: [testBusiness1.id, nonExistentId],
        }

        const response = await customerClient
          .post('/users/me/favorites/businesses/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(1) // Only the valid business was added
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].itemId).toBe(nonExistentId)
        expect(response.body.errors[0].operation).toBe('add')
      })

      it('should validate request body', async () => {
        const invalidData = {
          add: ['invalid-uuid'],
        }

        await customerClient
          .post('/users/me/favorites/businesses/batch')
          .send(invalidData)
          .set('Accept', 'application/json')
          .expect(400)
      })

      it('should require authentication', async () => {
        await request
          .post('/users/me/favorites/businesses/batch')
          .send({ add: [testBusiness1.id] })
          .set('Accept', 'application/json')
          .expect(401)
      })
    })

    describe('POST /users/me/favorites/vouchers/batch', () => {
      it('should add multiple vouchers to favorites', async () => {
        const requestData = {
          add: [testVoucher1.id, testVoucher2.id],
        }

        const response = await customerClient
          .post('/users/me/favorites/vouchers/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(2)
        expect(response.body.removed).toBe(0)
        expect(response.body.errors).toEqual([])
      })

      it('should remove multiple vouchers from favorites', async () => {
        // Add vouchers first
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher1.id}`)
          .expect(201)
        await customerClient
          .post(`/users/me/favorites/vouchers/${testVoucher2.id}`)
          .expect(201)

        const requestData = {
          remove: [testVoucher1.id, testVoucher2.id],
        }

        const response = await customerClient
          .post('/users/me/favorites/vouchers/batch')
          .send(requestData)
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.added).toBe(0)
        expect(response.body.removed).toBe(2)
        expect(response.body.errors).toEqual([])
      })

      it('should require authentication', async () => {
        await request
          .post('/users/me/favorites/vouchers/batch')
          .send({ add: [testVoucher1.id] })
          .set('Accept', 'application/json')
          .expect(401)
      })
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we verify that errors are properly formatted
      const nonExistentId = uuid()

      const response = await customerClient
        .post(`/users/me/favorites/businesses/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
      expect(response.body.error.message).toBeDefined()
    })

    it('should validate UUID format consistently', async () => {
      const invalidUuid = 'not-a-uuid'

      // Test business endpoints
      await customerClient
        .post(`/users/me/favorites/businesses/${invalidUuid}`)
        .expect(400)

      await customerClient
        .delete(`/users/me/favorites/businesses/${invalidUuid}`)
        .expect(400)

      await customerClient
        .get(`/users/me/favorites/businesses/${invalidUuid}/status`)
        .expect(400)

      // Test voucher endpoints
      await customerClient
        .post(`/users/me/favorites/vouchers/${invalidUuid}`)
        .expect(400)

      await customerClient
        .delete(`/users/me/favorites/vouchers/${invalidUuid}`)
        .expect(400)

      await customerClient
        .get(`/users/me/favorites/vouchers/${invalidUuid}/status`)
        .expect(400)
    })
  })

  // Caching Tests
  describe('Caching', () => {
    it('should cache favorite listings', async () => {
      // Add favorites
      await customerClient
        .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
        .expect(201)

      // First request
      const response1 = await customerClient
        .get('/users/me/favorites/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      // Second request should use cache
      const response2 = await customerClient
        .get('/users/me/favorites/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response1.body).toEqual(response2.body)
    })

    it('should invalidate cache when favorites are modified', async () => {
      // Add favorite
      await customerClient
        .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
        .expect(201)

      // Get initial list
      const response1 = await customerClient
        .get('/users/me/favorites/businesses')
        .expect(200)

      expect(response1.body.data).toHaveLength(1)

      // Add another favorite (should invalidate cache)
      await customerClient
        .post(`/users/me/favorites/businesses/${testBusiness2.id}`)
        .expect(201)

      // Get updated list
      const response2 = await customerClient
        .get('/users/me/favorites/businesses')
        .expect(200)

      expect(response2.body.data).toHaveLength(2)
    })
  })

  // User Isolation Tests
  describe('User Isolation', () => {
    it('should only show favorites for the authenticated user', async () => {
      // Add favorites for customer
      await customerClient
        .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
        .expect(201)

      // Add favorites for business user
      await businessClient
        .post(`/users/me/favorites/businesses/${testBusiness2.id}`)
        .expect(201)

      // Customer should only see their own favorites
      const customerResponse = await customerClient
        .get('/users/me/favorites/businesses')
        .expect(200)

      expect(customerResponse.body.data).toHaveLength(1)
      expect(customerResponse.body.data[0].businessId).toBe(testBusiness1.id)

      // Business user should only see their own favorites
      const businessResponse = await businessClient
        .get('/users/me/favorites/businesses')
        .expect(200)

      expect(businessResponse.body.data).toHaveLength(1)
      expect(businessResponse.body.data[0].businessId).toBe(testBusiness2.id)
    })

    it('should not allow users to manipulate other users favorites', async () => {
      // Add favorite for customer
      await customerClient
        .post(`/users/me/favorites/businesses/${testBusiness1.id}`)
        .expect(201)

      // Business user should not be able to see customer's favorites
      const businessResponse = await businessClient
        .get('/users/me/favorites/businesses')
        .expect(200)

      expect(businessResponse.body.data).toHaveLength(0)
    })
  })
})
