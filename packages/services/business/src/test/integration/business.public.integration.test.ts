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

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { TestDatabase } from '@pika/tests'
import {
  AuthenticatedRequestClient,
  cleanupTestDatabase,
  createE2EAuthHelper,
  createTestDatabase,
  E2EAuthHelper,
  TestDatabaseResult,
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
): Promise<{ businesses: any[]; category: any }> {
  const {
    generateInactive = false,
    generateUnverified = false,
    count = 3,
  } = options || {}

  // Create a test category
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

  const businesses = []

  // Generate test businesses
  for (let i = 0; i < count; i++) {
    const business = await prismaClient.business.create({
      data: {
        userId: uuid(),
        businessName: `Test Business ${i + 1}`,
        businessDescription: `Description for test business ${i + 1}`,
        categoryId: testCategory.id,
        verified: generateUnverified ? i % 2 === 0 : true,
        active: generateInactive ? i % 2 === 0 : true,
        averageRating: Math.floor(Math.random() * 5) + 1,
        totalReviews: Math.floor(Math.random() * 100),
      },
    })
    businesses.push(business)
  }

  return { businesses, category: testCategory }
}

describe('Business Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: TranslationClient

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient
  let clientWithoutBusiness: AuthenticatedRequestClient

  beforeAll(async () => {
    logger.debug('Setting up Business Service integration tests...')

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
    translationClient = new TranslationClient()

    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
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
        role: 'BUSINESS',
        status: 'ACTIVE',
        emailVerified: true,
      },
    })

    const tokenWithoutBusiness = authHelper.generateTestToken({
      userId: userWithoutBusiness.id,
      email: userWithoutBusiness.email,
      role: userWithoutBusiness.role,
    })

    clientWithoutBusiness = new AuthenticatedRequestClient(
      request,
      tokenWithoutBusiness,
    )

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
      await seedTestBusinesses(testDb.prisma)

      // Test without authentication - should work for public endpoint
      const response = await request
        .get('/businesses')
        .set('Accept', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // 3 test businesses
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter businesses by category_id', async () => {
      const { category } = await seedTestBusinesses(testDb.prisma)

      const response = await request
        .get('/businesses')
        .query({ category_id: category.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(
        response.body.data.every((b: any) => b.categoryId === category.id),
      ).toBe(true)
    })

    it('should filter businesses by verified status', async () => {
      await seedTestBusinesses(testDb.prisma, { generateUnverified: true })

      const response = await request
        .get('/businesses')
        .query({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data.every((b: any) => b.verified === true)).toBe(
        true,
      )
    })

    it('should only show active businesses to public', async () => {
      await seedTestBusinesses(testDb.prisma, { generateInactive: true })

      const response = await request
        .get('/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      // Should only return active businesses
      expect(response.body.data.every((b: any) => b.active === true)).toBe(
        true,
      )
    })

    it('should sort businesses by specified field', async () => {
      await seedTestBusinesses(testDb.prisma)

      const response = await request
        .get('/businesses')
        .query({ sort_by: 'businessName', sort_order: 'asc' })
        .set('Accept', 'application/json')
        .expect(200)

      const names = response.body.data.map((b: any) => b.businessName)
      const sortedNames = [...names].sort()
      expect(names).toEqual(sortedNames)
    })

    it('should paginate results correctly', async () => {
      await seedTestBusinesses(testDb.prisma, { count: 10 })

      const response = await request
        .get('/businesses')
        .query({ page: 1, limit: 5 })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(5)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(5)
      expect(response.body.pagination.total).toBe(10)
    })
  })

  describe('GET /businesses/:business_id', () => {
    it('should return a specific business by ID', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const testBusiness = businesses[0]

      // Test without authentication - should work for public endpoint
      const response = await request
        .get(`/businesses/${testBusiness.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testBusiness.id)
      expect(response.body.businessName).toBe(testBusiness.businessName)
    })

    it('should include user data when requested', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const testBusiness = businesses[0]

      const response = await request
        .get(`/businesses/${testBusiness.id}`)
        .query({ include_user: 'true' })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.user).toBeDefined()
    })

    it('should return 404 for non-existent business ID', async () => {
      const nonExistentId = uuid()

      const response = await request
        .get(`/businesses/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND')
    })

    it('should not show inactive businesses to public', async () => {
      const business = await testDb.prisma.business.create({
        data: {
          userId: uuid(),
          businessName: 'Inactive Business',
          businessDescription: 'This business is inactive',
          categoryId: uuid(),
          verified: true,
          active: false,
        },
      })

      await request
        .get(`/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /businesses/user/:user_id', () => {
    it('should return business by user ID', async () => {
      const userId = uuid()
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      
      // Update one business to have our test user ID
      await testDb.prisma.business.update({
        where: { id: businesses[0].id },
        data: { userId },
      })

      // Test without authentication - should work for public endpoint
      const response = await request
        .get(`/businesses/user/${userId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.userId).toBe(userId)
    })

    it('should return 404 for user without business', async () => {
      const userWithoutBusinessId = uuid()

      await request
        .get(`/businesses/user/${userWithoutBusinessId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Authenticated User Endpoints (Business Role Required)
  describe('GET /businesses/me', () => {
    it('should return current user business', async () => {
      // Create a business for the test business user
      const businessUser = await authHelper.testUsers.BUSINESS
      const businessUserFromDb = await testDb.prisma.user.findUnique({
        where: { email: businessUser.email },
      })

      const myBusiness = await testDb.prisma.business.create({
        data: {
          userId: businessUserFromDb!.id,
          businessName: 'My Test Business',
          businessDescription: 'My business description',
          categoryId: uuid(),
          verified: true,
          active: true,
        },
      })

      const response = await businessClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(myBusiness.id)
      expect(response.body.businessName).toBe('My Test Business')
    })

    it('should require BUSINESS role for /me endpoint', async () => {
      // Customer shouldn't access business/me endpoint
      await customerClient
        .get('/businesses/me')
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should return 404 for business user without business', async () => {
      await clientWithoutBusiness
        .get(`/businesses/me`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests (Business Role Required)
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

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(businessData)
        .set('Accept', 'application/json')
        .expect(201)

      expect(response.body.businessName).toBe(businessData.businessName)
      expect(response.body.businessDescription).toBe(
        businessData.businessDescription,
      )
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = {
        businessName: 'Incomplete Business',
        // Missing required fields
      }

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(incompleteData)
        .set('Accept', 'application/json')
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
        verified: false,
        active: true,
      }

      await clientWithoutBusiness
        .post('/businesses/me')
        .send(firstBusinessData)
        .set('Accept', 'application/json')
        .expect(201)

      // Try to create a second business
      const duplicateData = {
        businessName: 'Second Business',
        businessDescription: 'Should fail',
        categoryId: category.id,
        verified: false,
        active: true,
      }

      const response = await clientWithoutBusiness
        .post('/businesses/me')
        .send(duplicateData)
        .set('Accept', 'application/json')

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

      // Customer shouldn't be able to create a business
      await customerClient
        .post('/businesses/me')
        .send(businessData)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('PUT /businesses/me', () => {
    it('should update current user business', async () => {
      // Create a business for the test business user
      const businessUser = await authHelper.testUsers.BUSINESS
      const businessUserFromDb = await testDb.prisma.user.findUnique({
        where: { email: businessUser.email },
      })

      const myBusiness = await testDb.prisma.business.create({
        data: {
          userId: businessUserFromDb!.id,
          businessName: 'Original Name',
          businessDescription: 'Original description',
          categoryId: uuid(),
          verified: false,
          active: true,
        },
      })

      const updateData = {
        businessName: 'Updated Name',
        businessDescription: 'Updated description',
      }

      const response = await businessClient
        .put('/businesses/me')
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.businessName).toBe(updateData.businessName)
      expect(response.body.businessDescription).toBe(
        updateData.businessDescription,
      )
    })

    it('should require BUSINESS role for update', async () => {
      const updateData = {
        businessName: 'Hacker Name',
        businessDescription: 'Should not work',
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
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle invalid UUIDs in path parameters', async () => {
      await request
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
        .send({ businessName: 'Test' })
        .set('Accept', 'application/json')
        .expect(401)

      await request
        .put('/businesses/me')
        .send({ businessName: 'Test' })
        .set('Accept', 'application/json')
        .expect(401)
    })
  })

  // Business-specific features
  describe('Business-specific features', () => {
    it('should correctly handle average rating updates', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const response = await request
        .get(`/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('averageRating')
      expect(response.body).toHaveProperty('totalReviews')
      expect(typeof response.body.averageRating).toBe('number')
      expect(typeof response.body.totalReviews).toBe('number')
    })
  })
})