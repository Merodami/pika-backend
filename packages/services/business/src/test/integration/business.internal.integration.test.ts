/**
 * Business Service - Internal API Integration Tests
 * 
 * Tests for internal service-to-service business endpoints.
 * These endpoints are only accessible by other services using API key authentication.
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
  cleanupTestDatabase,
  createTestDatabase,
  TestDatabaseResult,
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

describe('Business Service - Internal API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let cacheService: MemoryCacheService
  let translationClient: TranslationClient
  let internalAPIHelper: InternalAPITestHelper
  let internalClient: any

  beforeAll(async () => {
    logger.debug('Setting up Business Service Internal API integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_internal_db',
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

    // Initialize Internal API Helper
    internalAPIHelper = new InternalAPITestHelper()
    internalAPIHelper.setup() // Set up test API key
    internalClient = internalAPIHelper.createClient(app)

    logger.debug('Internal API setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only business-related data
    if (testDb?.prisma) {
      // Delete in proper order to avoid foreign key constraint violations
      await testDb.prisma.business.deleteMany({})
      await testDb.prisma.category.deleteMany({})
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    internalAPIHelper.cleanup() // Restore original API key

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Internal Service Discovery
  describe('GET /internal/businesses/by-category', () => {
    it('should get businesses by category for internal services', async () => {
      const { businesses, category } = await seedTestBusinesses(testDb.prisma, {
        count: 5,
      })

      const response = await internalClient
        .post('/internal/businesses/by-category')
        .send({ categoryIds: [category.id] })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty(category.id)
      expect(response.body[category.id]).toHaveLength(5)
      expect(response.body[category.id][0]).toHaveProperty('id')
      expect(response.body[category.id][0]).toHaveProperty('businessName')
    })

    it('should handle multiple categories', async () => {
      // Create businesses in multiple categories
      const results = []
      for (let i = 0; i < 3; i++) {
        const result = await seedTestBusinesses(testDb.prisma, { count: 2 })
        results.push(result)
      }

      const categoryIds = results.map((r) => r.category.id)

      const response = await internalClient
        .post('/internal/businesses/by-category')
        .send({ categoryIds })
        .set('Accept', 'application/json')
        .expect(200)

      // Should have results for all 3 categories
      expect(Object.keys(response.body)).toHaveLength(3)
      categoryIds.forEach((categoryId) => {
        expect(response.body[categoryId]).toHaveLength(2)
      })
    })

    it('should return empty array for categories with no businesses', async () => {
      const emptyCategory = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.empty`,
          descriptionKey: `category.description.empty`,
          slug: `empty-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          isActive: true,
          sortOrder: 1,
          createdBy: uuid(),
        },
      })

      const response = await internalClient
        .post('/internal/businesses/by-category')
        .send({ categoryIds: [emptyCategory.id] })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body[emptyCategory.id]).toEqual([])
    })
  })

  describe('POST /internal/businesses/batch', () => {
    it('should batch get businesses by IDs', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 5,
      })
      const businessIds = businesses.slice(0, 3).map((b) => b.id)

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.data.map((b: any) => b.id).sort()).toEqual(
        businessIds.sort(),
      )
    })

    it('should handle non-existent IDs gracefully', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 2,
      })
      const validId = businesses[0].id
      const nonExistentIds = [uuid(), uuid()]

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [validId, ...nonExistentIds] })
        .set('Accept', 'application/json')
        .expect(200)

      // Should only return the valid business
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].id).toBe(validId)
    })

    it('should return empty array for empty request', async () => {
      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [] })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toEqual([])
    })
  })

  describe('GET /internal/businesses/user/:userId', () => {
    it('should get business by user ID for internal services', async () => {
      const userId = uuid()
      const business = await testDb.prisma.business.create({
        data: {
          userId,
          businessName: 'User Business',
          businessDescription: 'Business for specific user',
          categoryId: uuid(),
          verified: true,
          active: true,
        },
      })

      const response = await internalClient
        .get(`/internal/businesses/user/${userId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      expect(response.body.userId).toBe(userId)
    })

    it('should return 404 for user without business', async () => {
      const userWithoutBusiness = uuid()

      await internalClient
        .get(`/internal/businesses/user/${userWithoutBusiness}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('POST /internal/businesses/:id/update-stats', () => {
    it('should update business statistics', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const statsUpdate = {
        incrementReviews: 5,
        newRating: 4.5,
      }

      const response = await internalClient
        .post(`/internal/businesses/${business.id}/update-stats`)
        .send(statsUpdate)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.totalReviews).toBe(business.totalReviews + 5)
      // Rating should be recalculated based on new review
    })

    it('should handle rating recalculation', async () => {
      const business = await testDb.prisma.business.create({
        data: {
          userId: uuid(),
          businessName: 'Rating Test Business',
          businessDescription: 'Test rating calculation',
          categoryId: uuid(),
          verified: true,
          active: true,
          averageRating: 4.0,
          totalReviews: 10,
        },
      })

      // Add a new 5-star review
      const response = await internalClient
        .post(`/internal/businesses/${business.id}/update-stats`)
        .send({
          incrementReviews: 1,
          newRating: 5.0,
        })
        .set('Accept', 'application/json')
        .expect(200)

      // New average should be ((4.0 * 10) + 5.0) / 11 ≈ 4.09
      expect(response.body.averageRating).toBeCloseTo(4.09, 1)
      expect(response.body.totalReviews).toBe(11)
    })
  })

  describe('POST /internal/businesses/validate', () => {
    it('should validate business existence and status', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
        generateUnverified: true,
        count: 4,
      })

      const activeVerifiedBusiness = businesses.find(
        (b) => b.active && b.verified,
      )!

      const response = await internalClient
        .post('/internal/businesses/validate')
        .send({ businessId: activeVerifiedBusiness.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.valid).toBe(true)
      expect(response.body.business).toBeDefined()
      expect(response.body.business.id).toBe(activeVerifiedBusiness.id)
    })

    it('should return invalid for inactive business', async () => {
      const inactiveBusiness = await testDb.prisma.business.create({
        data: {
          userId: uuid(),
          businessName: 'Inactive Business',
          businessDescription: 'This business is inactive',
          categoryId: uuid(),
          verified: true,
          active: false,
        },
      })

      const response = await internalClient
        .post('/internal/businesses/validate')
        .send({ businessId: inactiveBusiness.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.valid).toBe(false)
      expect(response.body.reason).toContain('inactive')
    })

    it('should return invalid for unverified business', async () => {
      const unverifiedBusiness = await testDb.prisma.business.create({
        data: {
          userId: uuid(),
          businessName: 'Unverified Business',
          businessDescription: 'This business is not verified',
          categoryId: uuid(),
          verified: false,
          active: true,
        },
      })

      const response = await internalClient
        .post('/internal/businesses/validate')
        .send({ businessId: unverifiedBusiness.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.valid).toBe(false)
      expect(response.body.reason).toContain('verified')
    })

    it('should return invalid for non-existent business', async () => {
      const nonExistentId = uuid()

      const response = await internalClient
        .post('/internal/businesses/validate')
        .send({ businessId: nonExistentId })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.valid).toBe(false)
      expect(response.body.reason).toContain('not found')
    })
  })

  // Security Tests
  describe('Internal API Security', () => {
    it('should require API key for internal endpoints', async () => {
      // Test without API key
      await request
        .get('/internal/businesses/by-category')
        .set('Accept', 'application/json')
        .expect(401)

      await request
        .post('/internal/businesses/batch')
        .send({ businessIds: [] })
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should reject invalid API keys', async () => {
      const invalidClient = internalAPIHelper.createClient(
        app,
        'invalid-api-key',
      )

      await request
        .get('/internal/businesses/by-category')
        .set('x-api-key', 'invalid-api-key')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should include service identification headers', async () => {
      // The internal client should automatically add service headers
      const { businesses } = await seedTestBusinesses(testDb.prisma)

      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [businesses[0].id] })
        .set('Accept', 'application/json')
        .expect(200)

      // Service should process the request successfully with proper headers
      expect(response.body.data).toHaveLength(1)
    })
  })

  // Performance and Bulk Operations
  describe('Internal API Performance', () => {
    it('should efficiently handle large batch requests', async () => {
      // Create many businesses
      const allBusinesses = []
      for (let i = 0; i < 5; i++) {
        const { businesses } = await seedTestBusinesses(testDb.prisma, {
          count: 10,
        })
        allBusinesses.push(...businesses)
      }

      const businessIds = allBusinesses.map((b) => b.id)

      const startTime = Date.now()
      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds })
        .set('Accept', 'application/json')
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.body.data).toHaveLength(50)
      // Should complete within reasonable time (< 1 second for 50 records)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle concurrent requests', async () => {
      const { businesses, category } = await seedTestBusinesses(testDb.prisma, {
        count: 10,
      })

      // Make multiple concurrent requests
      const promises = [
        internalClient
          .post('/internal/businesses/by-category')
          .send({ categoryIds: [category.id] }),
        internalClient
          .post('/internal/businesses/batch')
          .send({ businessIds: businesses.map((b) => b.id) }),
        internalClient.get(
          `/internal/businesses/user/${businesses[0].userId}`,
        ),
      ]

      const results = await Promise.all(promises)

      // All requests should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200)
      })
    })
  })

  // Data Consistency Tests
  describe('Internal API Data Consistency', () => {
    it('should return consistent data across different endpoints', async () => {
      const userId = uuid()
      const business = await testDb.prisma.business.create({
        data: {
          userId,
          businessName: 'Consistency Test Business',
          businessDescription: 'Testing data consistency',
          categoryId: uuid(),
          verified: true,
          active: true,
          averageRating: 4.5,
          totalReviews: 100,
        },
      })

      // Get the same business through different endpoints
      const [batchResponse, userResponse] = await Promise.all([
        internalClient
          .post('/internal/businesses/batch')
          .send({ businessIds: [business.id] }),
        internalClient.get(`/internal/businesses/user/${userId}`),
      ])

      // Data should be consistent
      expect(batchResponse.body.data[0].id).toBe(userResponse.body.id)
      expect(batchResponse.body.data[0].businessName).toBe(
        userResponse.body.businessName,
      )
      expect(batchResponse.body.data[0].averageRating).toBe(
        userResponse.body.averageRating,
      )
    })

    it('should reflect updates immediately', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Update stats
      await internalClient
        .post(`/internal/businesses/${business.id}/update-stats`)
        .send({
          incrementReviews: 10,
          newRating: 5.0,
        })
        .expect(200)

      // Fetch updated business
      const response = await internalClient
        .post('/internal/businesses/batch')
        .send({ businessIds: [business.id] })
        .expect(200)

      // Should reflect the update
      expect(response.body.data[0].totalReviews).toBe(
        business.totalReviews + 10,
      )
    })
  })
})