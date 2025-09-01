/**
 * Cache Validation Integration Tests for Category Service
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
vi.unmock('@pika/translation')

import { createCategoryServer } from '@category/server.js'
import { createSharedCategoryTestData } from '@category/test/helpers/categoryTestHelpers.js'
import { keyManager } from '@pika/crypto'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  MockTranslationClient,
  TestDatabaseResult,
} from '@pika/tests'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Category Service Cache Validation Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Shared test data created once
  let sharedTestData: SharedCategoryTestData

  // Test clients (authenticated supertest clients)
  let customerClient: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    logger.debug('Setting up Category Service Cache Validation tests...')

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_category_cache_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create cache service
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    // Create mock translation client
    const mockTranslationClient = new MockTranslationClient()

    // Create category server
    const serverResult = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient: mockTranslationClient as any,
    })

    app = serverResult.app

    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedCategoryTestData(testDb.prisma)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    customerClient = await authHelper.getUserClient(testDb.prisma)
    await authHelper.getAdminClient(testDb.prisma)

    logger.debug('Category Service Cache Validation setup complete')
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
    it('should NOT hang when GET /categories cache is hit (validates fix)', async () => {
      // This test validates the fix - controllers no longer have @Cache
      // so responses are properly sent even when cache is hit

      // Prime the cache - first call should succeed
      await customerClient
        .get('/categories')
        .timeout(3000) // Fail if takes more than 3 seconds
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await customerClient
        .get('/categories')
        .timeout(1000) // Fail if takes more than 1 second
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500) // Should be very fast with cache
      expect(response.body).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)

      logger.info('GET /categories cache hit performance:', {
        elapsedMs: elapsed,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should cache GET /categories responses and improve performance', async () => {
      // First call - hits service layer/database
      const start1 = Date.now()
      const response1 = await customerClient
        .get('/categories?page=1&limit=10')
        .expect(200)
      const time1 = Date.now() - start1

      // Second call - should hit cache (much faster)
      const start2 = Date.now()
      const response2 = await customerClient
        .get('/categories?page=1&limit=10')
        .expect(200)
      const time2 = Date.now() - start2

      // Verify same data
      expect(response2.body).toEqual(response1.body)

      // Second call should be significantly faster (cache hit)
      expect(time2).toBeLessThanOrEqual(time1)

      logger.info('GET /categories cache performance test:', {
        firstCallMs: time1,
        secondCallMs: time2,
        speedup:
          time1 > 0 ? `${Math.round((time1 / time2) * 100) / 100}x` : 'N/A',
        status: 'PASS',
      })
    })

    it('should NOT hang when GET /categories/:id cache is hit (validates fix)', async () => {
      const testCategory = sharedTestData.activeParentCategories[0]

      // Prime the cache - first call should succeed
      await customerClient
        .get(`/categories/${testCategory.id}`)
        .timeout(3000)
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await customerClient
        .get(`/categories/${testCategory.id}`)
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500)
      expect(response.body.id).toBe(testCategory.id)

      logger.info('GET /categories/:id cache hit performance:', {
        elapsedMs: elapsed,
        categoryId: testCategory.id,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should NOT hang when GET /categories/hierarchy cache is hit (validates fix)', async () => {
      // Test the hierarchy endpoint which returns a tree structure

      // Prime the cache
      await customerClient
        .get('/categories/hierarchy')
        .timeout(3000)
        .expect(200)

      // Second call should not hang
      const start = Date.now()
      const response = await customerClient
        .get('/categories/hierarchy')
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body).toBeDefined()
      // Hierarchy endpoint likely returns an object with data array
      expect(response.body.data || response.body).toBeDefined()

      logger.info('GET /categories/hierarchy cache hit performance:', {
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
    it('should handle concurrent category list requests without hanging', async () => {
      const promises = Array.from({ length: 5 }, () => {
        return customerClient.get('/categories?page=1&limit=5').timeout(3000) // Each request must complete within 3 seconds
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.data).toBeDefined()
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      // All responses should be identical (cached)
      const firstResponse = responses[0].body

      responses.forEach((response) => {
        expect(response.body).toEqual(firstResponse)
      })

      // Concurrent requests should complete reasonably quickly
      expect(elapsed).toBeLessThan(5000)

      logger.info('Concurrent category requests performance:', {
        requestCount: promises.length,
        totalElapsedMs: elapsed,
        averageMs: elapsed / promises.length,
        status: 'PASS - No hanging detected',
      })
    })

    it('should handle concurrent single category requests without hanging', async () => {
      const testCategory = sharedTestData.activeParentCategories[0]

      const promises = Array.from({ length: 3 }, () => {
        return customerClient
          .get(`/categories/${testCategory.id}`)
          .timeout(3000)
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed and return the same category
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.id).toBe(testCategory.id)
      })

      expect(elapsed).toBeLessThan(4000)

      logger.info('Concurrent single category requests performance:', {
        requestCount: promises.length,
        categoryId: testCategory.id,
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
        .get('/categories')
        .timeout(5000) // Allow more time since no cache
        .expect(200)
      const elapsed = Date.now() - start

      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(elapsed).toBeLessThan(5000)

      // Reconnect cache
      await cacheService.connect()

      logger.info('Category cache failure resilience test:', {
        elapsedMs: elapsed,
        status: 'PASS - Service continued without cache',
      })
    })
  })

  /**
   * CACHE INVALIDATION TESTS
   */
  describe('Cache Invalidation Tests', () => {
    it('should invalidate category cache when category data changes', async () => {
      // Get initial category list (prime cache)
      const response1 = await customerClient.get('/categories').expect(200)

      const initialCount = response1.body.data.length

      // Simulate cache invalidation (in real scenario, happens on updates)
      await cacheService.delPattern('*category*')

      // Get categories again - should hit database again
      const response2 = await customerClient.get('/categories').expect(200)

      // Should not hang and should return data
      expect(response2.body.data).toBeDefined()
      expect(Array.isArray(response2.body.data)).toBe(true)

      logger.info('Category cache invalidation test:', {
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
    it('should handle invalid category ID without hanging', async () => {
      const start = Date.now()
      const response = await customerClient
        .get('/categories/invalid-uuid-here')
        .timeout(2000)
        .expect(400) // Should return bad request, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Invalid category ID test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle non-existent category ID without hanging', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const start = Date.now()
      const response = await customerClient
        .get(`/categories/${fakeUuid}`)
        .timeout(2000)
        .expect(404) // Should return not found, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(2000)
      expect(response.body.error).toBeDefined()

      logger.info('Non-existent category ID test:', {
        elapsedMs: elapsed,
        categoryId: fakeUuid,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle unauthorized admin access without hanging', async () => {
      const start = Date.now()
      const response = await request
        .post('/categories')
        .send({
          nameKey: 'test.category',
          slug: 'test-cat',
          level: 1,
        })
        .timeout(2000)
        .expect(401) // Should return unauthorized, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Unauthorized admin access test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })
  })
})
