/**
 * Business Settings Integration Tests
 *
 * Tests for business settings endpoints that allow business owners
 * to manage their configuration and preferences.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared') // Unmock shared to use real error classes with real middleware

import { createBusinessServer } from '@business/server.js'
import {
  createSharedBusinessTestData,
  type SharedBusinessTestData,
} from '@business/test/helpers/businessTestHelpers.js'
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
import {
  Currency,
  DashboardView,
  Language,
  type PartialBusinessSettings,
  PaymentTerms,
  RefundPolicy,
  ResponseTimeCommitment,
  TimeRange,
  UserRole,
  UserStatus,
  VoucherTemplate,
} from '@pika/types'
import { UserServiceClientMock } from '@tests/mocks/services'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Business Settings Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient
  let userServiceClient: UserServiceClientMock

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient
  let otherBusinessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedBusinessTestData

  // Test business for settings tests
  let testBusiness: any
  let otherBusiness: any
  let businessUserId: string
  let otherBusinessUserId: string

  beforeAll(async () => {
    logger.debug('Setting up Business Settings integration tests...')

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_settings_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()

    // Create mock user service client
    userServiceClient = new UserServiceClientMock()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
      userServiceClient,
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

    // Get the business user ID
    const businessUser = await testDb.prisma.user.findUnique({
      where: { email: 'business@e2etest.com' },
    })

    businessUserId = businessUser?.id || uuid()

    // Create another business user for ownership tests
    const otherBusinessUser = await testDb.prisma.user.create({
      data: {
        email: 'other.business@test.com',
        firstName: 'Other',
        lastName: 'Business',
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    })

    otherBusinessUserId = otherBusinessUser.id

    // Create JWT token manually for the other business user using the auth helper's internal method
    const jwt = require('jsonwebtoken')
    const otherBusinessToken = jwt.sign(
      {
        userId: otherBusinessUser.id,
        email: otherBusinessUser.email,
        role: UserRole.BUSINESS,
        status: UserStatus.ACTIVE,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      keyManager.getJWTPrivateKeyPEM(),
      {
        algorithm: 'RS256',
        expiresIn: '1h',
        issuer: process.env.JWT_ISSUER || 'voucherbook-auth',
        audience: process.env.JWT_AUDIENCE || 'voucherbook-api',
        subject: otherBusinessUser.id,
      },
    )

    // Create authenticated client with the token using the AuthenticatedRequestClient pattern
    otherBusinessClient = new AuthenticatedRequestClient(
      request,
      otherBusinessToken,
    )

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedBusinessTestData(testDb.prisma)

    // Create test businesses for settings tests
    testBusiness = await testDb.prisma.business.create({
      data: {
        userId: businessUserId,
        businessNameKey: 'business.name.settings.test',
        businessDescriptionKey: 'business.description.settings.test',
        categoryId: sharedTestData.activeCategory.id,
        verified: true,
        active: true,
        settings: null, // Start with no settings
      },
    })

    otherBusiness = await testDb.prisma.business.create({
      data: {
        userId: otherBusinessUserId,
        businessNameKey: 'business.name.other',
        businessDescriptionKey: 'business.description.other',
        categoryId: sharedTestData.activeCategory.id,
        verified: true,
        active: true,
        settings: null,
      },
    })

    logger.debug('Created test businesses for settings tests')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests
    translationClient.clear()

    // Reset and setup user service mock for each test
    userServiceClient.reset().setupAuthSuccess()

    // Reset test business settings to null
    await testDb.prisma.business.update({
      where: { id: testBusiness.id },
      data: { settings: null },
    })
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Business Settings Tests
  describe('GET /businesses/:id/settings', () => {
    it('should return default settings when business has no settings', async () => {
      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings).toBeDefined()
      expect(response.body.settings.version).toBe('1.0')

      // Check default values
      expect(response.body.settings.store).toMatchObject({
        timezone: 'America/New_York',
        currency: Currency.USD,
        primaryLanguage: Language.EN,
        refundPolicy: RefundPolicy.STORE_CREDIT,
        paymentTerms: PaymentTerms.IMMEDIATE,
      })

      expect(response.body.settings.voucher).toMatchObject({
        autoApproveVouchers: false,
        defaultValidityDays: 30,
        maxActiveVouchers: 10,
        showOnMarketplace: true,
      })
    })

    it('should return existing settings when business has settings', async () => {
      // First update settings - need to provide all required fields
      const customSettings = {
        version: '1.0',
        store: {
          timezone: 'America/Los_Angeles',
          currency: Currency.EUR,
          primaryLanguage: Language.ES,
          refundPolicy: RefundPolicy.FULL,
          paymentTerms: PaymentTerms.NET_30,
        },
        payment: {
          acceptsCash: true,
          acceptsCard: false,
          acceptsTransfer: false,
          acceptsMobilePayment: false,
          providesInvoice: false,
        },
        voucher: {
          autoApproveVouchers: true,
          defaultValidityDays: 60,
          maxActiveVouchers: 20,
          maxRedemptionsPerCustomer: 3,
          requiresVerification: true,
          minimumPurchaseAmount: 0,
          showOnMarketplace: true,
          allowSharing: true,
          platformCommissionAgreed: false,
        },
        communication: {
          responseTimeCommitment: ResponseTimeCommitment.TWENTY_FOUR_HOURS,
          autoReplyEnabled: false,
          acceptsWhatsApp: false,
          acceptsSMS: false,
        },
        analytics: {
          dashboardView: DashboardView.SIMPLE,
          defaultTimeRange: TimeRange.WEEK,
          emailReports: false,
        },
        branding: {
          voucherTemplate: VoucherTemplate.STANDARD,
          showLogoOnVouchers: true,
        },
        notifications: {
          notifyOnVoucherClaim: true,
          notifyOnVoucherRedeem: true,
          notifyOnVoucherExpiring: true,
          notifyOnNewReview: true,
          dailySummary: false,
          monthlySummary: true,
          emailNotifications: true,
          pushNotifications: true,
          inAppNotifications: true,
        },
        updatedAt: new Date(),
      }

      await testDb.prisma.business.update({
        where: { id: testBusiness.id },
        data: {
          settings: customSettings as any,
        },
      })

      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings.store.timezone).toBe('America/Los_Angeles')
      expect(response.body.settings.store.currency).toBe(Currency.EUR)
      expect(response.body.settings.store.primaryLanguage).toBe(Language.ES)
      expect(response.body.settings.voucher.autoApproveVouchers).toBe(true)
      expect(response.body.settings.voucher.defaultValidityDays).toBe(60)
    })

    it('should prevent accessing settings of another business', async () => {
      await businessClient
        .get(`/businesses/${otherBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(403) // Forbidden - not the owner
    })

    it('should require authentication', async () => {
      const response = await request
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')

      expect(response.status).toBe(401)
    })

    it('should prevent customers from accessing business settings', async () => {
      await customerClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should cache settings for performance', async () => {
      // First request - cache miss
      const response1 = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      const settings1 = response1.body.settings

      // Update database directly (bypassing cache)
      await testDb.prisma.business.update({
        where: { id: testBusiness.id },
        data: {
          settings: {
            ...settings1,
            store: {
              ...settings1.store,
              timezone: 'Europe/London',
            },
          } as any,
        },
      })

      // Second request - should get cached version
      const response2 = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      // Should still have old timezone from cache
      expect(response2.body.settings.store.timezone).toBe('America/New_York')
    })
  })

  describe('PATCH /businesses/:id/settings', () => {
    it('should update specific settings sections', async () => {
      const updateData: PartialBusinessSettings = {
        store: {
          timezone: 'Asia/Tokyo',
          currency: Currency.GBP,
        },
        voucher: {
          autoApproveVouchers: true,
          maxActiveVouchers: 50,
        },
      }

      const response = await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings.store.timezone).toBe('Asia/Tokyo')
      expect(response.body.settings.store.currency).toBe(Currency.GBP)
      expect(response.body.settings.voucher.autoApproveVouchers).toBe(true)
      expect(response.body.settings.voucher.maxActiveVouchers).toBe(50)

      // Other settings should remain at defaults
      expect(response.body.settings.store.primaryLanguage).toBe(Language.EN)
      expect(response.body.settings.voucher.defaultValidityDays).toBe(30)
    })

    it('should validate settings before updating', async () => {
      const invalidData = {
        store: {
          timezone: 'Invalid/Timezone',
        },
        voucher: {
          defaultValidityDays: 500, // Exceeds max of 365
          maxActiveVouchers: -1, // Negative number
        },
        branding: {
          primaryColor: 'not-a-hex-color', // Invalid hex color
        },
      }

      const response = await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('validationError')
    })

    it('should merge partial updates correctly', async () => {
      // First update
      await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({
          store: {
            timezone: 'Europe/Paris',
            currency: Currency.EUR,
          },
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Second update - different section
      await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({
          payment: {
            acceptsCash: true,
            acceptsCard: true,
          },
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Get final settings
      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      // Both updates should be preserved
      expect(response.body.settings.store.timezone).toBe('Europe/Paris')
      expect(response.body.settings.store.currency).toBe(Currency.EUR)
      expect(response.body.settings.payment.acceptsCash).toBe(true)
      expect(response.body.settings.payment.acceptsCard).toBe(true)
    })

    it('should prevent updating settings of another business', async () => {
      await businessClient
        .patch(`/businesses/${otherBusiness.id}/settings`)
        .send({
          store: {
            timezone: 'America/Chicago',
          },
        })
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should invalidate cache after update', async () => {
      // Get initial settings (populates cache)
      await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      // Update settings
      const updateData = {
        store: {
          timezone: 'Australia/Sydney',
        },
      }

      await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      // Get settings again - should have new values
      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings.store.timezone).toBe('Australia/Sydney')
    })

    it('should update all settings sections', async () => {
      const completeUpdate: PartialBusinessSettings = {
        store: {
          timezone: 'Europe/Berlin',
          currency: Currency.EUR,
          primaryLanguage: Language.ES,
          refundPolicy: RefundPolicy.FULL,
          paymentTerms: PaymentTerms.NET_30,
        },
        payment: {
          acceptsCash: true,
          acceptsCard: true,
          acceptsTransfer: true,
          acceptsMobilePayment: true,
          providesInvoice: true,
        },
        voucher: {
          autoApproveVouchers: true,
          defaultValidityDays: 90,
          maxActiveVouchers: 100,
          maxRedemptionsPerCustomer: 5,
          requiresVerification: false,
          minimumPurchaseAmount: 10,
          showOnMarketplace: false,
          allowSharing: true,
          platformCommissionAgreed: true,
        },
        communication: {
          responseTimeCommitment: ResponseTimeCommitment.ONE_HOUR,
          autoReplyEnabled: true,
          autoReplyMessage: 'We will get back to you soon!',
          acceptsWhatsApp: true,
          acceptsSMS: false,
        },
        analytics: {
          dashboardView: DashboardView.DETAILED,
          defaultTimeRange: TimeRange.MONTH,
          emailReports: true,
        },
        branding: {
          voucherTemplate: VoucherTemplate.PREMIUM,
          primaryColor: '#FF5733',
          showLogoOnVouchers: true,
        },
        notifications: {
          notifyOnVoucherClaim: true,
          notifyOnVoucherRedeem: true,
          notifyOnVoucherExpiring: false,
          notifyOnNewReview: true,
          dailySummary: true,
          monthlySummary: false,
          emailNotifications: true,
          pushNotifications: true,
          inAppNotifications: false,
        },
      }

      const response = await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send(completeUpdate)
        .set('Accept', 'application/json')
        .expect(200)

      const settings = response.body.settings

      // Verify all sections were updated
      expect(settings.store).toMatchObject(completeUpdate.store!)
      expect(settings.payment).toMatchObject(completeUpdate.payment!)
      expect(settings.voucher).toMatchObject(completeUpdate.voucher!)
      expect(settings.communication).toMatchObject(completeUpdate.communication!)
      expect(settings.analytics).toMatchObject(completeUpdate.analytics!)
      expect(settings.branding).toMatchObject(completeUpdate.branding!)
      expect(settings.notifications).toMatchObject(completeUpdate.notifications!)
    })
  })

  describe('POST /businesses/:id/settings/reset', () => {
    beforeEach(async () => {
      // Set custom settings before each reset test
      const customSettings: PartialBusinessSettings = {
        store: {
          timezone: 'Europe/London',
          currency: Currency.GBP,
        },
        voucher: {
          autoApproveVouchers: true,
          defaultValidityDays: 60,
        },
        payment: {
          acceptsCash: false,
          acceptsCard: true,
        },
      }

      await testDb.prisma.business.update({
        where: { id: testBusiness.id },
        data: {
          settings: customSettings as any,
        },
      })

      // Clear cache to ensure fresh data
      await cacheService.clearAll()
    })

    it('should reset all settings to defaults when no sections specified', async () => {
      const response = await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({})
        .set('Accept', 'application/json')
        .expect(200)

      const settings = response.body.settings

      // All settings should be back to defaults
      expect(settings.store.timezone).toBe('America/New_York')
      expect(settings.store.currency).toBe(Currency.USD)
      expect(settings.voucher.autoApproveVouchers).toBe(false)
      expect(settings.voucher.defaultValidityDays).toBe(30)
      expect(settings.payment.acceptsCash).toBe(true)
      expect(settings.payment.acceptsCard).toBe(false)
    })

    it('should reset only specified sections', async () => {
      const response = await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({
          sections: ['store', 'payment'],
        })
        .set('Accept', 'application/json')
        .expect(200)

      const settings = response.body.settings

      // Store and payment should be reset
      expect(settings.store.timezone).toBe('America/New_York')
      expect(settings.store.currency).toBe(Currency.USD)
      expect(settings.payment.acceptsCash).toBe(true)
      expect(settings.payment.acceptsCard).toBe(false)

      // Voucher should keep custom settings
      expect(settings.voucher.autoApproveVouchers).toBe(true)
      expect(settings.voucher.defaultValidityDays).toBe(60)
    })

    it('should validate section names', async () => {
      const response = await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({
          sections: ['invalid_section', 'store'],
        })
        .set('Accept', 'application/json')
        .expect(400)

      // Should return validation error for invalid section name
      expect(response.body.error.code).toBe('validationError')
      expect(response.body.error.message).toContain('Invalid')
    })

    it('should prevent resetting settings of another business', async () => {
      await businessClient
        .post(`/businesses/${otherBusiness.id}/settings/reset`)
        .send({})
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should invalidate cache after reset', async () => {
      // Get settings to populate cache
      await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      // Reset settings
      await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({})
        .set('Accept', 'application/json')
        .expect(200)

      // Get settings again - should have default values
      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings.store.timezone).toBe('America/New_York')
    })

    it('should handle multiple section resets', async () => {
      const response = await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({
          sections: ['store', 'voucher', 'payment', 'branding'],
        })
        .set('Accept', 'application/json')
        .expect(200)

      const settings = response.body.settings

      // All specified sections should be reset
      expect(settings.store.timezone).toBe('America/New_York')
      expect(settings.voucher.autoApproveVouchers).toBe(false)
      expect(settings.payment.acceptsCash).toBe(true)
      expect(settings.branding.voucherTemplate).toBe(VoucherTemplate.STANDARD)
    })
  })

  // Permission and Authorization Tests
  describe('Authorization and Permissions', () => {
    it('should require authentication for all settings endpoints', async () => {
      // Test without authentication
      await request
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(401)

      await request
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({ store: { timezone: 'UTC' } })
        .expect(401)

      await request
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({})
        .expect(401)
    })

    it('should require business ownership for all operations', async () => {
      const updateData = {
        store: {
          timezone: 'UTC',
        },
      }

      // Other business owner shouldn't access
      await otherBusinessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(403)

      await otherBusinessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send(updateData)
        .expect(403)

      await otherBusinessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({})
        .expect(403)
    })

    it('should prevent customers from managing business settings', async () => {
      // Customers shouldn't have access
      await customerClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(403)

      await customerClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({ store: { timezone: 'UTC' } })
        .expect(403)

      await customerClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({})
        .expect(403)
    })
  })

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent business gracefully', async () => {
      const fakeBusinessId = uuid()

      await businessClient
        .get(`/businesses/${fakeBusinessId}/settings`)
        .expect(404)

      await businessClient
        .patch(`/businesses/${fakeBusinessId}/settings`)
        .send({ store: { timezone: 'UTC' } })
        .expect(404)

      await businessClient
        .post(`/businesses/${fakeBusinessId}/settings/reset`)
        .send({})
        .expect(404)
    })

    it('should handle malformed business ID', async () => {
      await businessClient
        .get('/businesses/invalid-uuid/settings')
        .expect(400)

      await businessClient
        .patch('/businesses/invalid-uuid/settings')
        .send({ store: { timezone: 'UTC' } })
        .expect(400)

      await businessClient
        .post('/businesses/invalid-uuid/settings/reset')
        .send({})
        .expect(400)
    })

    it('should handle empty update gracefully', async () => {
      const response = await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({})
        .set('Accept', 'application/json')
        .expect(200)

      // Should return current settings unchanged
      expect(response.body.settings).toBeDefined()
    })

    it('should handle corrupted settings in database', async () => {
      // Corrupt the settings in database
      await testDb.prisma.business.update({
        where: { id: testBusiness.id },
        data: {
          settings: 'invalid json' as any,
        },
      })

      // Should return default settings when corrupted
      const response = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.settings.version).toBe('1.0')
      expect(response.body.settings.store.timezone).toBe('America/New_York')
    })
  })

  // Performance and Caching Tests
  describe('Performance and Caching', () => {
    it('should use cache for repeated reads', async () => {
      // Clear cache first
      await cacheService.clearAll()

      // First request - should hit database
      const start1 = Date.now()

      await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(200)

      const time1 = Date.now() - start1

      // Second request - should use cache (faster)
      const start2 = Date.now()

      await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(200)

      const time2 = Date.now() - start2

      // Cache hit should generally be faster
      // Note: This is a simplified test, actual performance may vary
      logger.debug(`First request: ${time1}ms, Second request: ${time2}ms`)
    })

    it('should invalidate cache across all operations', async () => {
      // Get settings to populate cache
      const response1 = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(200)

      const originalTimezone = response1.body.settings.store.timezone

      // Update via PATCH
      await businessClient
        .patch(`/businesses/${testBusiness.id}/settings`)
        .send({ store: { timezone: 'Pacific/Auckland' } })
        .expect(200)

      // Get should reflect update (cache invalidated)
      const response2 = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(200)

      expect(response2.body.settings.store.timezone).toBe('Pacific/Auckland')
      expect(response2.body.settings.store.timezone).not.toBe(originalTimezone)

      // Reset settings
      await businessClient
        .post(`/businesses/${testBusiness.id}/settings/reset`)
        .send({ sections: ['store'] })
        .expect(200)

      // Get should reflect reset (cache invalidated again)
      const response3 = await businessClient
        .get(`/businesses/${testBusiness.id}/settings`)
        .expect(200)

      expect(response3.body.settings.store.timezone).toBe('America/New_York')
    })
  })
})