/**
 * Business Service - Registration Flow Integration Tests
 *
 * Tests for the multi-step business registration flow.
 * These endpoints require authentication and business permissions.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared')

import { createBusinessServer } from '@business/server.js'
import { businessPublic } from '@pika/api'
import { keyManager } from '@pika/crypto'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { MockCacheService } from '@pika/tests'
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
  BusinessRegistrationStatus,
  BusinessType,
  ErrorCode,
  UserRole,
  UserStatus,
} from '@pika/types'
import { UserServiceClientMock } from '@tests/mocks/services'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Business Service - Registration Flow Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient
  let userServiceClient: UserServiceClientMock

  // Authenticated clients for different user types
  let businessOwnerClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

  // Test data
  let testCategoryId: string
  let testUserId: string

  beforeAll(async () => {
    logger.debug('Setting up Business Registration integration tests...')

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_registration_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server - use MockCacheService like other tests
    cacheService = new MockCacheService() as any
    translationClient = createMockTranslationClient()
    userServiceClient = new UserServiceClientMock()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
      userServiceClient: userServiceClient as any,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated client for customer (to test permission denial)
    customerClient = await authHelper.getUserClient(testDb.prisma)

    // Create a business owner user without a business (eligible for registration)
    const businessOwnerUser = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: 'business-owner-new@test.com',
        firstName: 'New',
        lastName: 'BusinessOwner',
        role: 'business', // Prisma enum value (lowercase)
        status: 'active', // Prisma enum value (lowercase)
        emailVerified: true,
      },
    })

    testUserId = businessOwnerUser.id

    // Update the mock to return the correct user with proper structure
    userServiceClient.getUser.mockResolvedValue({
      ...businessOwnerUser,
      role: UserRole.BUSINESS, // Domain enum value (uppercase)
      status: UserStatus.ACTIVE, // Domain enum value (uppercase)
      isActive: () => businessOwnerUser.status === 'active',
    })

    const businessOwnerToken = await authHelper.generateTestToken({
      userId: businessOwnerUser.id,
      email: businessOwnerUser.email,
      role: businessOwnerUser.role,
    })

    businessOwnerClient = new AuthenticatedRequestClient(
      request,
      businessOwnerToken,
    )

    // Create a test category for business registration
    const category = await testDb.prisma.category.create({
      data: {
        id: uuid(),
        nameKey: 'test-category',
        slug: 'test-category',
        sortOrder: 1,
        isActive: true,
        createdBy: businessOwnerUser.id,
      },
    })

    testCategoryId = category.id

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests
    translationClient.clear()

    // Clean up business registration data between tests
    if (testDb?.prisma) {
      await testDb.prisma.businessRegistration.deleteMany({})
      await testDb.prisma.business.deleteMany({})
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  describe('GET /businesses/registration/status', () => {
    it('should return initial registration status for new user', async () => {
      const response = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('needsRegistration')
      expect(response.body).toHaveProperty('canAccessDashboard')
      expect(response.body).toHaveProperty('currentStep')
      expect(response.body).toHaveProperty('registrationStatus')

      expect(response.body.needsRegistration).toBe(true)
      expect(response.body.canAccessDashboard).toBe(false)
      expect(response.body.currentStep).toBe(0)
      expect(response.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
    })

    it('should deny access to customers', async () => {
      const response = await customerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('notAuthorized')
    })

    it('should return cached status on second request', async () => {
      console.log('Starting cache test...')

      // First request
      console.log('Making first request...')

      const response1 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      console.log('First request completed:', response1.status)
      expect(response1.status).toBe(200)

      // Second request should be cached
      console.log('Making second request...')

      const response2 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      console.log('Second request completed:', response2.status)
      expect(response2.status).toBe(200)
      expect(response2.body).toEqual(response1.body)
    })
  })

  describe('POST /businesses/registration/step1', () => {
    it('should successfully submit step 1 data', async () => {
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.error(
          'Step1 Error response:',
          JSON.stringify(response.body, null, 2),
        )
      }
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('userId')
      expect(response.body).toHaveProperty('currentStep')
      expect(response.body).toHaveProperty('step1Data')

      expect(response.body.userId).toBe(testUserId)
      expect(response.body.currentStep).toBe(2)
      expect(response.body.step1Data).toMatchObject(step1Data)
      expect(response.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
    })

    it('should validate required fields', async () => {
      const invalidData = {
        businessName: '', // Invalid: empty string
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(invalidData)
        .set('Accept', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
    })

    it('should deny access to customers', async () => {
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      const response = await customerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('notAuthorized')
    })

    it('should allow updating step 1 data', async () => {
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      // First submission
      const response1 = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')

      expect(response1.status).toBe(200)

      // Second submission with updated data should succeed (update, not conflict)
      const updatedData = {
        ...step1Data,
        businessName: 'Updated Business Name',
      }

      const response2 = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(updatedData)
        .set('Accept', 'application/json')

      expect(response2.status).toBe(200)
      expect(response2.body.step1Data.businessName).toBe(
        'Updated Business Name',
      )
    })
  })

  describe('POST /businesses/registration/step2', () => {
    beforeEach(async () => {
      // Complete step 1 first
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')
    })

    it('should successfully submit step 2 data', async () => {
      const step2Data: businessPublic.BusinessRegistrationStep2Request = {
        description: 'This is a test business description',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        phone: '+1234567890',
        website: 'https://testbusiness.com',
        email: 'contact@testbusiness.com',
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(step2Data)
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body.currentStep).toBe(3)
      expect(response.body.step2Data).toMatchObject(step2Data)
      expect(response.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
    })

    it('should validate address format', async () => {
      const invalidData = {
        description: 'This is a test business description',
        address: {
          street: '', // Invalid: empty street
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        phone: '+1234567890',
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(invalidData)
        .set('Accept', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
    })
  })

  describe('POST /businesses/registration/step3', () => {
    beforeEach(async () => {
      // Complete step 1
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')

      // Complete step 2
      const step2Data: businessPublic.BusinessRegistrationStep2Request = {
        description: 'This is a test business description',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        phone: '+1234567890',
        website: 'https://testbusiness.com',
        email: 'contact@testbusiness.com',
      }

      await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(step2Data)
        .set('Accept', 'application/json')
    })

    it('should successfully complete registration with step 3', async () => {
      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { closed: true },
        },
        socialMedia: {
          facebook: 'https://facebook.com/testbusiness',
          instagram: '@testbusiness',
          twitter: '@testbusiness',
        },
        additionalInfo: {
          yearsInBusiness: 5,
          numberOfEmployees: 10,
          certifications: ['ISO 9001', 'ISO 14001'],
        },
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.error(
          'Step3 completion error:',
          JSON.stringify(response.body, null, 2),
        )
      }
      expect(response.status).toBe(200)
      expect(response.body.currentStep).toBe(3)
      expect(response.body.step3Data).toMatchObject(step3Data)
      expect(response.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
      expect(response.body.businessId).toBeUndefined() // No business created until completion
    })

    it('should create a business entity after successful registration', async () => {
      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
        },
      }

      const step3Response = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')

      expect(step3Response.status).toBe(200)

      // Complete the registration to create the business
      const completeData: businessPublic.CompleteBusinessRegistrationRequest = {
        confirmAllDataAccurate: true,
        agreedToTerms: true,
      }

      const completeResponse = await businessOwnerClient
        .post('/businesses/registration/complete')
        .send(completeData)
        .set('Accept', 'application/json')

      expect(completeResponse.status).toBe(200)
      expect(completeResponse.body.businessId).toBeDefined()

      // Verify business was created
      const business = await testDb.prisma.business.findUnique({
        where: { id: completeResponse.body.businessId },
      })

      expect(business).toBeDefined()
      expect(business?.userId).toBe(testUserId)
      expect(business?.businessNameKey).toBe('Test Business')
      expect(business?.active).toBe(false) // Should start as inactive pending admin approval
      expect(business?.verified).toBe(false) // Should start as unverified
    })

    it('should allow editing registration data after completing step 3', async () => {
      // Complete step 3
      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
        },
      }

      const response1 = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')

      expect(response1.status).toBe(200)

      // Should be able to go back and edit step 1 data before completing registration
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Updated Business Name After Step 3',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      const response2 = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')

      expect(response2.status).toBe(200)
      expect(response2.body.step1Data.businessName).toBe(
        'Updated Business Name After Step 3',
      )
      expect(response2.body.currentStep).toBe(3) // Should maintain progress at step 3
    })
  })

  describe('Registration Flow - Complete Journey', () => {
    it('should complete full registration flow successfully', async () => {
      // Check initial status
      const statusResponse1 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(statusResponse1.body.currentStep).toBe(0)

      // Submit step 1
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Complete Business',
        businessType: BusinessType.RETAIL,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')
        .expect(200)

      // Check status after step 1
      const statusResponse2 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(statusResponse2.body.currentStep).toBe(2)
      expect(statusResponse2.body.needsRegistration).toBe(true)

      // Submit step 2
      const step2Data: businessPublic.BusinessRegistrationStep2Request = {
        description: 'Complete business description',
        address: {
          street: '456 Complete Street',
          city: 'Complete City',
          state: 'CC',
          postalCode: '54321',
          country: 'US',
        },
        phone: '+9876543210',
      }

      await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(step2Data)
        .set('Accept', 'application/json')
        .expect(200)

      // Check status after step 2
      const statusResponse3 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(statusResponse3.body.currentStep).toBe(3)
      expect(statusResponse3.body.needsRegistration).toBe(true)

      // Submit step 3
      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
        },
      }

      const step3Response = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')
        .expect(200)

      // Step 3 should save data but NOT auto-complete registration
      expect(step3Response.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
      expect(step3Response.body.businessId).toBeUndefined()

      // Now explicitly complete the registration
      const completeData: businessPublic.CompleteBusinessRegistrationRequest = {
        confirmAllDataAccurate: true,
        agreedToTerms: true,
      }

      const completeResponse = await businessOwnerClient
        .post('/businesses/registration/complete')
        .send(completeData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(completeResponse.body.businessId).toBeDefined()
      expect(completeResponse.body.registrationStatus).toBe('submitted')
      expect(completeResponse.body.message).toContain('submitted successfully')

      // Check final status
      const statusResponse4 = await businessOwnerClient
        .get('/businesses/registration/status')
        .set('Accept', 'application/json')

      expect(statusResponse4.body.currentStep).toBe(3)
      expect(statusResponse4.body.registrationStatus).toBe(
        BusinessRegistrationStatus.SUBMITTED,
      )
      expect(statusResponse4.body.needsRegistration).toBe(false) // False when submitted (waiting for approval)
      expect(statusResponse4.body.businessId).toBeDefined()
    })
  })

  describe('New Endpoints', () => {
    it('should start registration with POST /start', async () => {
      // Ensure no registration exists
      await testDb.prisma.businessRegistration.deleteMany({
        where: { userId: testUserId },
      })

      const response = await businessOwnerClient
        .post('/businesses/registration/start')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.started).toBe(true)
      expect(response.body.currentStep).toBe(1)
    })

    it('should return progress with GET /progress', async () => {
      // Complete step 1 first
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Progress Test Business',
        businessType: BusinessType.SERVICE,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .expect(200)

      // Check progress
      const progressResponse = await businessOwnerClient
        .get('/businesses/registration/progress')
        .set('Accept', 'application/json')
        .expect(200)

      expect(progressResponse.body.currentStep).toBe(2)
      expect(progressResponse.body.stepsCompleted).toContain(1)
      expect(progressResponse.body.step1Data).toEqual(step1Data)
      expect(progressResponse.body.registrationStatus).toBe(
        BusinessRegistrationStatus.IN_PROGRESS,
      )
    })
  })

  describe('Edge Cases - Step Validation', () => {
    it('should not allow step 2 without completing step 1', async () => {
      // Ensure no registration exists
      await testDb.prisma.businessRegistration.deleteMany({
        where: { userId: testUserId },
      })

      const step2Data: businessPublic.BusinessRegistrationStep2Request = {
        description: 'This is a test business description',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        phone: '+1234567890',
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(step2Data)
        .set('Accept', 'application/json')

      if (response.status !== 400) {
        console.error(
          'Step2 validation error:',
          JSON.stringify(response.body, null, 2),
        )
      }
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
    })

    it('should not allow step 3 without completing steps 1 and 2', async () => {
      // Ensure no registration exists
      await testDb.prisma.businessRegistration.deleteMany({
        where: { userId: testUserId },
      })

      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '09:00', close: '17:00' },
          tuesday: { open: '09:00', close: '17:00' },
          wednesday: { open: '09:00', close: '17:00' },
          thursday: { open: '09:00', close: '17:00' },
          friday: { open: '09:00', close: '17:00' },
          saturday: { closed: true },
          sunday: { closed: true },
        },
        servicesOffered: ['Service 1', 'Service 2'],
        acceptsPaymentMethods: ['cash', 'credit_card'],
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')

      if (response.status !== 400) {
        console.error(
          'Step3 validation error:',
          JSON.stringify(response.body, null, 2),
        )
      }
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
    })
  })

  describe('Step Updates - Editing Previous Steps', () => {
    it('should allow users to go back and edit completed steps', async () => {
      // Setup initial registration
      const registrationResponse = await businessOwnerClient
        .post('/businesses/registration/start')
        .set('Accept', 'application/json')
        .expect(200)

      expect(registrationResponse.body.started).toBe(true)

      // Complete step 1
      const step1Data: businessPublic.BusinessRegistrationStep1Request = {
        businessName: 'Original Business Name',
        businessType: BusinessType.RESTAURANT,
        categoryId: testCategoryId,
        primaryLanguage: 'en',
      }

      const step1Response = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(step1Data)
        .set('Accept', 'application/json')
        .expect(200)

      expect(step1Response.body.currentStep).toBe(2) // Advanced to step 2
      expect(step1Response.body.step1Data.businessName).toBe(
        'Original Business Name',
      )

      // Complete step 2
      const step2Data: businessPublic.BusinessRegistrationStep2Request = {
        description: 'Original description',
        address: {
          street: '123 Original Street',
          city: 'Original City',
          state: 'OR',
          postalCode: '12345',
          country: 'US',
        },
        phone: '+1234567890',
      }

      const step2Response = await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(step2Data)
        .set('Accept', 'application/json')
        .expect(200)

      expect(step2Response.body.currentStep).toBe(3) // Advanced to step 3
      expect(step2Response.body.step2Data.description).toBe(
        'Original description',
      )

      // Now go back and edit step 1 - this should work now!
      const updatedStep1Data: businessPublic.BusinessRegistrationStep1Request =
        {
          businessName: 'Updated Business Name',
          businessType: BusinessType.SERVICE, // Changed type
          categoryId: testCategoryId,
          primaryLanguage: 'es', // Changed language
        }

      const updatedStep1Response = await businessOwnerClient
        .post('/businesses/registration/step1')
        .send(updatedStep1Data)
        .set('Accept', 'application/json')
        .expect(200)

      // Should still be on step 3 (don't go backwards)
      expect(updatedStep1Response.body.currentStep).toBe(3)
      // But step 1 data should be updated
      expect(updatedStep1Response.body.step1Data.businessName).toBe(
        'Updated Business Name',
      )
      expect(updatedStep1Response.body.step1Data.businessType).toBe(
        BusinessType.SERVICE,
      )
      expect(updatedStep1Response.body.step1Data.primaryLanguage).toBe('es')
      // Step 2 data should remain unchanged
      expect(updatedStep1Response.body.step2Data.description).toBe(
        'Original description',
      )

      // Also test editing step 2
      const updatedStep2Data: businessPublic.BusinessRegistrationStep2Request =
        {
          description: 'Updated description',
          address: {
            street: '456 Updated Avenue',
            city: 'Updated City',
            state: 'UP',
            postalCode: '67890',
            country: 'US',
          },
          phone: '+9876543210',
          email: 'updated@example.com',
        }

      const updatedStep2Response = await businessOwnerClient
        .post('/businesses/registration/step2')
        .send(updatedStep2Data)
        .set('Accept', 'application/json')
        .expect(200)

      // Should still be on step 3
      expect(updatedStep2Response.body.currentStep).toBe(3)
      // Step 2 data should be updated
      expect(updatedStep2Response.body.step2Data.description).toBe(
        'Updated description',
      )
      expect(updatedStep2Response.body.step2Data.address.street).toBe(
        '456 Updated Avenue',
      )
      expect(updatedStep2Response.body.step2Data.email).toBe(
        'updated@example.com',
      )
      // Step 1 data should still show the updates
      expect(updatedStep2Response.body.step1Data.businessName).toBe(
        'Updated Business Name',
      )
    })

    it('should not allow users to skip to future steps', async () => {
      // Setup fresh registration
      await businessOwnerClient
        .post('/businesses/registration/start')
        .set('Accept', 'application/json')
        .expect(200)

      // Try to skip directly to step 3 without completing steps 1 and 2
      const step3Data: businessPublic.BusinessRegistrationStep3Request = {
        operatingHours: {
          monday: { open: '09:00', close: '17:00' },
        },
      }

      const response = await businessOwnerClient
        .post('/businesses/registration/step3')
        .send(step3Data)
        .set('Accept', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(response.body.error.message).toContain('Cannot skip steps')
    })
  })
})
