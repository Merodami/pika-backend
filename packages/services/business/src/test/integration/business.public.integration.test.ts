/**
 * Business Service - Public API Integration Tests
 *
 * Tests for public-facing business endpoints that are accessible to all users.
 * These endpoints may or may not require authentication, but are not admin-only.
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
  seedTestBusinesses,
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
  UserServiceClientMock,
} from '@pika/tests'
import { ErrorCode } from '@pika/types'
import { UserRole, UserStatus } from '@prisma/client'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Business Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient
  let userServiceClientMock: UserServiceClientMock

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient
  let clientWithoutBusiness: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedBusinessTestData

  // Note: Using shared helper from businessTestHelpers.js

  beforeAll(async () => {
    logger.debug('Setting up Business Service integration tests...')

    // Initialize KeyManager for JWT operations
    if (!keyManager.isInitialized()) {
      await keyManager.initialize()
      logger.debug('KeyManager initialized for integration tests')
    }

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()
    userServiceClientMock = new UserServiceClientMock()

    // Setup the user service mock for successful operations
    userServiceClientMock.setupAuthSuccess()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
      userServiceClient: userServiceClientMock,
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

    // Create an additional business user without a business
    const userWithoutBusiness = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: 'business-without-business@test.com',
        firstName: 'Business',
        lastName: 'NoProfile',
        password:
          '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe', // hashed "password123"
        role: UserRole.business,
        status: UserStatus.active,
        emailVerified: true,
      },
    })

    const tokenWithoutBusiness = await authHelper.generateTestToken({
      userId: userWithoutBusiness.id,
      email: userWithoutBusiness.email,
      role: userWithoutBusiness.role,
    })

    clientWithoutBusiness = new AuthenticatedRequestClient(
      request,
      tokenWithoutBusiness,
    )

    logger.debug('E2E authentication setup complete')

    // Get the admin user for category creation
    const adminUser = await testDb.prisma.user.findUnique({
      where: { email: 'admin@e2etest.com' },
    })
    const adminUserId = adminUser?.id || uuid()

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedBusinessTestData(
      testDb.prisma,
      adminUserId,
    )

    logger.debug(
      `Created ${sharedTestData.allBusinesses.length} test businesses`,
    )
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clear translations between tests to avoid cross-test pollution
    translationClient.clear()

    // Reset and setup user service mock for each test
    userServiceClientMock.reset().setupAuthSuccess()

    // Clean up only business-related data to preserve E2E auth users and shared test data
    if (testDb?.prisma) {
      if (sharedTestData) {
        // If we have shared test data, preserve it
        // 1. First delete any businessDetails that don't belong to shared test data
        await testDb.prisma.businessDetails.deleteMany({
          where: {
            businessId: {
              notIn: sharedTestData.allBusinesses.map((b) => b.id),
            },
          },
        })

        // 2. Then delete ALL businesses except shared ones
        await testDb.prisma.business.deleteMany({
          where: {
            id: {
              notIn: sharedTestData.allBusinesses.map((b) => b.id),
            },
          },
        })

        // 3. Then delete ALL categories except the two shared ones
        await testDb.prisma.category.deleteMany({
          where: {
            id: {
              notIn: [
                sharedTestData.activeCategory.id,
                sharedTestData.inactiveCategory.id,
              ],
            },
          },
        })

        // 3. Finally delete test users created during tests (but preserve clientWithoutBusiness user)
        await testDb.prisma.user.deleteMany({
          where: {
            AND: [
              {
                email: {
                  notIn: [
                    'admin@e2etest.com',
                    'user@e2etest.com',
                    'member@e2etest.com',
                    'professional@e2etest.com',
                    'business@e2etest.com',
                    'business-without-business@test.com', // Preserve this user
                  ],
                },
              },
              {
                id: {
                  notIn: sharedTestData.businessOwners.map((o) => o.id),
                },
              },
            ],
          },
        })
      } else {
        // If shared test data failed to create, just clean everything except E2E users
        await testDb.prisma.business.deleteMany({})
        await testDb.prisma.category.deleteMany({})
        await testDb.prisma.user.deleteMany({
          where: {
            email: {
              notIn: [
                'admin@e2etest.com',
                'user@e2etest.com',
                'member@e2etest.com',
                'professional@e2etest.com',
                'business@e2etest.com',
              ],
            },
          },
        })
      }
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Public Browse Tests (No Auth Required)
  describe('GET /businesses', () => {
    it('should return all active businesses with pagination', async () => {
      // Use shared test data which already has businesses
      // sharedTestData has 6 active businesses:
      // - 3 active verified businesses in active category
      // - 2 active unverified businesses in active category
      // - 1 active business in inactive category (should be filtered out by category)
      // The business in inactive category should not appear in public results

      // Test with customer authentication as required
      const response = await customerClient
        .get('/businesses')
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(6) // All 6 active businesses (including inactive category one)
      expect(response.body.pagination.total).toBe(6)
    })

    it('should filter businesses by category_id', async () => {
      // Use the active category from shared test data
      const categoryId = sharedTestData.activeCategory.id

      const response = await customerClient
        .get('/businesses')
        .query({ categoryId: categoryId })
        .set('Accept', 'application/json')
        .expect(200)

      // 5 active businesses are in the active category (6 total - 1 in inactive category)
      expect(response.body.data).toHaveLength(5)
      expect(
        response.body.data.every((b: any) => b.categoryId === categoryId),
      ).toBe(true)
    })

    it('should filter businesses by verified status', async () => {
      // Use shared test data - has 4 verified and 2 unverified active businesses
      // (3 in active category + 1 in inactive category)
      const response = await customerClient
        .get('/businesses')
        .query({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      // Should return 4 verified active businesses
      expect(response.body.data).toHaveLength(4)
      expect(response.body.data.every((b: any) => b.verified === true)).toBe(
        true,
      )
    })

    it('should only show active businesses to public', async () => {
      // Shared test data has 6 active and 2 inactive businesses
      const response = await customerClient
        .get('/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      // Should only return the 6 active businesses
      expect(response.body.data).toHaveLength(6)
      expect(response.body.data.every((b: any) => b.active === true)).toBe(true)
    })

    it('should sort businesses by specified field', async () => {
      // Use shared test data which already has businesses
      const response = await customerClient
        .get('/businesses')
        .query({ sortBy: 'businessName', sortOrder: 'asc' })
        .set('Accept', 'application/json')
        .expect(200)

      const names = response.body.data.map((b: any) => b.businessName)
      const sortedNames = [...names].sort()

      expect(names).toEqual(sortedNames)
    })

    it('should paginate results correctly', async () => {
      // Shared test data has 6 active businesses
      const response = await customerClient
        .get('/businesses')
        .query({ page: 1, limit: 3 })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(3)
      expect(response.body.pagination.total).toBe(6) // Total active businesses
    })
  })

  describe('GET /businesses/:business_id', () => {
    it('should return a specific business by ID', async () => {
      // Use the first active business from shared test data
      const testBusiness = sharedTestData.activeBusinesses[0]

      // Test with customer authentication as required
      const response = await customerClient
        .get(`/businesses/${testBusiness.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testBusiness.id)
      expect(response.body.businessName).toBeTruthy()
      expect(response.body).toHaveProperty('approved')
      expect(typeof response.body.approved).toBe('boolean')
    })

    it('should include user data when requested', async () => {
      // Use an active business from shared test data
      const testBusiness = sharedTestData.activeBusinesses[0]

      const response = await customerClient
        .get(`/businesses/${testBusiness.id}`)
        .query({ include: 'user' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.user).toBeDefined()
    })

    it('should include businessDetails when requested', async () => {
      // Use an active business from shared test data
      const testBusiness = sharedTestData.activeBusinesses[0]

      // Create business details for testing
      await testDb.prisma.businessDetails.create({
        data: {
          businessId: testBusiness.id,
          phone: '+1234567890',
          email: 'contact@business.com',
          street: '123 Main St',
          city: 'Test City',
          state: 'Test State',
          postalCode: '12345',
          country: 'US',
        },
      })

      const response = await customerClient
        .get(`/businesses/${testBusiness.id}`)
        .query({ include: 'businessDetails' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.businessDetails).toBeDefined()
      expect(response.body.businessDetails.phone).toBe('+1234567890')
      expect(response.body.businessDetails.email).toBe('contact@business.com')
      expect(response.body.businessDetails.street).toBe('123 Main St')
    })

    it('should return 404 for non-existent business ID', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/businesses/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body.error.code).toBe(ErrorCode.NOT_FOUND)
    })

    it('should not show inactive businesses to public', async () => {
      // Create a user first
      const inactiveUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: 'inactive-business@test.com',
          firstName: 'Inactive',
          lastName: 'Business',
          password:
            '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe',
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })

      const business = await testDb.prisma.business.create({
        data: {
          userId: inactiveUser.id,
          businessNameKey: 'business.name.inactive',
          businessDescriptionKey: 'business.description.inactive',
          categoryId: sharedTestData.activeCategory.id,
          verified: true,
          active: false,
        },
      })

      await customerClient
        .get(`/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /businesses/user/:user_id', () => {
    it('should return business by user ID', async () => {
      // Use an active business from shared test data
      const business = sharedTestData.activeBusinesses[0]
      const userId = business.userId

      // Test with customer authentication as required
      const response = await customerClient
        .get(`/businesses/user/${userId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.userId).toBe(userId)
    })

    it('should return 404 for user without business', async () => {
      const userWithoutBusinessId = uuid()

      await customerClient
        .get(`/businesses/user/${userWithoutBusinessId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Authenticated User Endpoints (Business Role Required)
  describe('GET /businesses/me', () => {
    it('should return current user businesses as paginated list', async () => {
      // Create a business for the test business user
      const businessUser = await authHelper.testUsers.BUSINESS
      const businessUserFromDb = await testDb.prisma.user.findUnique({
        where: { email: businessUser.email },
      })

      const myBusiness = await testDb.prisma.business.create({
        data: {
          userId: businessUserFromDb!.id,
          businessNameKey: 'business.name.mytest',
          businessDescriptionKey: 'business.description.mytest',
          categoryId: sharedTestData.activeCategory.id,
          verified: true,
          active: true,
        },
      })

      const response = await businessClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(200)

      // Response is now paginated
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].id).toBe(myBusiness.id)
      expect(response.body.data[0].businessName).toBeTruthy()
      expect(response.body.data[0]).toHaveProperty('approved')
      expect(typeof response.body.data[0].approved).toBe('boolean')
      expect(response.body.data[0].approved).toBe(false) // Default to false for new businesses
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.total).toBeGreaterThan(0)
    })

    it('should require BUSINESS role for /me endpoint', async () => {
      // Customer shouldn't access business/me endpoint
      await customerClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should return empty list for business user without business', async () => {
      const response = await clientWithoutBusiness
        .get(`/businesses/me`)
        .set('Accept', 'application/json')
        .expect(200)

      // Should return empty paginated list
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data).toHaveLength(0)
      expect(response.body.pagination.total).toBe(0)
    })

    it('should return multiple businesses for user with multiple businesses', async () => {
      // Create multiple businesses for the same user
      const businessUser = await authHelper.testUsers.BUSINESS
      const businessUserFromDb = await testDb.prisma.user.findUnique({
        where: { email: businessUser.email },
      })

      // Create 3 businesses
      await Promise.all([
        testDb.prisma.business.create({
          data: {
            userId: businessUserFromDb!.id,
            businessNameKey: 'business.name.test1',
            categoryId: sharedTestData.activeCategory.id,
            active: true,
          },
        }),
        testDb.prisma.business.create({
          data: {
            userId: businessUserFromDb!.id,
            businessNameKey: 'business.name.test2',
            categoryId: sharedTestData.activeCategory.id,
            active: false, // One inactive
          },
        }),
        testDb.prisma.business.create({
          data: {
            userId: businessUserFromDb!.id,
            businessNameKey: 'business.name.test3',
            categoryId: sharedTestData.activeCategory.id,
            active: true,
          },
        }),
      ])

      // Get all businesses (should include active and inactive)
      const response = await businessClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data.length).toBeGreaterThanOrEqual(3)
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(3)

      // Test filtering by active status
      const activeResponse = await businessClient
        .get('/businesses/me?active=true')
        .set('Accept', 'application/json')
        .expect(200)

      expect(activeResponse.body.data.length).toBeGreaterThanOrEqual(2)
      expect(activeResponse.body.data.every((b: any) => b.active)).toBe(true)
    })
  })

  // Write API Tests (Business Role Required)
  describe('POST /businesses/me', () => {
    it('should create a new business for current user', async () => {
      const businessData = {
        businessName: 'New Test Business',
        businessDescription: 'New test business description',
        categoryId: sharedTestData.activeCategory.id,
      }

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(businessData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body.businessName).toBeTruthy()
      expect(response.body.businessName).toBe('New Test Business')
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = {
        businessDescription: 'Missing business name',
        // Missing required fields
      }

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(incompleteData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(response.body.error.validationErrors).toBeDefined()
    })

    it('should allow user to create multiple businesses', async () => {
      // Create the first business
      const firstBusinessData = {
        businessName: 'First Business',
        businessDescription: 'First business description',
        categoryId: sharedTestData.activeCategory.id,
      }

      const firstResponse = await clientWithoutBusiness
        .post('/businesses/me')
        .send(firstBusinessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Create a second business (should be allowed)
      const secondBusinessData = {
        businessName: 'Second Business',
        businessDescription: 'Second business description',
        categoryId: sharedTestData.activeCategory.id,
      }

      const secondResponse = await clientWithoutBusiness
        .post('/businesses/me')
        .send(secondBusinessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Both businesses should be created successfully
      expect(firstResponse.body.businessName).toBeTruthy()
      expect(secondResponse.body.businessName).toBeTruthy()
      expect(firstResponse.body.id).not.toBe(secondResponse.body.id)
    })

    it('should require BUSINESS role for POST', async () => {
      const businessData = {
        businessName: 'Customer Business',
        businessDescription: 'Customer business description',
        categoryId: sharedTestData.activeCategory.id,
      }

      // Customer shouldn't be able to create a business
      await customerClient
        .post('/businesses/me')
        .send(businessData)
        .set('Accept', 'application/json')
        .expect(403)
    })

    // Primary Business ID Tests
    it('should call updateUserPrimaryBusiness when creating first business', async () => {
      // Create a fresh user without any businesses for this test
      const freshUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: `fresh-business-${Date.now()}@test.com`,
          firstName: 'Fresh',
          lastName: 'User',
          password:
            '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe', // hashed "password123"
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })

      const freshToken = await authHelper.generateTestToken({
        userId: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
      })

      const freshClient = new AuthenticatedRequestClient(request, freshToken)

      const businessData = {
        businessName: 'Primary Business Test',
        businessDescription: 'Testing primary business logic',
        categoryId: sharedTestData.activeCategory.id,
      }

      // Reset mock to verify call
      userServiceClientMock.updateUserPrimaryBusiness.mockClear()

      const response = await freshClient
        .post('/businesses/me')
        .send(businessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Verify the updateUserPrimaryBusiness was called for first business
      expect(
        userServiceClientMock.updateUserPrimaryBusiness,
      ).toHaveBeenCalledTimes(1)
      expect(
        userServiceClientMock.updateUserPrimaryBusiness,
      ).toHaveBeenCalledWith({
        userId: freshUser.id,
        primaryBusinessId: response.body.id,
      })
    })

    it('should not call updateUserPrimaryBusiness for subsequent businesses', async () => {
      // Create a fresh user without any businesses for this test
      const freshUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: `multi-business-${Date.now()}@test.com`,
          firstName: 'Multi',
          lastName: 'Business',
          password:
            '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe', // hashed "password123"
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })

      const freshToken = await authHelper.generateTestToken({
        userId: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
      })

      const freshClient = new AuthenticatedRequestClient(request, freshToken)

      // First create a business
      const firstBusinessData = {
        businessName: 'First Business',
        businessDescription: 'First business',
        categoryId: sharedTestData.activeCategory.id,
      }

      await freshClient
        .post('/businesses/me')
        .send(firstBusinessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Reset mock after first business creation
      userServiceClientMock.updateUserPrimaryBusiness.mockClear()

      // Create second business
      const secondBusinessData = {
        businessName: 'Second Business',
        businessDescription: 'Second business',
        categoryId: sharedTestData.activeCategory.id,
      }

      await freshClient
        .post('/businesses/me')
        .send(secondBusinessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Verify updateUserPrimaryBusiness was NOT called for second business
      expect(
        userServiceClientMock.updateUserPrimaryBusiness,
      ).not.toHaveBeenCalled()
    })
  })

  describe('PUT /businesses/me', () => {
    it('should require active business claim in JWT for update', async () => {
      // Create a business for the test business user
      const businessUser = await authHelper.testUsers.BUSINESS
      const businessUserFromDb = await testDb.prisma.user.findUnique({
        where: { email: businessUser.email },
      })

      await testDb.prisma.business.create({
        data: {
          userId: businessUserFromDb!.id,
          businessNameKey: 'business.name.original',
          businessDescriptionKey: 'business.description.original',
          categoryId: sharedTestData.activeCategory.id,
          verified: false,
          active: true,
        },
      })

      const updateData = {
        businessName: 'Updated Business Name',
        businessDescription: 'Updated business description',
      }

      // Should get 403 because JWT doesn't have hasActiveBusinesses claim
      // This is correct behavior - the middleware requires the JWT to have proper claims
      await businessClient
        .put('/businesses/me')
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should require BUSINESS role for update', async () => {
      const updateData = {
        businessName: 'Hacker Business',
        businessDescription: 'Hacker business description',
      }

      // Customer shouldn't be able to update
      await customerClient
        .put('/businesses/me')
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        businessName: '', // Empty name
        businessDescription: 123, // Wrong type
        categoryId: 'not-a-uuid', // Invalid UUID
      }

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(invalidData)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe(ErrorCode.VALIDATION_ERROR)
    })

    it('should handle invalid UUIDs in path parameters', async () => {
      await customerClient
        .get('/businesses/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should require authentication for protected endpoints', async () => {
      // Test without authentication
      await request
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(401)

      await request
        .post('/businesses/me')
        .send({ businessNameKey: 'business.name.test' })
        .set('Accept', 'application/json')
        .expect(401)

      await request
        .put('/businesses/me')
        .send({ businessNameKey: 'business.name.test' })
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Business-specific features
  describe('Business-specific features', () => {
    it('should correctly handle average rating updates', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const response = await customerClient
        .get(`/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('avgRating')
      expect(typeof response.body.avgRating).toBe('number')
    })

    it('should return approved field for all businesses', async () => {
      // Create a business that is specifically approved
      const approvedUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: 'approved-business@test.com',
          firstName: 'Approved',
          lastName: 'Business',
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })

      const approvedBusiness = await testDb.prisma.business.create({
        data: {
          userId: approvedUser.id,
          businessNameKey: 'business.name.approved',
          categoryId: sharedTestData.activeCategory.id,
          verified: true,
          active: true,
          approved: true,
        },
      })

      // Test single business endpoint
      const singleResponse = await customerClient
        .get(`/businesses/${approvedBusiness.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(singleResponse.body).toHaveProperty('approved')
      expect(singleResponse.body.approved).toBe(true)

      // Test list endpoint
      const listResponse = await customerClient
        .get('/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      const foundBusiness = listResponse.body.data.find(
        (b: any) => b.id === approvedBusiness.id,
      )

      expect(foundBusiness).toBeDefined()
      expect(foundBusiness).toHaveProperty('approved')
      expect(foundBusiness.approved).toBe(true)
    })
  })
})
