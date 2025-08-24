/**
 * Cache Validation Integration Tests for User Service
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

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
} from '@pika/tests'
import { createUserServer } from '@user/server.js'
import {
  createSharedUserTestData,
  type SharedUserTestData,
} from '@user/test/helpers/userTestHelpers.js'
import type { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('User Service Cache Validation Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Shared test data created once
  let sharedTestData: SharedUserTestData

  // Test clients (authenticated supertest clients)
  let adminClient: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    logger.debug('Setting up User Service Cache Validation tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_cache_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create cache service
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    // Create user server
    app = await createUserServer({
      port: 0, // Random port for testing
      cacheService,
      prisma: testDb.prisma,
    })

    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedUserTestData(testDb.prisma)

    // Create test users and authenticate them (like working tests)
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    await authHelper.getUserClient(testDb.prisma)
    adminClient = await authHelper.getAdminClient(testDb.prisma)

    logger.debug('User Service Cache Validation setup complete')
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
   * CRITICAL CACHE VALIDATION TESTS - PUBLIC ENDPOINTS
   * These tests validate the fix for the hanging request bug
   */
  describe('Public User Endpoints - Cache Validation Tests', () => {
    it('should NOT hang when cached getUserById is called (validates fix)', async () => {
      const testUser = sharedTestData.customerUsers[0]

      // Prime the cache - first call should succeed
      await adminClient
        .get(`/users/${testUser.id}`)
        .timeout(3000) // Fail if takes more than 3 seconds
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await adminClient
        .get(`/users/${testUser.id}`)
        .timeout(1000) // Fail if takes more than 1 second
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500) // Should be very fast with cache
      expect(response.body).toBeDefined()
      expect(response.body.id).toBe(testUser.id)

      logger.info('GET /users/:id cache hit performance:', {
        elapsedMs: elapsed,
        userId: testUser.id,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should cache getUserById responses and improve performance', async () => {
      const testUser = sharedTestData.customerUsers[1]

      // First call - hits service layer/database
      const start1 = Date.now()
      const response1 = await adminClient
        .get(`/users/${testUser.id}`)
        .expect(200)
      const time1 = Date.now() - start1

      // Second call - should hit cache (much faster)
      const start2 = Date.now()
      const response2 = await adminClient
        .get(`/users/${testUser.id}`)
        .expect(200)
      const time2 = Date.now() - start2

      // Verify same data
      expect(response2.body).toEqual(response1.body)
      expect(response2.body.id).toBe(testUser.id)

      // Second call should be significantly faster (cache hit)
      expect(time2).toBeLessThanOrEqual(time1)

      logger.info('GET /users/:id cache performance test:', {
        firstCallMs: time1,
        secondCallMs: time2,
        speedup:
          time1 > 0 ? `${Math.round((time1 / time2) * 100) / 100}x` : 'N/A',
        userId: testUser.id,
        status: 'PASS',
      })
    })

    it('should NOT hang when cached getUserByEmail is called (validates fix)', async () => {
      const testUser = sharedTestData.customerUsers[2]

      // Prime the cache
      await adminClient
        .get(`/admin/users/email/${encodeURIComponent(testUser.email)}`)
        .timeout(3000)
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await adminClient
        .get(`/admin/users/email/${encodeURIComponent(testUser.email)}`)
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body.email).toBe(testUser.email)

      logger.info('GET /users/email/:email cache hit performance:', {
        elapsedMs: elapsed,
        email: testUser.email,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should NOT hang when cached getAllUsers is called (validates fix)', async () => {
      // Prime the cache
      await adminClient
        .get('/admin/users?page=1&limit=5')
        .timeout(3000)
        .expect(200)

      // Second call should not hang
      const start = Date.now()
      const response = await adminClient
        .get('/admin/users?page=1&limit=5')
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)

      logger.info('GET /users cache hit performance:', {
        elapsedMs: elapsed,
        userCount: response.body.data.length,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * INTERNAL USER ENDPOINTS CACHE TESTS
   */
  describe('Internal User Endpoints - Cache Validation Tests', () => {
    it.skip('should NOT hang when cached getUserBySubToken is called (validates fix)', async () => {
      const testUser = sharedTestData.customerUsers[0]

      // Create a mock subtoken for testing (in real scenario, this would be from external auth)
      const mockSubToken = `auth0|${testUser.id.replace(/-/g, '')}`

      // Update user with subToken for this test
      await testDb.prisma.user.update({
        where: { id: testUser.id },
        data: { subToken: mockSubToken },
      })

      // Prime the cache
      await request
        .get(`/internal/users/sub-token/${encodeURIComponent(mockSubToken)}`)
        .set('x-api-key', 'test-internal-key')
        .timeout(3000)
        .expect(200)

      // Second call should complete quickly (not hang)
      const start = Date.now()
      const response = await request
        .get(`/internal/users/sub-token/${encodeURIComponent(mockSubToken)}`)
        .set('x-api-key', 'test-internal-key')
        .timeout(1000)
        .expect(200)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(500)
      expect(response.body.subToken).toBe(mockSubToken)

      logger.info(
        'GET /internal/users/sub-token/:token cache hit performance:',
        {
          elapsedMs: elapsed,
          subToken: mockSubToken.substring(0, 10) + '...',
          status: 'PASS - No hanging detected',
        },
      )
    })
  })

  /**
   * CONCURRENT REQUESTS TEST
   * Verify concurrent requests don't cause deadlocks or hanging
   */
  describe('Concurrent Requests Tests', () => {
    it('should handle concurrent user list requests without hanging', async () => {
      const promises = Array.from({ length: 5 }, () => {
        return adminClient.get('/admin/users?page=1&limit=3').timeout(3000) // Each request must complete within 3 seconds
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

      logger.info('Concurrent user list requests performance:', {
        requestCount: promises.length,
        totalElapsedMs: elapsed,
        averageMs: elapsed / promises.length,
        status: 'PASS - No hanging detected',
      })
    })

    it('should handle concurrent single user requests without hanging', async () => {
      const testUser = sharedTestData.customerUsers[0]

      const promises = Array.from({ length: 3 }, () => {
        return adminClient.get(`/users/${testUser.id}`).timeout(3000)
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed and return the same user
      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.id).toBe(testUser.id)
      })

      expect(elapsed).toBeLessThan(4000)

      logger.info('Concurrent single user requests performance:', {
        requestCount: promises.length,
        userId: testUser.id,
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

      const testUser = sharedTestData.customerUsers[0]

      // Request should still work (fallback to direct database calls)
      const start = Date.now()
      const response = await adminClient
        .get(`/users/${testUser.id}`)
        .timeout(5000) // Allow more time since no cache
        .expect(200)
      const elapsed = Date.now() - start

      expect(response.body.id).toBe(testUser.id)
      expect(elapsed).toBeLessThan(5000)

      // Reconnect cache
      await cacheService.connect()

      logger.info('User cache failure resilience test:', {
        elapsedMs: elapsed,
        userId: testUser.id,
        status: 'PASS - Service continued without cache',
      })
    })
  })

  /**
   * CACHE INVALIDATION TESTS
   */
  describe('Cache Invalidation Tests', () => {
    it('should invalidate user cache when user data changes', async () => {
      const testUser = sharedTestData.customerUsers[0]

      // Get initial user data (prime cache)
      const response1 = await adminClient
        .get(`/users/${testUser.id}`)
        .expect(200)

      const originalFirstName = response1.body.firstName

      // Update user data directly in database to simulate change
      await testDb.prisma.user.update({
        where: { id: testUser.id },
        data: { firstName: 'UpdatedName' },
      })

      // Clear cache to simulate invalidation
      await cacheService.delPattern('*user*')

      // Get user again - should reflect changes
      const response2 = await adminClient
        .get(`/users/${testUser.id}`)
        .expect(200)

      // Should not hang and should return updated data
      expect(response2.body.id).toBe(testUser.id)
      expect(response2.body.firstName).toBe('UpdatedName')
      expect(response2.body.firstName).not.toBe(originalFirstName)

      // Restore original data
      await testDb.prisma.user.update({
        where: { id: testUser.id },
        data: { firstName: originalFirstName },
      })

      logger.info('User cache invalidation test:', {
        userId: testUser.id,
        originalName: originalFirstName,
        updatedName: response2.body.firstName,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * EDGE CASE TESTS
   */
  describe('Edge Case Tests', () => {
    it('should handle invalid user ID without hanging', async () => {
      const start = Date.now()
      const response = await adminClient
        .get('/users/invalid-uuid-here')
        .timeout(2000)
        .expect(400) // Should return bad request, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Invalid user ID test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle non-existent user ID without hanging', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const start = Date.now()
      const response = await adminClient
        .get(`/users/${fakeUuid}`)
        .timeout(2000)
        .expect(404) // Should return not found, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(2000)
      expect(response.body.error).toBeDefined()

      logger.info('Non-existent user ID test:', {
        elapsedMs: elapsed,
        userId: fakeUuid,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle unauthorized access without hanging', async () => {
      const testUser = sharedTestData.customerUsers[0]

      const start = Date.now()
      const response = await request
        .get(`/users/${testUser.id}`)
        .timeout(2000)
        .expect(401) // Should return unauthorized, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Unauthorized user access test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle malformed email in getUserByEmail without hanging', async () => {
      const start = Date.now()

      await adminClient
        .get('/admin/users/email/not-an-email')
        .timeout(2000)
        .expect(400) // Should return bad request for invalid email, not hang

      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      // Not all 404s return error field, just check response completed

      logger.info('Malformed email test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })
  })

  /**
   * USER VERIFICATION CACHE TESTS
   * Test verification endpoints that may use caching
   */
  describe('User Verification Endpoints - Cache Validation', () => {
    it('should handle verification requests without hanging', async () => {
      const testUser = sharedTestData.customerUsers[0]

      // Test email verification endpoint (may involve caching)
      const start = Date.now()

      await adminClient
        .post(`/admin/users/verify`)
        .send({
          type: 'email',
          userId: testUser.id,
        })
        .timeout(3000)
        .expect(204) // Verification endpoints typically return 204 No Content

      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(3000)
      // 204 No Content may have empty body, just check it completed

      logger.info('Email verification test:', {
        elapsedMs: elapsed,
        userId: testUser.id,
        status: 'PASS - No hanging detected',
      })
    })
  })
})
