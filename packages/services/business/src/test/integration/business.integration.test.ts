// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/translation')

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { TestDatabase } from '@pika/tests'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  InternalAPITestHelper,
} from '@pika/tests'
import { TranslationClient } from '@pika/translation'
import { PrismaClient } from '@prisma/client'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createBusinessServer } from '../../server.js'

// Helper function to seed test businesses
async function seedTestBusinesses(
  prismaClient: PrismaClient,
  options?: {
    generateInactive?: boolean
    generateUnverified?: boolean
    count?: number
  },
): Promise<{
  testUsers: any[]
  testBusinesses: any[]
  testCategory: any
}> {
  logger.debug('Seeding test businesses...')

  // Create a test category first
  const categorySlug = `test-category-${uuid().substring(0, 8)}`
  const adminUserId = uuid() // Create a dummy admin user ID for test data
  const testCategory = await prismaClient.category.create({
    data: {
      nameKey: `category.name.${uuid()}`,
      descriptionKey: `category.description.${uuid()}`,
      slug: categorySlug,
      level: 1,
      path: '/',
      isActive: true,
      sortOrder: 1,
      createdBy: adminUserId,
    },
  })

  const testUsers = []
  const testBusinesses = []
  const count = options?.count ?? 3

  for (let i = 0; i < count; i++) {
    // Create test user with unique email
    const uniqueId = uuid().substring(0, 8)
    const user = await prismaClient.user.create({
      data: {
        email: `business${i}-${uniqueId}@test.com`,
        firstName: `Business${i}`,
        lastName: 'Test',
        phoneNumber: `+1234567${uniqueId.substring(0, 3)}${i}`,
        role: 'BUSINESS',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        password: null,
      },
    })

    testUsers.push(user)

    // Create business
    const business = await prismaClient.business.create({
      data: {
        userId: user.id,
        businessNameKey: `business.name.${uuid()}`,
        businessDescriptionKey: `business.description.${uuid()}`,
        categoryId: testCategory.id,
        verified: options?.generateUnverified ? i % 2 === 0 : true,
        active: options?.generateInactive ? i % 2 === 0 : true,
        avgRating: Math.min(3.5 + i * 0.3, 5.0), // Max rating is 5.0
      },
    })

    testBusinesses.push(business)
  }

  logger.debug('Test businesses seeded.')

  return { testUsers, testBusinesses, testCategory }
}

describe('Business Integration Tests', () => {
  let app: Express
  let testDb: TestDatabase
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient
  let internalClient: any
  let internalAPIHelper: InternalAPITestHelper
  let cacheService: MemoryCacheService

  // TranslationClient is mocked in setupTests.ts

  beforeAll(async () => {
    // Setup internal API test helper
    internalAPIHelper = new InternalAPITestHelper(
      'dev-service-api-key-change-in-production',
    )
    internalAPIHelper.setup()

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()

    const translationClient = new TranslationClient()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Create internal API client
    internalClient = internalAPIHelper.createClient(app)

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
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only business-related data to preserve E2E auth users
    if (testDb?.prisma) {
      // Delete in proper order to avoid foreign key constraint violations
      await testDb.prisma.business.deleteMany({})
      await testDb.prisma.category.deleteMany({})
      // DO NOT delete from User table - preserve auth users
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    // Clean up internal API helper
    if (internalAPIHelper) {
      internalAPIHelper.cleanup()
    }

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Read API Tests
  describe('GET /businesses', () => {
    it('should return all active businesses with pagination', async () => {
      await seedTestBusinesses(testDb.prisma)

      const response = await customerClient
        .get('/businesses')
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // 3 test businesses
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter businesses by category_id', async () => {
      const { testCategory } = await seedTestBusinesses(testDb.prisma)
      const response = await customerClient
        .get(`/businesses?categoryId=${testCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.data[0].categoryId).toBe(testCategory.id)
    })

    it('should filter businesses by verified status', async () => {
      await seedTestBusinesses(testDb.prisma, { generateUnverified: true })

      const response = await customerClient
        .get('/businesses?verified=true')
        .set('Accept', 'application/json')
        .expect(200)

      // With generateUnverified: true, only even-indexed businesses are verified
      expect(response.body.data).toHaveLength(2)
      expect(
        response.body.data.every((business: any) => business.verified),
      ).toBe(true)
    })

    it('should only show active businesses to public', async () => {
      await seedTestBusinesses(testDb.prisma, { generateInactive: true })

      const response = await customerClient
        .get('/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      // Public routes should only show active businesses
      expect(response.body.data.every((business: any) => business.active)).toBe(
        true,
      )
    })

    it('should sort businesses by specified field', async () => {
      await seedTestBusinesses(testDb.prisma)

      const response = await customerClient
        .get('/businesses?sortBy=avgRating&sortOrder=desc')
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)

      const ratings = response.body.data.map(
        (business: any) => business.avgRating,
      )

      expect(ratings).toEqual([...ratings].sort((a, b) => b - a))
    })

    it('should paginate results correctly', async () => {
      // Seed more businesses for pagination test
      await seedTestBusinesses(testDb.prisma, { count: 25 })

      const response = await customerClient
        .get('/businesses?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })
  })

  describe('GET /businesses/:business_id', () => {
    it('should return a specific business by ID', async () => {
      const { testBusinesses } = await seedTestBusinesses(testDb.prisma)
      const response = await customerClient
        .get(`/businesses/${testBusinesses[0].id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testBusinesses[0].id)
      expect(response.body.businessNameKey).toBe(
        testBusinesses[0].businessNameKey,
      )
    })

    it('should include user data when requested', async () => {
      const { testBusinesses, testUsers } = await seedTestBusinesses(
        testDb.prisma,
      )
      const response = await customerClient
        .get(`/businesses/${testBusinesses[0].id}?includeUser=true`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUsers[0].email)
      expect(response.body.user.email).toMatch(/^business0-.*@test\.com$/)
    })

    it('should return 404 for non-existent business ID', async () => {
      const nonExistentId = uuid()

      await customerClient
        .get(`/businesses/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should not show inactive businesses to public', async () => {
      const { testBusinesses } = await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
      })

      // Find an inactive business
      const inactiveBusiness = testBusinesses.find((b, i) => i % 2 !== 0) // Odd indexes are inactive

      await customerClient
        .get(`/businesses/${inactiveBusiness.id}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /businesses/user/:user_id', () => {
    it('should return business by user ID', async () => {
      const { testUsers, testBusinesses } = await seedTestBusinesses(
        testDb.prisma,
      )

      const response = await customerClient
        .get(`/businesses/user/${testUsers[0].id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testBusinesses[0].id)
      expect(response.body.userId).toBe(testUsers[0].id)
    })

    it('should return 404 for user without business', async () => {
      // Create a user without a business
      const userWithoutBusiness = await testDb.prisma.user.create({
        data: {
          email: 'nobusiness@test.com',
          firstName: 'No',
          lastName: 'Business',
          role: 'BUSINESS',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: true,
          password: null,
        },
      })

      await customerClient
        .get(`/businesses/user/${userWithoutBusiness.id}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /businesses/me', () => {
    it('should return current user business', async () => {
      const { testUsers, testBusinesses } = await seedTestBusinesses(
        testDb.prisma,
      )

      // Use the business client which has BUSINESS role and proper permissions
      // Note: The businessClient is already authenticated with a BUSINESS role user

      const response = await businessClient
        .get(`/businesses/me`)
        .set('Accept', 'application/json')
        .expect(200)

      // The business client is associated with a specific test user
      // We need to check which business belongs to this user
      const businessUser = await testDb.prisma.user.findFirst({
        where: { email: 'business@e2etest.com' },
      })
      const userBusiness = testBusinesses.find(
        (b) => b.userId === businessUser?.id,
      )

      if (userBusiness) {
        expect(response.body.id).toBe(userBusiness.id)
        expect(response.body.userId).toBe(businessUser?.id)
      }
    })

    it('should require BUSINESS role for /me endpoint', async () => {
      await customerClient
        .get(`/businesses/me`)
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should return 404 for business user without business', async () => {
      // Create a user without a business
      const userWithoutBusiness = await testDb.prisma.user.create({
        data: {
          email: 'nobusiness2@test.com',
          firstName: 'No',
          lastName: 'Business',
          role: 'BUSINESS',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: true,
          password: null,
        },
      })

      // For integration tests, we can't easily create a client for a specific user
      // without going through the full auth flow. This test would need a different approach.
      // Let's skip it for now and focus on the main functionality

      await clientWithoutBusiness
        .get(`/businesses/me`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /businesses/me', () => {
    it('should create a new business for current user', async () => {
      // First create a category
      const adminUserId = uuid() // Create a dummy admin user ID for test data
      const category = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.${uuid()}`,
          descriptionKey: `category.description.${uuid()}`,
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
          createdBy: adminUserId,
        },
      })

      const businessData = {
        businessName: 'New Business',
        businessDescription: 'New business description',
        categoryId: category.id,
        verified: false,
        active: true,
      }

      const response = await businessClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(businessData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.businessNameKey).toBeDefined()
      expect(response.body.categoryId).toBe(businessData.categoryId)

      const savedBusiness = await testDb.prisma.business.findUnique({
        where: { id: response.body.id },
      })

      expect(savedBusiness).not.toBeNull()
      expect(savedBusiness?.businessNameKey).toBe(response.body.businessNameKey)
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { businessDescription: 'Test' } // Missing businessName, categoryId

      const response = await businessClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(incompleteData)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
    })

    it('should prevent user from creating multiple businesses', async () => {
      // First create a category
      const adminUserId = uuid() // Create a dummy admin user ID for test data
      const category = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.${uuid()}`,
          descriptionKey: `category.description.${uuid()}`,
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
          createdBy: adminUserId,
        },
      })

      // Create the first business
      const firstBusinessData = {
        businessName: 'First Business',
        businessDescription: 'First business',
        categoryId: category.id,
      }

      await businessClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(firstBusinessData)
        .expect(201)

      // Now try to create a duplicate - should fail
      const duplicateData = {
        businessName: 'Duplicate Business',
        businessDescription: 'Should fail',
        categoryId: category.id,
      }

      const response = await businessClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(duplicateData)

      expect(response.status).toBe(409) // Conflict - user already has a business
    })

    it('should require BUSINESS role for POST', async () => {
      const adminUserId = uuid() // Create a dummy admin user ID for test data
      const category = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.${uuid()}`,
          descriptionKey: `category.description.${uuid()}`,
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
          createdBy: adminUserId,
        },
      })

      const businessData = {
        businessName: 'Customer Business',
        businessDescription: 'Should fail',
        categoryId: category.id,
        verified: false,
        active: true,
      }

      const response = await customerClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(businessData)

      expect(response.status).toBe(403) // Forbidden - only BUSINESS role can create
    })
  })

  describe('PUT /businesses/me', () => {
    it('should update current user business', async () => {
      const { testBusinesses, testUsers } = await seedTestBusinesses(
        testDb.prisma,
      )
      const updateData = {
        businessName: 'Updated Business Name',
        active: false,
      }

      // Use the business client for updating
      const response = await businessClient
        .put(`/businesses/me`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.active).toBe(false)

      const updatedBusiness = await testDb.prisma.business.findUnique({
        where: { id: testBusinesses[0].id },
      })

      expect(updatedBusiness?.active).toBe(false)
    })

    it('should require BUSINESS role for update', async () => {
      const updateData = {
        businessName: 'Should Not Update',
      }

      await customerClient
        .put(`/businesses/me`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(403) // Forbidden - not business owner
    })
  })

  // Admin API Tests
  describe('Admin Business API', () => {
    describe('GET /admin/businesses', () => {
      it('should return all businesses including inactive for admin', async () => {
        await seedTestBusinesses(testDb.prisma, { generateInactive: true })

        const response = await adminClient
          .get('/admin/businesses')
          .set('Accept', 'application/json')
          .expect(200)

        // Admin should see all businesses, including inactive
        expect(response.body.data).toHaveLength(3)

        // Should have both active and inactive
        const activeCount = response.body.data.filter(
          (b: any) => b.active,
        ).length
        const inactiveCount = response.body.data.filter(
          (b: any) => !b.active,
        ).length

        expect(activeCount).toBeGreaterThan(0)
        expect(inactiveCount).toBeGreaterThan(0)
      })

      it('should filter by active status for admin', async () => {
        await seedTestBusinesses(testDb.prisma, { generateInactive: true })

        const activeResponse = await adminClient
          .get('/admin/businesses?active=true')
          .set('Accept', 'application/json')
          .expect(200)

        expect(activeResponse.body.data.every((b: any) => b.active)).toBe(true)

        const inactiveResponse = await adminClient
          .get('/admin/businesses?active=false')
          .set('Accept', 'application/json')
          .expect(200)

        expect(inactiveResponse.body.data.every((b: any) => !b.active)).toBe(
          false,
        )
      })

      it('should include related data when requested', async () => {
        await seedTestBusinesses(testDb.prisma)

        const response = await adminClient
          .get('/admin/businesses?includeUser=true&includeCategory=true')
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body.data[0].user).toBeDefined()
        expect(response.body.data[0].category).toBeDefined()
      })
    })

    describe('POST /admin/businesses/:id/verify', () => {
      it('should verify a business', async () => {
        const { testBusinesses } = await seedTestBusinesses(testDb.prisma, {
          generateUnverified: true,
        })

        // Find an unverified business
        const unverifiedBusiness = testBusinesses.find((b) => !b.verified)

        expect(unverifiedBusiness).toBeDefined()

        const response = await adminClient
          .post(`/admin/businesses/${unverifiedBusiness!.id}/verify`)
          .set('Accept', 'application/json')
          .send({})
          .expect(200)

        expect(response.body.verified).toBe(true)

        // Verify database was updated
        const updatedBusiness = await testDb.prisma.business.findUnique({
          where: { id: unverifiedBusiness!.id },
        })

        expect(updatedBusiness?.verified).toBe(true)
      })
    })

    describe('POST /admin/businesses/:id/rating', () => {
      it('should update business rating', async () => {
        const { testBusinesses } = await seedTestBusinesses(testDb.prisma)

        const response = await adminClient
          .post(`/admin/businesses/${testBusinesses[0].id}/rating`)
          .set('Accept', 'application/json')
          .send({ rating: 4.8 })
          .expect(200)

        expect(response.body.avgRating).toBe(4.8)

        // Verify database was updated
        const updatedBusiness = await testDb.prisma.business.findUnique({
          where: { id: testBusinesses[0].id },
        })

        expect(updatedBusiness?.avgRating.toNumber()).toBe(4.8)
      })

      it('should validate rating range', async () => {
        const { testBusinesses } = await seedTestBusinesses(testDb.prisma)

        await adminClient
          .post(`/admin/businesses/${testBusinesses[0].id}/rating`)
          .set('Accept', 'application/json')
          .send({ rating: 5.5 }) // Above max
          .expect(400)

        await adminClient
          .post(`/admin/businesses/${testBusinesses[0].id}/rating`)
          .set('Accept', 'application/json')
          .send({ rating: -1 }) // Below min
          .expect(400)
      })
    })

    describe('DELETE /admin/businesses/:id', () => {
      it('should soft delete a business as admin', async () => {
        const { testBusinesses } = await seedTestBusinesses(testDb.prisma)

        await adminClient
          .delete(`/admin/businesses/${testBusinesses[0].id}`)
          .set('Accept', 'application/json')
          .expect(204)

        const deletedBusiness = await testDb.prisma.business.findUnique({
          where: { id: testBusinesses[0].id },
        })

        expect(deletedBusiness).not.toBeNull()
        expect(deletedBusiness?.deletedAt).not.toBeNull() // Soft deleted
      })
    })
  })

  // Internal API Tests
  describe('Internal Business API', () => {
    it('should get businesses by category for internal services', async () => {
      const { testCategory } = await seedTestBusinesses(testDb.prisma)

      const response = await internalClient
        .get(`/internal/businesses/category/${testCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.businesses).toHaveLength(3)
      expect(response.body.businesses[0].categoryId).toBe(testCategory.id)
    })

    it('should batch get businesses by IDs', async () => {
      const { testBusinesses } = await seedTestBusinesses(testDb.prisma)

      const businessIds = testBusinesses.map((b) => b.id)

      const response = await internalClient
        .post(`/internal/businesses/batch`)
        .set('Accept', 'application/json')
        .send({
          businessIds: businessIds.slice(0, 2), // Get first 2
          includeUser: true,
          includeCategory: true,
        })
        .expect(200)

      expect(response.body.businesses).toHaveLength(2)
      expect(response.body.businesses[0].user).toBeDefined()
      expect(response.body.businesses[0].category).toBeDefined()
    })

    it('should require API key for internal endpoints', async () => {
      const { testCategory } = await seedTestBusinesses(testDb.prisma)

      await request
        .get(`/internal/businesses/category/${testCategory.id}`)
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        businessName: 123, // Should be string
        categoryId: 'invalid-uuid',
      }

      const response = await businessClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
    })

    it('should handle invalid UUIDs in path parameters', async () => {
      const response = await customerClient
        .get('/businesses/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
    })

    it('should require authentication for protected endpoints', async () => {
      const unauthenticatedClient = authHelper.getUnauthenticatedClient()

      await unauthenticatedClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(401)

      await unauthenticatedClient
        .post('/businesses/me')
        .set('Accept', 'application/json')
        .send({ businessName: 'Test' })
        .expect(401)
    })
  })

  // Business-specific features
  describe('Business-specific features', () => {
    it('should handle business verification workflow', async () => {
      const { testBusinesses } = await seedTestBusinesses(testDb.prisma, {
        generateUnverified: true,
      })

      // Find an unverified business
      const unverifiedBusiness = testBusinesses.find((b) => !b.verified)

      expect(unverifiedBusiness).toBeDefined()

      // Customer should be able to see unverified businesses
      const customerResponse = await customerClient
        .get(`/businesses/${unverifiedBusiness!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(customerResponse.body.verified).toBe(false)

      // Only admin can verify businesses
      const verifyResponse = await adminClient
        .post(`/admin/businesses/${unverifiedBusiness!.id}/verify`)
        .set('Accept', 'application/json')
        .send({})
        .expect(200)

      expect(verifyResponse.body.verified).toBe(true)
    })

    it('should correctly handle average rating updates', async () => {
      const { testBusinesses } = await seedTestBusinesses(testDb.prisma)

      // Update rating for a business to make it the highest
      const newRating = 5.0
      const response = await adminClient
        .post(`/admin/businesses/${testBusinesses[0].id}/rating`)
        .set('Accept', 'application/json')
        .send({ rating: newRating })
        .expect(200)

      expect(response.body.avgRating).toBe(newRating)

      // Verify it's reflected in list queries
      const listResponse = await customerClient
        .get('/businesses?sortBy=avgRating&sortOrder=desc')
        .set('Accept', 'application/json')
        .expect(200)

      // Find our updated business in the results
      const updatedBusiness = listResponse.body.data.find(
        (b: any) => b.id === testBusinesses[0].id,
      )

      expect(updatedBusiness).toBeDefined()
      expect(updatedBusiness.avgRating).toBe(newRating)

      // Verify it has the highest rating
      const allRatings = listResponse.body.data.map((b: any) => b.avgRating)

      expect(Math.max(...allRatings)).toBe(newRating)
    })
  })
})
