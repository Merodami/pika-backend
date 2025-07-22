/**
 * Business Service - Admin API Integration Tests
 *
 * Tests for admin-only business endpoints that require admin privileges.
 * These endpoints are used for business management and administration.
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

describe('Business Service - Admin API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService
  let translationClient: TranslationClient

  // Authenticated clients for different user types
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  beforeAll(async () => {
    logger.debug('Setting up Business Service Admin API integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_admin_db',
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
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Admin Business Management Tests
  describe('GET /admin/businesses', () => {
    it('should return all businesses including inactive for admin', async () => {
      await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
        count: 5,
      })

      const response = await adminClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(5)

      // Admin should see both active and inactive businesses
      const activeCount = response.body.data.filter((b: any) => b.active).length
      const inactiveCount = response.body.data.filter(
        (b: any) => !b.active,
      ).length

      expect(activeCount).toBeGreaterThan(0)
      expect(inactiveCount).toBeGreaterThan(0)
    })

    it('should filter by active status for admin', async () => {
      await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
        count: 6,
      })

      // Get only inactive businesses
      const response = await adminClient
        .get('/admin/businesses')
        .query({ active: false })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data.every((b: any) => !b.active)).toBe(true)
    })

    it('should include related data when requested', async () => {
      await seedTestBusinesses(testDb.prisma)

      const response = await adminClient
        .get('/admin/businesses')
        .query({ include_user: 'true', include_category: 'true' })
        .set('Accept', 'application/json')
        .expect(200)

      // Check that related data is included
      expect(response.body.data[0]).toHaveProperty('user')
      expect(response.body.data[0]).toHaveProperty('category')
    })

    it('should require admin role for admin endpoints', async () => {
      // Non-admin users should get 403 Forbidden
      await customerClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(403)
    })

    it('should support advanced filtering for admins', async () => {
      await seedTestBusinesses(testDb.prisma, {
        generateUnverified: true,
        count: 8,
      })

      // Filter by multiple criteria
      const response = await adminClient
        .get('/admin/businesses')
        .query({
          verified: false,
          active: true,
          sort_by: 'createdAt',
          sort_order: 'desc',
        })
        .set('Accept', 'application/json')
        .expect(200)

      // All results should match the filter criteria
      expect(
        response.body.data.every(
          (b: any) => b.verified === false && b.active === true,
        ),
      ).toBe(true)
    })
  })

  describe('GET /admin/businesses/:id', () => {
    it('should return full business details for admin', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const response = await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      // Admin should see all fields including sensitive ones
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return inactive businesses for admin', async () => {
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

      const response = await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(business.id)
      expect(response.body.active).toBe(false)
    })
  })

  describe('POST /admin/businesses/:id/verify', () => {
    it('should verify a business', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        generateUnverified: true,
      })
      const unverifiedBusiness = businesses.find((b) => !b.verified)!

      const response = await adminClient
        .post(`/admin/businesses/${unverifiedBusiness.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.verified).toBe(true)

      // Verify in database
      const updatedBusiness = await testDb.prisma.business.findUnique({
        where: { id: unverifiedBusiness.id },
      })

      expect(updatedBusiness?.verified).toBe(true)
    })

    it('should unverify a business', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const verifiedBusiness = businesses.find((b) => b.verified)!

      const response = await adminClient
        .post(`/admin/businesses/${verifiedBusiness.id}/verify`)
        .send({ verified: false })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.verified).toBe(false)
    })

    it('should require admin role for verification', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      await customerClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('POST /admin/businesses/:id/rating', () => {
    it('should update business rating', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const ratingData = {
        averageRating: 4.5,
        totalReviews: 150,
      }

      const response = await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(ratingData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.averageRating).toBe(4.5)
      expect(response.body.totalReviews).toBe(150)
    })

    it('should validate rating range', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Invalid rating (> 5)
      const invalidRating = {
        averageRating: 6,
        totalReviews: 10,
      }

      await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(invalidRating)
        .set('Accept', 'application/json')
        .expect(400)

      // Negative rating
      const negativeRating = {
        averageRating: -1,
        totalReviews: 10,
      }

      await adminClient
        .post(`/admin/businesses/${business.id}/rating`)
        .send(negativeRating)
        .set('Accept', 'application/json')
        .expect(400)
    })
  })

  describe('PUT /admin/businesses/:id', () => {
    it('should update any business as admin', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const updateData = {
        businessName: 'Admin Updated Name',
        businessDescription: 'Admin updated description',
        active: false,
        verified: true,
      }

      const response = await adminClient
        .put(`/admin/businesses/${business.id}`)
        .send(updateData)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.businessName).toBe(updateData.businessName)
      expect(response.body.businessDescription).toBe(
        updateData.businessDescription,
      )
      expect(response.body.active).toBe(false)
      expect(response.body.verified).toBe(true)
    })

    it('should allow admin to change business category', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Create a new category
      const newCategory = await testDb.prisma.category.create({
        data: {
          nameKey: `category.name.new.${uuid()}`,
          descriptionKey: `category.description.new.${uuid()}`,
          slug: `new-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          isActive: true,
          sortOrder: 1,
          createdBy: uuid(),
        },
      })

      const response = await adminClient
        .put(`/admin/businesses/${business.id}`)
        .send({ categoryId: newCategory.id })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.categoryId).toBe(newCategory.id)
    })
  })

  describe('DELETE /admin/businesses/:id', () => {
    it('should soft delete a business as admin', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      const response = await adminClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.message).toContain('deleted')

      // Verify business is soft deleted (made inactive)
      const deletedBusiness = await testDb.prisma.business.findUnique({
        where: { id: business.id },
      })

      expect(deletedBusiness?.active).toBe(false)
    })

    it('should require admin role for deletion', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      await customerClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(403)

      await businessClient
        .delete(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Bulk Operations (Admin Only)
  describe('Admin Bulk Operations', () => {
    it('should bulk verify multiple businesses', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        generateUnverified: true,
        count: 5,
      })

      const unverifiedIds = businesses
        .filter((b) => !b.verified)
        .map((b) => b.id)

      const response = await adminClient
        .post('/admin/businesses/bulk/verify')
        .send({
          businessIds: unverifiedIds,
          verified: true,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.updated).toBe(unverifiedIds.length)

      // Verify all are now verified
      const updatedBusinesses = await testDb.prisma.business.findMany({
        where: { id: { in: unverifiedIds } },
      })

      expect(updatedBusinesses.every((b) => b.verified)).toBe(true)
    })

    it('should bulk activate/deactivate businesses', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma, {
        count: 4,
      })

      const businessIds = businesses.map((b) => b.id)

      // Deactivate all
      const response = await adminClient
        .post('/admin/businesses/bulk/status')
        .send({
          businessIds,
          active: false,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.updated).toBe(businessIds.length)

      // Verify all are inactive
      const updatedBusinesses = await testDb.prisma.business.findMany({
        where: { id: { in: businessIds } },
      })

      expect(updatedBusinesses.every((b) => !b.active)).toBe(true)
    })
  })

  // Admin Analytics and Reporting
  describe('Admin Analytics', () => {
    it('should get business statistics', async () => {
      await seedTestBusinesses(testDb.prisma, {
        generateInactive: true,
        generateUnverified: true,
        count: 10,
      })

      const response = await adminClient
        .get('/admin/businesses/stats')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('active')
      expect(response.body).toHaveProperty('inactive')
      expect(response.body).toHaveProperty('verified')
      expect(response.body).toHaveProperty('unverified')
      expect(response.body.total).toBe(10)
    })

    it('should get businesses by category stats', async () => {
      // Create multiple categories with businesses
      for (let i = 0; i < 3; i++) {
        await seedTestBusinesses(testDb.prisma, { count: 3 })
      }

      const response = await adminClient
        .get('/admin/businesses/stats/by-category')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
      expect(response.body).toHaveLength(3) // 3 categories
      expect(response.body[0]).toHaveProperty('categoryId')
      expect(response.body[0]).toHaveProperty('count')
    })
  })

  // RBAC Permission Tests
  describe('RBAC Permission Tests', () => {
    it('should enforce proper permissions for admin endpoints', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Test various admin endpoints with non-admin users
      const endpoints = [
        { method: 'get', url: '/admin/businesses' },
        { method: 'get', url: `/admin/businesses/${business.id}` },
        { method: 'post', url: `/admin/businesses/${business.id}/verify` },
        { method: 'post', url: `/admin/businesses/${business.id}/rating` },
        { method: 'put', url: `/admin/businesses/${business.id}` },
        { method: 'delete', url: `/admin/businesses/${business.id}` },
      ]

      for (const endpoint of endpoints) {
        // Customer should get 403
        const customerReq = customerClient[
          endpoint.method as 'get' | 'post' | 'put' | 'delete'
        ](endpoint.url)

        if (endpoint.method !== 'get' && endpoint.method !== 'delete') {
          customerReq.send({ test: 'data' })
        }
        await customerReq.set('Accept', 'application/json').expect(403)

        // Business user should get 403
        const businessReq = businessClient[
          endpoint.method as 'get' | 'post' | 'put' | 'delete'
        ](endpoint.url)

        if (endpoint.method !== 'get' && endpoint.method !== 'delete') {
          businessReq.send({ test: 'data' })
        }
        await businessReq.set('Accept', 'application/json').expect(403)
      }
    })

    it('should allow admin to perform all operations', async () => {
      const { businesses } = await seedTestBusinesses(testDb.prisma)
      const business = businesses[0]

      // Admin should be able to access all endpoints
      await adminClient
        .get('/admin/businesses')
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .get(`/admin/businesses/${business.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .post(`/admin/businesses/${business.id}/verify`)
        .send({ verified: true })
        .set('Accept', 'application/json')
        .expect(200)

      await adminClient
        .put(`/admin/businesses/${business.id}`)
        .send({ businessName: 'Updated by Admin' })
        .set('Accept', 'application/json')
        .expect(200)
    })
  })
})
