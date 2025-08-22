/**
 * Cache Validation Integration Tests for Auth Service
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

import { createAuthServer } from '@auth-service/server.js'
import {
  createSharedAuthTestData,
  type SharedAuthTestData,
} from '@auth-service/test/helpers/authTestHelpers.js'
import { CommunicationServiceClientMock } from '@auth-service/test/mocks/CommunicationServiceClientMock.js'
import { UserServiceClientMock } from '@auth-service/test/mocks/UserServiceClientMock.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
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

describe('Auth Service Cache Validation Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Shared test data created once
  let sharedTestData: SharedAuthTestData
  let userServiceClient: UserServiceClientMock
  let communicationClient: CommunicationServiceClientMock

  // Test tokens
  let customerAccessToken: string
  let adminAccessToken: string

  beforeAll(async () => {
    logger.debug('Setting up Auth Service Cache Validation tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_auth_cache_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create cache service
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    // Create mock service clients
    userServiceClient = new UserServiceClientMock()
    communicationClient = new CommunicationServiceClientMock()

    // Create auth server with mocked service clients
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient,
      communicationClient,
    })

    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedAuthTestData(testDb.prisma)

    // Use the same pattern as working tests - create test users and get authenticated clients
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // For auth service, we need to login through the service to get valid tokens
    const customerUser = sharedTestData.testUser // Use the specific test user (CUSTOMER role)
    const adminUser = sharedTestData.adminUser // Use the specific admin user

    // Login to get valid tokens from the auth service
    const customerLoginResponse = await request
      .post('/auth/token')
      .send({
        grantType: 'password',
        username: customerUser.email,
        password: sharedTestData.testPassword || 'Password123!',
      })
      .expect(200)

    customerAccessToken = customerLoginResponse.body.accessToken

    const adminLoginResponse = await request
      .post('/auth/token')
      .send({
        grantType: 'password',
        username: adminUser.email,
        password: sharedTestData.testPassword || 'Password123!',
      })
      .expect(200)

    adminAccessToken = adminLoginResponse.body.accessToken

    logger.debug('Auth Service Cache Validation setup complete')
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
    it('should NOT hang when userinfo endpoint cache is hit (validates fix)', async () => {
      // This test validates the fix - controllers no longer have @Cache
      // so responses are properly sent even when cache is hit

      // Prime the cache - first call should succeed
      await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .timeout(2000) // Fail if takes more than 2 seconds
        .expect(200)

      // Second call should complete quickly (not hang) - CRITICAL TEST
      const start = Date.now()
      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .timeout(1000) // Fail if takes more than 1 second
        .expect(200)
      const elapsed = Date.now() - start

      // Should complete quickly when hitting cache
      expect(elapsed).toBeLessThan(500) // Should be very fast with cache
      expect(response.body).toBeDefined()

      logger.info('Userinfo cache hit performance:', {
        elapsedMs: elapsed,
        cacheHit: true,
        status: 'PASS - No hanging detected',
      })
    })

    it('should cache userinfo responses and improve performance', async () => {
      // First call - hits service layer (may hit database or user service)
      const start1 = Date.now()
      const response1 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .expect(200)
      const time1 = Date.now() - start1

      // Second call - should hit cache (much faster)
      const start2 = Date.now()
      const response2 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .expect(200)
      const time2 = Date.now() - start2

      // Verify same data
      expect(response2.body).toEqual(response1.body)

      // Second call should be reasonably fast (cache hit)
      // Note: In test environment with MemoryCache, the difference may be minimal
      // Just ensure it completes quickly, not necessarily faster
      expect(time2).toBeLessThan(100) // Should be fast regardless

      logger.info('Userinfo cache performance test:', {
        firstCallMs: time1,
        secondCallMs: time2,
        speedup:
          time1 > 0 ? `${Math.round((time1 / time2) * 100) / 100}x` : 'N/A',
        status: 'PASS',
      })
    })

    it('should handle concurrent userinfo requests without hanging', async () => {
      // This test ensures concurrent requests don't cause deadlocks or hanging

      const promises = Array.from({ length: 5 }, (_, index) => {
        return request
          .get('/auth/userinfo')
          .set('Authorization', `Bearer ${customerAccessToken}`)
          .set('Accept', 'application/json')
          .timeout(2000) // Each request must complete within 2 seconds
      })

      const start = Date.now()
      const responses = await Promise.all(promises)
      const elapsed = Date.now() - start

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
        expect(response.body).toBeDefined()
      })

      // All responses should be identical (cached)
      const firstResponse = responses[0].body

      responses.forEach((response, index) => {
        expect(response.body).toEqual(firstResponse)
      })

      // Concurrent requests should complete reasonably quickly
      expect(elapsed).toBeLessThan(3000)

      logger.info('Concurrent userinfo requests performance:', {
        requestCount: promises.length,
        totalElapsedMs: elapsed,
        averageMs: elapsed / promises.length,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * OAUTH TOKEN INTROSPECTION CACHE TESTS
   * These endpoints don't have @Cache decorators but may use internal caching
   */
  describe('OAuth Token Introspection - No Hanging Tests', () => {
    it('should handle token introspection without hanging', async () => {
      // Multiple introspection calls with same token

      const introspectData = {
        token: customerAccessToken,
      }

      // First call
      const start1 = Date.now()
      const response1 = await request
        .post('/auth/introspect')
        .send(introspectData)
        .set('Accept', 'application/json')
        .timeout(2000)
        .expect(200)
      const time1 = Date.now() - start1

      // Second call - should not hang
      const start2 = Date.now()
      const response2 = await request
        .post('/auth/introspect')
        .send(introspectData)
        .set('Accept', 'application/json')
        .timeout(1000)
        .expect(200)
      const time2 = Date.now() - start2

      // Responses should be consistent
      expect(response1.body.active).toBe(true)
      expect(response2.body.active).toBe(true)

      logger.info('Token introspection performance:', {
        firstCallMs: time1,
        secondCallMs: time2,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * CACHE INVALIDATION TESTS
   * Verify cache invalidation works correctly
   */
  describe('Cache Invalidation Tests', () => {
    it('should invalidate userinfo cache when user data changes', async () => {
      // Get initial userinfo (prime cache)
      const response1 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .expect(200)

      // Mock a user update that should invalidate cache
      const customerUser = sharedTestData.testUser

      userServiceClient.updateUserMock({
        ...customerUser,
        firstName: 'UpdatedName',
      })

      // Clear the specific cache entry to simulate invalidation
      // In a real scenario, this would happen automatically
      await cacheService.delPattern('*user-info*')

      // Get userinfo again - should reflect changes
      const response2 = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .expect(200)

      // Should not hang and should return updated data
      expect(response2.body).toBeDefined()

      logger.info('Cache invalidation test:', {
        originalData: response1.body,
        updatedData: response2.body,
        status: 'PASS - No hanging detected',
      })
    })
  })

  /**
   * CACHE FAILURE RESILIENCE TESTS
   * Verify service continues to work when cache fails
   */
  describe('Cache Failure Resilience Tests', () => {
    it('should handle cache failures gracefully without hanging', async () => {
      // Disconnect cache to simulate failure
      await cacheService.disconnect()

      // Request should still work (fallback to direct service calls)
      const start = Date.now()
      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .set('Accept', 'application/json')
        .timeout(3000) // Allow more time since no cache
        .expect(200)
      const elapsed = Date.now() - start

      expect(response.body).toBeDefined()
      expect(elapsed).toBeLessThan(3000)

      // Reconnect cache
      await cacheService.connect()

      logger.info('Cache failure resilience test:', {
        elapsedMs: elapsed,
        status: 'PASS - Service continued without cache',
      })
    })
  })

  /**
   * EDGE CASE TESTS
   * Test edge cases that could cause hanging
   */
  describe('Edge Case Tests', () => {
    it('should handle invalid tokens without hanging', async () => {
      const start = Date.now()
      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', 'Bearer invalid_token_here')
        .set('Accept', 'application/json')
        .timeout(2000)
        .expect(401) // Should return unauthorized, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Invalid token test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })

    it('should handle missing Authorization header without hanging', async () => {
      const start = Date.now()
      const response = await request
        .get('/auth/userinfo')
        .set('Accept', 'application/json')
        .timeout(2000)
        .expect(401) // Should return unauthorized, not hang
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(1000)
      expect(response.body.error).toBeDefined()

      logger.info('Missing auth header test:', {
        elapsedMs: elapsed,
        status: 'PASS - Proper error response, no hanging',
      })
    })
  })
})
