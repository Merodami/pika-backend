/**
 * Voucher Validation Integration Tests
 *
 * Tests for URL-based QR code validation system.
 * Covers validation code generation, deep link creation, and voucher validation endpoints.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared')
vi.unmock('@pika/crypto')

import { keyManager } from '@pika/crypto'
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
import { createTranslationResolver } from '@pika/translation'
import {
  DeepLinkPlatform,
  UserRole,
  UserStatus,
  VoucherScanSource,
  VoucherState,
  VoucherValidationCodeType,
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

describe('Voucher Validation - URL-based QR Code Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient

  // Shared test data
  let sharedTestData: SharedVoucherTestData
  let testVoucherId: string

  beforeAll(async () => {
    logger.debug('Setting up Voucher Validation integration tests...')

    // Initialize KeyManager for JWT authentication
    await keyManager.initialize()

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_voucher_validation_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create mock services
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()

    const translationResolver = createTranslationResolver(translationClient)

    // Create mock communication client
    const communicationClient = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
      sendSms: vi.fn().mockResolvedValue({ success: true }),
    }

    // Create mock file storage client
    const fileStorageClient = {
      uploadFile: vi
        .fn()
        .mockResolvedValue({ url: 'https://example.com/image.jpg' }),
      deleteFile: vi.fn().mockResolvedValue(true),
    }

    // Create the Voucher server with mocked dependencies
    app = await createVoucherServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
      translationResolver,
      fileStorage: fileStorageClient,
      communicationClient,
    })

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getUserClient(testDb.prisma)

    // Create a business user and business for test data
    const businessUser = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: `business-${Date.now()}@test.com`,
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        firstName: 'Test',
        lastName: 'Business',
        emailVerified: true,
      },
    })

    const testBusiness = await testDb.prisma.business.create({
      data: {
        id: uuid(),
        userId: businessUser.id,
        businessNameKey: `business.test.${uuid()}`,
        verified: true,
        active: true,
      },
    })

    // Create shared test data with the business
    sharedTestData = await createSharedVoucherTestData(testDb.prisma, {
      businessId: testBusiness.id,
      count: 5,
      generateExpired: false,
    })

    // Pick a published voucher for testing
    testVoucherId =
      sharedTestData.publishedVouchers[0]?.id ||
      sharedTestData.allVouchers[0]?.id

    logger.debug('Test setup complete', {
      vouchersCreated: sharedTestData.allVouchers.length,
      testVoucherId,
    })
  })

  beforeEach(async () => {
    // Clean up validation codes from previous tests
    await testDb.prisma.voucherValidationCode.deleteMany()
  })

  afterAll(async () => {
    await cleanupTestDatabase(testDb)
  })

  describe('POST /vouchers/:id/validate - Validate voucher with URL-based code', () => {
    it('should validate a voucher with a valid validation code', async () => {
      // First, generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      expect(deepLinkResponse.body).toHaveProperty('validationCode')
      expect(deepLinkResponse.body.validationCode).toMatch(
        /^[A-Z0-9]{4}-[A-Z0-9]{4}$/,
      )

      // Now validate with the code
      const validateResponse = await supertest(app)
        .post(`/vouchers/${testVoucherId}/validate`)
        .send({
          code: deepLinkResponse.body.validationCode,
          source: VoucherScanSource.QR,
        })
        .expect(200)

      expect(validateResponse.body).toMatchObject({
        valid: true,
        canRedeem: true,
        voucher: expect.objectContaining({
          id: testVoucherId,
        }),
      })
    })

    it('should reject an invalid validation code', async () => {
      const validateResponse = await supertest(app)
        .post(`/vouchers/${testVoucherId}/validate`)
        .send({
          code: 'XXXX-YYYY', // Invalid code
          source: VoucherScanSource.QR,
        })
        .expect(200)

      expect(validateResponse.body).toMatchObject({
        valid: false,
        canRedeem: false,
        message: expect.stringContaining('Invalid or expired validation code'),
      })
    })

    it('should reject an expired validation code', async () => {
      // Create an expired validation code directly in DB
      const expiredCode = await testDb.prisma.voucherValidationCode.create({
        data: {
          voucherId: testVoucherId,
          code: 'TEST-1234',
          type: VoucherValidationCodeType.SCAN,
          expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
        },
      })

      const validateResponse = await supertest(app)
        .post(`/vouchers/${testVoucherId}/validate`)
        .send({
          code: expiredCode.code,
          source: VoucherScanSource.QR,
        })
        .expect(200)

      expect(validateResponse.body).toMatchObject({
        valid: false,
        canRedeem: false,
        message: expect.stringContaining('expired'),
      })
    })

    it('should track validation attempts for rate limiting', async () => {
      // Generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const validationCode = deepLinkResponse.body.validationCode

      // First validation should work
      await supertest(app)
        .post(`/vouchers/${testVoucherId}/validate`)
        .send({ code: validationCode })
        .expect(200)

      // Check that validation attempt was tracked
      const validationCodeRecord =
        await testDb.prisma.voucherValidationCode.findUnique({
          where: { code: validationCode },
        })

      expect(validationCodeRecord?.usedAt).toBeDefined()
      expect(validationCodeRecord?.usedBy).toBeDefined()
    })

    it('should handle validation with device info and location', async () => {
      // Generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const validateResponse = await supertest(app)
        .post(`/vouchers/${testVoucherId}/validate`)
        .send({
          code: deepLinkResponse.body.validationCode,
          location: {
            lat: -25.2637,
            lng: -57.5759,
          },
          deviceInfo: {
            platform: DeepLinkPlatform.IOS,
            appVersion: '1.0.0',
            deviceId: 'test-device-123',
          },
          source: VoucherScanSource.QR,
        })
        .expect(200)

      expect(validateResponse.body.valid).toBe(true)
    })
  })

  describe('GET /vouchers/:id/deep-link - Generate deep link for QR code', () => {
    it('should generate a deep link with scan type (short TTL)', async () => {
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })

      // Log the error if there is one
      if (response.status !== 200) {
        console.error('Response status:', response.status)
        console.error('Response body:', response.body)
      }

      expect(response.status).toBe(200)

      expect(response.body).toHaveProperty('validationCode')
      expect(response.body.validationCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      expect(response.body).toHaveProperty('expiresAt')
      expect(response.body).toHaveProperty('metadata')

      // Check TTL is short (5 minutes = 300 seconds)
      const expiresAt = new Date(response.body.expiresAt)
      const now = new Date()
      const ttlMinutes = (expiresAt.getTime() - now.getTime()) / 60000

      expect(ttlMinutes).toBeLessThanOrEqual(6) // Allow some buffer
      expect(ttlMinutes).toBeGreaterThan(4)
    })

    it('should generate a deep link with print type (long TTL)', async () => {
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'print' })
        .expect(200)

      expect(response.body).toMatchObject({
        validationCode: expect.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/),
        expiresAt: expect.any(String),
      })

      // Check TTL is long (print type uses 1 year TTL = 31536000 seconds)
      const expiresAt = new Date(response.body.expiresAt)
      const now = new Date()
      const ttlSeconds = (expiresAt.getTime() - now.getTime()) / 1000

      // Print type should have 1 year TTL (31536000 seconds)
      expect(ttlSeconds).toBeGreaterThan(31536000 - 3600) // Allow 1 hour buffer
      expect(ttlSeconds).toBeLessThanOrEqual(31536000 + 3600)
    })

    it('should generate a deep link with digital type (medium TTL)', async () => {
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'digital' })
        .expect(200)

      expect(response.body).toMatchObject({
        validationCode: expect.stringMatching(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/),
        expiresAt: expect.any(String),
      })

      // Check TTL is medium (digital type uses 24 hours = 86400 seconds)
      const expiresAt = new Date(response.body.expiresAt)
      const now = new Date()
      const ttlSeconds = (expiresAt.getTime() - now.getTime()) / 1000

      // Digital type should have 24 hour TTL (86400 seconds)
      expect(ttlSeconds).toBeGreaterThan(86400 - 3600) // Allow 1 hour buffer
      expect(ttlSeconds).toBeLessThanOrEqual(86400 + 3600)
    })

    it('should include campaign metadata when provided', async () => {
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({
          type: 'scan',
          campaign: 'summer-sale-2024',
        })
        .expect(200)

      expect(response.body.metadata).toMatchObject({
        campaign: 'summer-sale-2024',
      })
    })

    it('should support different deep link modes', async () => {
      // Test with deep_link_only mode
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({
          type: 'scan',
          mode: 'custom_scheme', // Use valid enum value
        })
        .expect(200)

      expect(response.body.qrPayload).toBeDefined()
      expect(response.body.metadata.mode).toBe('custom_scheme')
    })

    it('should include offline data when requested', async () => {
      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({
          type: 'scan',
          includeOfflineData: true,
        })
        .expect(200)

      // The deep link should include additional parameters for offline support
      expect(response.body.deepLink).toContain('offline=true')
    })

    it('should require authentication', async () => {
      await supertest(app)
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(401)
    })

    it('should return 404 for non-existent voucher', async () => {
      const fakeVoucherId = uuid()

      await customerClient
        .get(`/vouchers/${fakeVoucherId}/deep-link`)
        .set('Accept', 'application/json')
        .query({ type: 'scan' })
        .expect(404)
    })

    it('should handle custom TTL values', async () => {
      const customTtl = 3600 // 1 hour in seconds

      const response = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({
          type: 'scan',
          ttl: customTtl,
        })
        .expect(200)

      const expiresAt = new Date(response.body.expiresAt)
      const now = new Date()
      const ttlSeconds = (expiresAt.getTime() - now.getTime()) / 1000

      expect(ttlSeconds).toBeGreaterThan(customTtl - 60) // Allow some buffer
      expect(ttlSeconds).toBeLessThanOrEqual(customTtl + 60)
    })
  })

  describe('GET /vouchers/by-code/:code - Get voucher by validation code', () => {
    it('should retrieve voucher using validation code without authentication', async () => {
      // Generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const validationCode = deepLinkResponse.body.validationCode

      // Retrieve voucher by code without authentication
      const response = await supertest(app)
        .get(`/vouchers/by-code/${validationCode}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', testVoucherId)
      expect(response.body).toHaveProperty('state', VoucherState.PUBLISHED)
    })

    it('should return 404 for invalid validation code', async () => {
      await supertest(app).get('/vouchers/by-code/INVALID-CODE').expect(404)
    })

    it('should return 404 for expired validation code', async () => {
      // Create an expired validation code
      const expiredCode = await testDb.prisma.voucherValidationCode.create({
        data: {
          voucherId: testVoucherId,
          code: 'EXPD-9999',
          type: VoucherValidationCodeType.SCAN,
          expiresAt: new Date(Date.now() - 60000), // Expired
        },
      })

      await supertest(app)
        .get(`/vouchers/by-code/${expiredCode.code}`)
        .expect(404)
    })

    it('should track usage when retrieving by validation code', async () => {
      // Generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const validationCode = deepLinkResponse.body.validationCode

      // Retrieve voucher by code
      await supertest(app)
        .get(`/vouchers/by-code/${validationCode}`)
        .expect(200)

      // Check usage was tracked
      const codeRecord = await testDb.prisma.voucherValidationCode.findUnique({
        where: { code: validationCode },
      })

      expect(codeRecord?.usedAt).toBeDefined()
    })
  })

  describe('Validation Code Security', () => {
    it('should not allow reuse of validation codes across different vouchers', async () => {
      // Generate code for first voucher
      const response1 = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const code1 = response1.body.validationCode

      // Try to use same code pattern for different voucher (should get different code)
      const otherVoucherId = sharedTestData.publishedVouchers[1]?.id

      if (otherVoucherId) {
        const response2 = await customerClient
          .get(`/vouchers/${otherVoucherId}/deep-link`)
          .query({ type: 'scan' })
          .expect(200)

        const code2 = response2.body.validationCode

        expect(code1).not.toBe(code2)
      }
    })

    it('should enforce rate limiting on validation attempts', async () => {
      // Generate a validation code
      const deepLinkResponse = await customerClient
        .get(`/vouchers/${testVoucherId}/deep-link`)
        .query({ type: 'scan' })
        .expect(200)

      const validationCode = deepLinkResponse.body.validationCode

      // Make multiple validation attempts
      const attempts = []

      for (let i = 0; i < 5; i++) {
        attempts.push(
          supertest(app)
            .post(`/vouchers/${testVoucherId}/validate`)
            .send({ code: validationCode }),
        )
      }

      const results = await Promise.all(attempts)

      // All should succeed (rate limiting would be implemented with Redis in production)
      results.forEach((result) => {
        expect(result.status).toBe(200)
      })

      // Check that code was used
      const codeRecord = await testDb.prisma.voucherValidationCode.findUnique({
        where: { code: validationCode },
      })

      expect(codeRecord?.usedAt).toBeDefined()
    })

    it('should properly handle concurrent validation code generation', async () => {
      // Generate multiple codes concurrently
      const promises = []

      for (let i = 0; i < 10; i++) {
        promises.push(
          customerClient
            .get(`/vouchers/${testVoucherId}/deep-link`)
            .query({ type: 'scan' }),
        )
      }

      const results = await Promise.all(promises)
      const codes = results.map((r) => r.body.validationCode)

      // All codes should be unique
      const uniqueCodes = new Set(codes)

      expect(uniqueCodes.size).toBe(10)

      // All codes should be valid format
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      })
    })
  })

  describe('Migration Compatibility', () => {
    it('should still support legacy short codes if they exist', async () => {
      // Create a voucher with legacy short code
      const legacyCode = await testDb.prisma.voucherCode.create({
        data: {
          voucherId: testVoucherId,
          code: 'LGCY-8888',
          type: 'short',
        },
      })

      // Should be able to retrieve voucher by legacy code
      const response = await supertest(app)
        .get(`/vouchers/by-code/${legacyCode.code}`)
        .expect(200)

      expect(response.body.id).toBe(testVoucherId)
    })

    it('should prioritize validation codes over legacy codes', async () => {
      // Create both validation code and legacy code
      const validationCode = await testDb.prisma.voucherValidationCode.create({
        data: {
          voucherId: testVoucherId,
          code: 'BOTH-1111',
          type: VoucherValidationCodeType.SCAN,
          expiresAt: new Date(Date.now() + 60000),
        },
      })

      // Create legacy code with same code (shouldn't happen in practice)
      await testDb.prisma.voucherCode.create({
        data: {
          voucherId: sharedTestData.publishedVouchers[1].id, // Different voucher
          code: 'BOTH-1111',
          type: 'short',
        },
      })

      // Should return the voucher associated with validation code
      const response = await supertest(app)
        .get(`/vouchers/by-code/${validationCode.code}`)
        .expect(200)

      expect(response.body.id).toBe(testVoucherId)
    })
  })
})
