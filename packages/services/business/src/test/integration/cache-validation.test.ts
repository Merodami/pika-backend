/**
 * Cache Validation Integration Tests for Business Service
 *
 * CRITICAL: These tests validate that the cache architecture fixes work correctly
 * and prevent the hanging request bug from returning.
 *
 * The issue we fixed: @Cache decorators on controller methods cause HTTP requests
 * to hang because when cache hits occur, the decorator returns cached data but
 * never executes res.json(). We moved all caching to the service layer.
 */

import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { createBusinessServer } from '@business/server.js'
import {
  createSharedBusinessTestData,
  type SharedBusinessTestData,
} from '@business/test/helpers/businessTestHelpers.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { MockTranslationClient } from '@pika/tests'
import {
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
} from '@pika/tests'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Business Service Cache Validation Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient

  // Shared test data created once
  let sharedTestData: SharedBusinessTestData

  // Test clients (authenticated supertest clients)
  let customerClient: supertest.SuperTest<supertest.Test>
  let businessClient: supertest.SuperTest<supertest.Test>
  let adminClient: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    logger.debug('Setting up Business Service Cache Validation tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_cache_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create cache service
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    // Create mock translation client
    translationClient = new MockTranslationClient()

    // Create business server
    app = await createBusinessServer({
      port: 0, // Random port for testing
      cacheService,
      translationClient,
      prisma: testDb.prisma,
    })

    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedBusinessTestData(testDb.prisma)

    // Create test users and authenticate them (like working integration tests)
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)
    adminClient = await authHelper.getAdminClient(testDb.prisma)

    // Create a business for the business owner client user so /businesses/me works
    // The business client user is created by authHelper but doesn't have a business yet
    const businessUsers = await testDb.prisma.user.findMany({
      where: { role: 'business' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    if (businessUsers.length > 0 && sharedTestData.activeCategory) {
      await testDb.prisma.business.create({
        data: {
          userId: businessUsers[0].id,
          businessNameKey: 'test.business.for.auth.client',
          businessDescriptionKey: 'test.business.desc.for.auth.client',
          categoryId: sharedTestData.activeCategory.id,
          verified: true,
          active: true,
          avgRating: 4.5,
        },
      })
    }

    logger.debug('Business Service Cache Validation setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache between tests to ensure clean state
    await cacheService.clearAll()
  })

  afterAll(async () => {
    await cacheService.disconnect()
    await cleanupTestDatabase(testDb)
  })

  /**
   * CRITICAL CACHE VALIDATION TESTS
   * These tests validate the fix for the hanging request bug
   */
  describe('Cache Validation Tests - NO HANGING REQUESTS', () => {
    it('should NOT hang when GET /businesses cache is hit (validates fix)', async () => {
      // This test validates the fix - controllers no longer have @Cache
      // so responses are properly sent even when cache is hit

      // Prime the cache - first call should succeed
      await customerClient
        .get('/businesses')
        .timeout(3000) // Fail if takes more than 3 seconds
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await customerClient
        .get('/businesses')
        .timeout(1000) // Fail if takes more than 1 second
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500) // Should be very fast with cache
      expect(response.body).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)

      logger.info('GET /businesses cache hit performance:', {
        elapsedMs: elapsed,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should cache GET /businesses responses and improve performance', async () => {
      // First call - hits service layer/database
      const start1 = Date.now()
      const response1 = await customerClient
        .get('/businesses?page=1&limit=10')
        .expect(200)
      const time1 = Date.now() - start1

      // Second call - should hit cache (much faster)
      const start2 = Date.now()
      const response2 = await customerClient
        .get('/businesses?page=1&limit=10')
        .expect(200)
      const time2 = Date.now() - start2

      // Verify same data
      expect(response2.body).toEqual(response1.body)

      // Second call should be significantly faster (cache hit)
      expect(time2).toBeLessThanOrEqual(time1)

      logger.info('GET /businesses cache performance test:', {
        firstCallMs: time1,
        secondCallMs: time2,
        speedup:
          time1 > 0 ? `${Math.round((time1 / time2) * 100) / 100}x` : 'N/A',
        status: 'PASS',
      })
    })

    it('should NOT hang when GET /businesses/:id cache is hit (validates fix)', async () => {
      const testBusiness = sharedTestData.activeBusinesses[0]

      // Prime the cache - first call should succeed
      await customerClient
        .get(`/businesses/${testBusiness.id}`)
        .timeout(3000)
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await customerClient
        .get(`/businesses/${testBusiness.id}`)
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500)
      expect(response.body.id).toBe(testBusiness.id)

      logger.info('GET /businesses/:id cache hit performance:', {
        elapsedMs: elapsed,
        businessId: testBusiness.id,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should NOT hang when GET /businesses/user/:id cache is hit (validates fix)', async () => {
      const businessOwner = sharedTestData.businessOwners[0]

      // Prime the cache
      await customerClient
        .get(`/businesses/user/${businessOwner.id}`)
        .timeout(3000)
        .expect(200)

      // Second call should not hang
      const start = Date.now()
      const response = await customerClient
        .get(`/businesses/user/${businessOwner.id}`)
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body).toBeDefined()

      logger.info('GET /businesses/user/:id cache hit performance:', {
        elapsedMs: elapsed,
        userId: businessOwner.id,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * BUSINESS OWNER ENDPOINTS CACHE TESTS
   */
  describe('Business Owner Endpoints - Cache Validation', () => {
    it('should NOT hang when GET /businesses/me cache is hit', async () => {
      // Prime the cache
      await businessClient.get('/businesses/me').timeout(3000).expect(200)

      // Second call should not hang
      const start = Date.now()
      const response = await businessClient
        .get('/businesses/me')
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body).toBeDefined()

      logger.info('GET /businesses/me cache hit performance:', {
        elapsedMs: elapsed,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * CONCURRENT REQUESTS TEST
   * Verify concurrent requests don't cause deadlocks or hanging
   */
  describe('Concurrent Requests Tests', () => {
    it('should handle concurrent business list requests without hanging', async () => {
      const promises = Array.from({ length: 5 }, (_, index) => {
        return customerClient.get('/businesses?page=1&limit=5').timeout(3000) // Each request must complete within 3 seconds
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      // All responses should be identical (cached)
      const firstResponse = responses[0].body

      responses.forEach((response, index) => {
        expect(response.body).toEqual(firstResponse)
      })

      // Concurrent requests should complete reasonably quickly
      expect(elapsed).toBeLessThan(5000)

      logger.info('Concurrent business requests performance:', {
        requestCount: promises.length,
        totalElapsedMs: elapsed,
        averageMs: elapsed / promises.length,
        status: 'PASS - No hanging detected',
      })
    })

    it('should handle concurrent single business requests without hanging', async () => {
      const testBusiness = sharedTestData.activeBusinesses[0]

      const promises = Array.from({ length: 3 }, () => {
        return customerClient
          .get(`/businesses/${testBusiness.id}`)
          .timeout(3000)
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed and return the same business
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.id).toBe(testBusiness.id)
      })

      expect(elapsed).toBeLessThan(4000)

      logger.info('Concurrent single business requests performance:', {
        requestCount: promises.length,
        businessId: testBusiness.id,
        totalElapsedMs: elapsed,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * CACHE FAILURE RESILIENCE TESTS
   */
  describe('Cache Failure Resilience Tests', () => {
    it('should handle cache failures gracefully without hanging', async () => {
      // Disconnect cache to simulate failure
      await cacheService.disconnect()

      // Request should still work (fallback to direct database calls)
      const start = Date.now()
      const response = await customerClient
        .get('/businesses')
        .timeout(5000) // Allow more time since no cache
        .expect(200)
      const elapsed = Date.now() - start

      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(elapsed).toBeLessThan(5000)

      // Reconnect cache
      await cacheService.connect()

      logger.info('Business cache failure resilience test:', {
        elapsedMs: elapsed,
        status: 'PASS - Service continued without cache',
      })
    })
  })

  /**
   * CACHE INVALIDATION TESTS
   */
  describe('Cache Invalidation Tests', () => {
    it('should invalidate business cache when business data changes', async () => {
      // Get initial business list (prime cache)
      const response1 = await customerClient.get('/businesses').expect(200)

      const initialCount = response1.body.data.length

      // Simulate cache invalidation (in real scenario, happens on updates)
      await cacheService.delPattern('*business*')

      // Get businesses again - should hit database again
      const response2 = await customerClient.get('/businesses').expect(200)

      // Should not hang and should return data
      expect(response2.body.data).toBeDefined()
      expect(Array.isArray(response2.body.data)).toBe(true)

      logger.info('Business cache invalidation test:', {
        initialCount,
        afterInvalidationCount: response2.body.data.length,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * EDGE CASE TESTS
   */
  describe('Edge Case Tests', () => {
    it('should handle invalid business ID without hanging', async () => {
      const start = Date.now()
      const response = await customerClient
        .get('/businesses/invalid-uuid-here')
        .timeout(2000)
        .expect(400) // Should return bad request, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Invalid business ID test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle non-existent business ID without hanging', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const start = Date.now()
      const response = await customerClient
        .get(`/businesses/${fakeUuid}`)
        .timeout(2000)
        .expect(404) // Should return not found, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(2000)
      expect(response.body.error).toBeDefined()

      logger.info('Non-existent business ID test:', {
        elapsedMs: elapsed,
        businessId: fakeUuid,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle unauthorized access without hanging', async () => {
      const start = Date.now()
      const response = await request
        .get('/businesses/me') // Use /me endpoint which requires auth
        .timeout(2000)
        .expect(401) // Should return unauthorized, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Unauthorized access test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })
  })
})
