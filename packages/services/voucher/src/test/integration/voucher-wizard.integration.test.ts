/**
 * Voucher Service - Wizard API Integration Tests
 *
 * Tests for voucher wizard endpoints that are used by business owners.
 * These endpoints handle the multi-step voucher creation flow.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')
vi.unmock('@pika/shared') // Unmock shared to use real error classes with real middleware
vi.unmock('@pika/crypto') // Unmock crypto for KeyManager

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
import { createCommunicationServiceClientMock } from '@pika/tests'
import { createTranslationResolver } from '@pika/translation'
import { createVoucherServer } from '@voucher/server.js'
import { createSharedVoucherTestData } from '@voucher/test/helpers/voucherTestHelpers.js'
import type { Express } from 'express'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Voucher Service - Wizard API Integration Tests', () => {
  // Increase timeout for database operations
  vi.setConfig({ testTimeout: 30000 })

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

  // Test business for voucher creation
  let testBusiness: any
  let testCategory: any

  // Track created drafts for cleanup
  let createdDraftIds: string[] = []

  beforeAll(async () => {
    logger.debug('Setting up Voucher Service Wizard API integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_voucher_wizard_db',
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

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

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

    // Create test category
    const categoryAdminId = uuid()

    await testDb.prisma.user.create({
      data: {
        id: categoryAdminId,
        email: `category-admin-${categoryAdminId.substring(0, 8)}@test.com`,
        firstName: 'Category',
        lastName: 'Admin',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    })

    testCategory = await testDb.prisma.category.create({
      data: {
        nameKey: `category.name.test.${uuid()}`,
        descriptionKey: `category.description.test.${uuid()}`,
        slug: `test-cat-${uuid().substring(0, 8)}`,
        level: 1,
        path: '/test',
        isActive: true,
        sortOrder: 1,
        createdBy: categoryAdminId,
      },
    })

    // Create test business
    const businessOwnerId = uuid()

    await testDb.prisma.user.create({
      data: {
        id: businessOwnerId,
        email: `business-owner-${businessOwnerId.substring(0, 8)}@test.com`,
        firstName: 'Business',
        lastName: 'Owner',
        role: 'business',
        status: 'active',
        emailVerified: true,
      },
    })

    testBusiness = await testDb.prisma.business.create({
      data: {
        id: uuid(),
        userId: businessOwnerId,
        businessNameKey: `business.name.test.${uuid()}`,
        businessDescriptionKey: `business.description.test.${uuid()}`,
        categoryId: null,
        verified: true,
        active: true,
        approved: true,
      },
    })

    // Create shared test data
    await createSharedVoucherTestData(testDb.prisma, {
      createdBy: categoryAdminId,
    })

    logger.debug('Test setup complete.')
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests to avoid cross-test pollution
    translationClient.clear()

    // Clear drafts table before each test
    await testDb.prisma.voucherDraft.deleteMany({})

    // Reset draft tracking
    createdDraftIds = []
  })

  afterEach(async () => {
    // Clean up any drafts created during tests
    if (createdDraftIds.length > 0) {
      try {
        await testDb.prisma.voucherDraft.deleteMany({
          where: {
            draftId: {
              in: createdDraftIds,
            },
          },
        })
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  describe('POST /vouchers/wizard/drafts - Initialize Draft', () => {
    it('should initialize a new draft for business user', async () => {
      const response = await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        draftId: expect.stringMatching(/^draft-/),
        sessionToken: expect.any(String),
        currentStep: 1,
        expiresAt: expect.any(String),
      })

      // Verify draft was created in database
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId: response.body.draftId },
      })

      expect(draft).toBeTruthy()
      expect(draft?.businessId).toBe(testBusiness.id)
    })

    it('should initialize a new draft for admin user', async () => {
      const response = await adminClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      expect(response.status).toBe(201)
      expect(response.body).toMatchObject({
        draftId: expect.stringMatching(/^draft-/),
        sessionToken: expect.any(String),
        currentStep: 1,
        expiresAt: expect.any(String),
      })

      // Verify draft was created in database
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId: response.body.draftId },
      })

      expect(draft).toBeTruthy()
      expect(draft?.businessId).toBe(testBusiness.id)
    })

    it('should fail for customer users', async () => {
      const response = await customerClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      expect(response.status).toBe(403)
    })

    it('should fail for invalid business ID', async () => {
      const response = await businessClient.post('/vouchers/wizard/drafts', {
        businessId: uuid(),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /vouchers/wizard/drafts - Get User Drafts', () => {
    it('should return user drafts for business owner', async () => {
      // Create a draft first
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )

      expect(createResponse.status).toBe(201)

      // Get drafts
      const response = await businessClient.get('/vouchers/wizard/drafts')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0]).toMatchObject({
        draftId: createResponse.body.draftId,
        businessId: testBusiness.id,
        currentStep: 1,
        completedSteps: [],
        isComplete: false,
      })
    })

    it('should filter drafts by businessId', async () => {
      // Create two drafts
      await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      const response = await businessClient.get(
        `/vouchers/wizard/drafts?businessId=${testBusiness.id}`,
      )

      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThan(0)
      response.body.data.forEach((draft: any) => {
        expect(draft.businessId).toBe(testBusiness.id)
      })
    })

    it('should allow admin to get all drafts with pagination', async () => {
      // Create multiple drafts with business client
      await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })
      await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      // Admin should get paginated results
      const response = await adminClient.get(
        '/vouchers/wizard/drafts?page=1&limit=10',
      )

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      })
    })

    it('should return user drafts with pagination for business users', async () => {
      // Create a draft with business client
      await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      // Business user should get paginated response
      const response = await businessClient.get('/vouchers/wizard/drafts')

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: expect.any(Number),
        total: 1,
      })
    })
  })

  describe('PUT /vouchers/wizard/drafts/:draftId/steps/:stepNumber - Update Step', () => {
    let draftId: string

    beforeEach(async () => {
      const response = await businessClient.post('/vouchers/wizard/drafts', {
        businessId: testBusiness.id,
      })

      draftId = response.body.draftId
    })

    it('should update step 1 data', async () => {
      const step1Data = {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      }

      const response = await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/1`,
        step1Data, // Send data directly, not wrapped
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        success: true,
        currentStep: 1,
        nextStep: 2,
        completedSteps: [1],
      })

      // Verify step data was saved
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId },
      })

      expect(draft?.step1Data).toEqual(step1Data)
    })

    it('should update step 2 data and store translations', async () => {
      // Spy on translation client set method
      const setSpy = vi.spyOn(translationClient, 'set')

      // First complete step 1
      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/1`, {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      })

      const step2Data = {
        title: {
          es: 'Título del Cupón',
          en: 'Voucher Title',
        },
        description: {
          es: 'Descripción del cupón',
          en: 'Voucher description',
        },
        termsAndConditions: {
          es: 'Términos y condiciones',
          en: 'Terms and conditions',
        },
      }

      const response = await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/2`,
        step2Data, // Send data directly
      )

      expect(response.status).toBe(200)
      expect(response.body.completedSteps).toContain(2)

      // Verify translations were stored
      expect(setSpy).toHaveBeenCalled()
    })

    it('should update step 3 data', async () => {
      const step3Data = {
        discountType: 'percentage',
        discountValue: 20,
        currency: 'PYG',
      }

      const response = await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/3`,
        step3Data, // Send data directly
      )

      expect(response.status).toBe(200)
      expect(response.body.completedSteps).toContain(3)
    })

    it('should update step 4 data', async () => {
      const step4Data = {
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        maxRedemptions: 100,
        maxRedemptionsPerUser: 1,
      }

      const response = await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/4`,
        step4Data, // Send data directly
      )

      expect(response.status).toBe(200)
      expect(response.body.completedSteps).toContain(4)
    })

    it('should mark draft as complete when all required steps are done', async () => {
      // Complete all required steps
      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/1`, {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      })

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/2`, {
        title: { es: 'Test' },
        description: { es: 'Test' },
        termsAndConditions: { es: 'Test' },
      })

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/3`, {
        discountType: 'percentage',
        discountValue: 20,
        currency: 'PYG',
      })

      const response = await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/4`,
        {
          validFrom: new Date().toISOString(),
          validUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          maxRedemptions: 100,
          maxRedemptionsPerUser: 1,
        },
      )

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.completedSteps).toEqual([1, 2, 3, 4])
    })
  })

  describe('GET /vouchers/wizard/drafts/:draftId - Get Draft by ID', () => {
    it('should allow owner to get their draft', async () => {
      // Create a draft
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Owner should be able to get it
      const response = await businessClient.get(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(response.status).toBe(200)
      expect(response.body.draftId).toBe(draftId)
    })

    it('should allow admin to get any draft', async () => {
      // Create a draft with business client
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Admin should be able to get it
      const response = await adminClient.get(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(response.status).toBe(200)
      expect(response.body.draftId).toBe(draftId)
    })

    it('should prevent non-owner from getting draft', async () => {
      // Create a draft with business client
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Customer should not be able to get it
      const response = await customerClient.get(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(response.status).toBe(403)
    })
  })

  describe('POST /vouchers/wizard/drafts/:draftId/complete - Complete Draft', () => {
    let draftId: string

    beforeEach(async () => {
      // Create and complete a draft
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )

      draftId = createResponse.body.draftId

      // Complete all required steps
      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/1`, {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      })

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/2`, {
        title: { es: 'Cupón de Prueba' },
        description: { es: 'Descripción de prueba' },
        termsAndConditions: { es: 'Términos de prueba' },
      })

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/3`, {
        discountType: 'percentage',
        discountValue: 25,
        currency: 'PYG',
      })

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/4`, {
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        maxRedemptions: 50,
        maxRedemptionsPerUser: 1,
      })
    })

    it('should create voucher from completed draft', async () => {
      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${draftId}/complete`,
        {
          publishImmediately: false,
        },
      )

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.voucher).toBeTruthy()
      expect(response.body.voucher.state).toBe('draft')
      expect(response.body.publishStatus).toBe('draft')

      // Verify draft was marked as complete
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId },
      })

      expect(draft?.completedAt).toBeTruthy()
      expect(draft?.voucherId).toBe(response.body.voucherId)
    })

    it('should create and publish voucher immediately', async () => {
      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${draftId}/complete`,
        {
          publishImmediately: true,
        },
      )

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.voucher.state).toBe('published')
      expect(response.body.publishStatus).toBe('published')
    })

    it('should allow admin to complete any draft', async () => {
      // Create a draft with business client and complete steps
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const adminDraftId = createResponse.body.draftId

      // Complete all required steps
      await businessClient.put(
        `/vouchers/wizard/drafts/${adminDraftId}/steps/1`,
        {
          businessId: testBusiness.id,
          categoryId: testCategory.id,
        },
      )

      await businessClient.put(
        `/vouchers/wizard/drafts/${adminDraftId}/steps/2`,
        {
          title: { es: 'Admin Test Voucher' },
          description: { es: 'Admin test description' },
          termsAndConditions: { es: 'Admin test terms' },
        },
      )

      await businessClient.put(
        `/vouchers/wizard/drafts/${adminDraftId}/steps/3`,
        {
          discountType: 'percentage',
          discountValue: 30,
          currency: 'PYG',
        },
      )

      await businessClient.put(
        `/vouchers/wizard/drafts/${adminDraftId}/steps/4`,
        {
          validFrom: new Date().toISOString(),
          validUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          maxRedemptions: 100,
          maxRedemptionsPerUser: 1,
        },
      )

      // Admin should be able to complete it
      const response = await adminClient.post(
        `/vouchers/wizard/drafts/${adminDraftId}/complete`,
        {
          publishImmediately: false,
        },
      )

      expect(response.status).toBe(201)
      expect(response.body.voucher).toBeTruthy()
    })

    it('should fail if draft is not complete', async () => {
      // Create incomplete draft
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const incompleteDraftId = createResponse.body.draftId

      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${incompleteDraftId}/complete`,
        {
          publishImmediately: false,
        },
      )

      expect(response.status).toBe(422)
      // Response should indicate draft is not complete
      if (response.body.message) {
        expect(response.body.message).toMatch(/not complete|incomplete/i)
      }
    })
  })

  describe('DELETE /vouchers/wizard/drafts/:draftId - Delete Draft', () => {
    it('should delete a draft for the owner', async () => {
      // Create a draft
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Delete the draft
      const deleteResponse = await businessClient.delete(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(deleteResponse.status).toBe(204)

      // Verify draft was deleted
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId },
      })

      expect(draft).toBeNull()
    })

    it('should allow admin to delete any draft', async () => {
      // Create a draft with business client
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Admin should be able to delete it (has vouchers:write permission)
      const deleteResponse = await adminClient.delete(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(deleteResponse.status).toBe(204)

      // Verify draft was deleted
      const draft = await testDb.prisma.voucherDraft.findUnique({
        where: { draftId },
      })

      expect(draft).toBeNull()
    })

    it('should prevent non-owner from deleting draft', async () => {
      // Create a draft with business client
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Customer user should not be able to delete business user's draft
      const deleteResponse = await customerClient.delete(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      // Should fail with 403 (forbidden) since customer lacks permission
      expect(deleteResponse.status).toBe(403)
    })

    it('should fail for customer users', async () => {
      // Create a draft with business client
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Customer should not be able to delete it
      const deleteResponse = await customerClient.delete(
        `/vouchers/wizard/drafts/${draftId}`,
      )

      expect(deleteResponse.status).toBe(403)
    })
  })

  describe('POST /vouchers/wizard/drafts/:draftId/resume - Resume Draft', () => {
    it('should resume a draft and return next step', async () => {
      // Create a draft and complete step 1
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/1`, {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      })

      // Resume the draft
      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${draftId}/resume`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        draftId,
        currentStep: 1,
        nextStep: 2, // Should suggest step 2 since step 1 is complete
        completedSteps: [1],
        isComplete: false,
      })
    })
  })

  describe('GET /vouchers/wizard/drafts/:draftId/steps/:stepNumber - Get Step', () => {
    it('should retrieve step data', async () => {
      // Create a draft and add step data
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      const stepData = {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      }

      await businessClient.put(
        `/vouchers/wizard/drafts/${draftId}/steps/1`,
        stepData,
      )

      // Get step data
      const response = await businessClient.get(
        `/vouchers/wizard/drafts/${draftId}/steps/1`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        stepNumber: 1,
        data: stepData,
      })
    })
  })

  describe('POST /vouchers/wizard/drafts/:draftId/steps/:stepNumber/validate - Validate Step', () => {
    it('should validate completed step', async () => {
      // Create a draft and complete step 1
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      await businessClient.put(`/vouchers/wizard/drafts/${draftId}/steps/1`, {
        businessId: testBusiness.id,
        categoryId: testCategory.id,
      })

      // Validate step
      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${draftId}/steps/1/validate`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        stepNumber: 1,
        valid: true,
      })
    })

    it('should return false for incomplete step', async () => {
      // Create a draft without completing any steps
      const createResponse = await businessClient.post(
        '/vouchers/wizard/drafts',
        {
          businessId: testBusiness.id,
        },
      )
      const draftId = createResponse.body.draftId

      // Validate step that hasn't been completed
      const response = await businessClient.post(
        `/vouchers/wizard/drafts/${draftId}/steps/2/validate`,
      )

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        stepNumber: 2,
        valid: false,
      })
    })
  })

  afterAll(async () => {
    logger.debug('Cleaning up Voucher Service Wizard API integration tests...')
    await cleanupTestDatabase(testDb)
  })
})
