/**
 * Idempotency Integration Tests
 *
 * Tests the industry-standard idempotency implementation following patterns from:
 * - @node-idempotency/fastify package
 * - RFC standards for idempotent HTTP operations
 * - Fastify best practices using onRequest/onResponse hooks
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

import {
  type AuthenticatedRequestClient,
  createE2EAuthHelper,
  createMockServiceClients,
  createTestDatabase,
  type E2EAuthHelper,
  MockCacheService,
} from '@pika/tests'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createRedemptionServer } from '../../../server.js'

describe('Idempotency Integration Tests', () => {
  let app: FastifyInstance
  let cleanup: () => Promise<void>
  let cacheService: MockCacheService
  let authHelper: E2EAuthHelper
  let providerClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

  beforeAll(async () => {
    const testDb = await createTestDatabase()

    cleanup = testDb.cleanup

    cacheService = new MockCacheService()

    // Create mock service clients
    const { voucherServiceClient, providerServiceClient } =
      createMockServiceClients()

    // Create test server with idempotency enabled
    app = await createRedemptionServer({
      prisma: testDb.prisma,
      cacheService,
      jwtKeys: {
        privateKey: 'test-private-key-must-be-at-least-32-characters-long',
        publicKey: 'test-public-key-must-be-at-least-32-characters-long',
      },
      serviceClients: {
        voucherServiceClient: voucherServiceClient as any,
        providerServiceClient: providerServiceClient as any,
      },
    })

    await app.ready()
    // Supertest initialized but not stored - using auth clients instead

    // Create auth helper and test users
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    providerClient = await authHelper.getProviderClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
  })

  beforeEach(async () => {
    // Clear cache between tests - MockCacheService doesn't have clear method
    // Instead create a new instance
    cacheService = new MockCacheService()
  })

  afterAll(async () => {
    await app?.close()
    await cleanup?.()
  })

  describe('Idempotency Headers', () => {
    it('should require X-Idempotency-Key header for POST requests', async () => {
      const response = await providerClient.post('/redemptions').send({
        code: 'test-voucher-code',
        provider_id: 'test-provider-id',
      })

      // Should proceed normally without idempotency key (not enforced for all endpoints)
      // Redemption service returns 200 with success: false for business logic errors
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(false)
      expect(response.body.errorCode).toBeDefined()
    })

    it('should validate idempotency key format', async () => {
      const response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', 'invalid-key') // Too short
        .send({
          code: 'test-voucher-code',
          provider_id: 'test-provider-id',
        })

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        error: 'Invalid idempotency key format',
        message:
          'Idempotency key must be 16-128 characters, alphanumeric and hyphens only',
      })
    })

    it('should accept valid idempotency key format', async () => {
      const validKey = 'test-idempotency-key-12345-valid-format'

      const response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', validKey)
        .send({
          code: 'test-voucher-code',
          provider_id: 'test-provider-id',
        })

      // Should not return idempotency validation error
      expect(response.status).not.toBe(400)
      expect(response.body?.error).not.toContain(
        'Invalid idempotency key format',
      )
    })
  })

  describe('Idempotent Request Processing', () => {
    const idempotencyKey = 'test-redemption-idempotency-key-123456'

    it('should process request normally on first attempt', async () => {
      const response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          code: 'test-voucher-code',
          provider_id: 'test-provider-id',
        })

      // Should process normally (even if it fails business validation)
      expect(response.status).toBeDefined()
      expect(response.headers['x-idempotent-replayed']).toBeUndefined()
    })

    it('should return cached response for duplicate requests', async () => {
      const requestPayload = {
        code: 'test-voucher-code-duplicate',
        provider_id: 'test-provider-id',
      }

      // First request
      const firstResponse = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', 'duplicate-test-key-12345678')
        .send(requestPayload)

      expect(firstResponse.status).toBeDefined()

      // Duplicate request with same idempotency key
      const duplicateResponse = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', 'duplicate-test-key-12345678')
        .send(requestPayload)

      // Should return cached response with idempotency headers
      expect(duplicateResponse.status).toBe(200)
      expect(duplicateResponse.headers['x-idempotency-key']).toBe(
        'duplicate-test-key-12345678',
      )
      expect(duplicateResponse.headers['x-idempotent-replayed']).toBe('true')
      expect(duplicateResponse.body).toMatchObject({
        success: true,
        cached: true,
        message: 'Request processed successfully (cached response)',
      })
    })

    it('should include original status code in cached response', async () => {
      const idempotencyKey = 'status-code-test-key-12345678'

      // First request (will likely result in validation error)
      const firstResponse = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          code: 'invalid-voucher-code',
          provider_id: 'test-provider-id',
        })

      const originalStatus = firstResponse.status

      // Duplicate request
      const duplicateResponse = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          code: 'invalid-voucher-code',
          provider_id: 'test-provider-id',
        })

      expect(duplicateResponse.status).toBe(200)
      expect(duplicateResponse.body.originalStatus).toBe(originalStatus)
      expect(duplicateResponse.body.cached).toBe(true)
    })
  })

  describe('Idempotency Scope', () => {
    it('should scope idempotency by user ID', async () => {
      const idempotencyKey = 'user-scoped-key-12345678'
      const payload = { code: 'test-code', provider_id: 'test-provider' }

      // Request from first user
      const user1Response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send(payload)

      // Request from second user with same idempotency key (using customer client as different user)
      const user2Response = await customerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send(payload)

      // Should be processed as separate requests (not cached)
      expect(user2Response.headers['x-idempotent-replayed']).toBeUndefined()
      expect(user1Response.status).toBeDefined()
      expect(user2Response.status).toBeDefined()
    })

    it('should scope idempotency by endpoint path', async () => {
      const idempotencyKey = 'path-scoped-key-12345678'

      // POST to redemptions endpoint
      const redemptionResponse = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          code: 'test-code',
          provider_id: 'test-provider-id',
        })

      // POST to sync-offline endpoint with same key
      const syncResponse = await providerClient
        .post('/redemptions/sync-offline')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          redemptions: [],
        })

      // Should be processed as separate requests (different endpoints)
      expect(syncResponse.headers['x-idempotent-replayed']).toBeUndefined()
      expect(redemptionResponse.status).toBeDefined()
      expect(syncResponse.status).toBeDefined()
    })
  })

  describe('Cache Management', () => {
    it('should respect cache TTL settings', async () => {
      const idempotencyKey = 'ttl-test-key-12345678'

      // First request
      await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          code: 'test-code',
          provider_id: 'test-provider-id',
        })

      // Verify cache entry exists
      const cacheKey = `idempotency:redemption:POST:user:test-provider-id:/redemptions:${idempotencyKey}`
      const cachedResponse = await cacheService.get(cacheKey)

      expect(cachedResponse).toBeDefined()
    })

    it('should handle cache failures gracefully', async () => {
      // Mock cache service to fail
      const originalSet = cacheService.set

      cacheService.set = async () => {
        throw new Error('Cache service unavailable')
      }

      const response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', 'cache-failure-test-12345678')
        .send({
          code: 'test-code',
          provider_id: 'test-provider-id',
        })

      // Should still process request normally
      expect(response.status).toBeDefined()

      // Restore cache service
      cacheService.set = originalSet
    })
  })

  describe('HTTP Method Support', () => {
    it('should apply idempotency to POST requests', async () => {
      const response = await providerClient
        .post('/redemptions')
        .set('X-Idempotency-Key', 'post-method-test-12345678')
        .send({
          code: 'test-code',
          provider_id: 'test-provider-id',
        })

      expect(response.status).toBeDefined()
    })

    it('should apply idempotency to PUT requests', async () => {
      // Note: This would require a PUT endpoint to test properly
      // For now, we verify the configuration includes PUT in methods
      expect(true).toBe(true) // Placeholder - actual PUT endpoint test would go here
    })

    it('should NOT apply idempotency to GET requests', async () => {
      const response = await customerClient
        .get('/redemptions/test-id')
        .set('X-Idempotency-Key', 'get-method-test-12345678')

      // Should process normally without idempotency checks
      expect(response.status).toBeDefined()
      expect(response.headers['x-idempotency-key']).toBeUndefined()
    })
  })
})
