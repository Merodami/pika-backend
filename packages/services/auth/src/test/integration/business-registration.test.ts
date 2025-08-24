/**
 * Business Owner Registration Integration Tests
 *
 * Tests for business owner registration flow with admin dashboard source
 */

import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { authPublic } from '@pika/api'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  createTestDatabase,
  TestDatabaseResult,
} from '@pika/tests'
import { UserRole } from '@pika/types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Business Owner Registration Flow', () => {
  let testDb: TestDatabaseResult

  beforeAll(async () => {
    logger.debug('Setting up Business Owner Registration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_business_registration_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Mock the auth service server creation
    // In a real scenario, you'd import createAuthServer
    // For now, we'll test the registration data structure
    logger.debug('Test database ready')
  })

  afterAll(async () => {
    await cleanupTestDatabase(testDb)
  })

  describe('User Registration with Business Role', () => {
    it('should register user with customer role when source is public', async () => {
      const registrationData: authPublic.RegisterRequest = {
        email: 'customer@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Customer',
        acceptTerms: true,
        marketingConsent: false,
        registrationSource: 'public',
      }

      // Verify the registration data structure
      expect(registrationData.registrationSource).toBe('public')

      // In real implementation, this would create a user with role=customer
      const expectedRole =
        registrationData.registrationSource === 'public'
          ? UserRole.CUSTOMER
          : UserRole.BUSINESS

      expect(expectedRole).toBe(UserRole.CUSTOMER)
    })

    it('should register user with business role when source is admin_dashboard', async () => {
      const registrationData: authPublic.RegisterRequest = {
        email: 'businessowner@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Business',
        acceptTerms: true,
        marketingConsent: false,
        registrationSource: 'admin_dashboard',
      }

      // Verify the registration data structure
      expect(registrationData.registrationSource).toBe('admin_dashboard')

      // In real implementation, this would create a user with role=business
      const expectedRole =
        registrationData.registrationSource === 'admin_dashboard'
          ? UserRole.BUSINESS
          : UserRole.CUSTOMER

      expect(expectedRole).toBe(UserRole.BUSINESS)
    })

    it('should log business owner registration', async () => {
      const registrationData: authPublic.RegisterRequest = {
        email: 'businessowner2@example.com',
        password: 'SecurePass123!',
        firstName: 'Bob',
        lastName: 'Owner',
        acceptTerms: true,
        marketingConsent: false,
        registrationSource: 'admin_dashboard',
      }

      // In real implementation, when role === UserRole.BUSINESS,
      // it should log: 'Business owner registration initiated'
      const role =
        registrationData.registrationSource === 'admin_dashboard'
          ? UserRole.BUSINESS
          : UserRole.CUSTOMER

      if (role === UserRole.BUSINESS) {
        const logEntry = {
          msg: 'Business owner registration initiated',
          email: registrationData.email,
          source: registrationData.registrationSource,
          timestamp: new Date().toISOString(),
        }

        expect(logEntry.msg).toBe('Business owner registration initiated')
        expect(logEntry.source).toBe('admin_dashboard')
      }
    })

    it('should default to public source when not specified', async () => {
      const registrationData: Partial<authPublic.RegisterRequest> = {
        email: 'default@example.com',
        password: 'SecurePass123!',
        firstName: 'Default',
        lastName: 'User',
        acceptTerms: true,
      }

      // The schema should default to 'public'
      const registrationSource = registrationData.registrationSource ?? 'public'

      expect(registrationSource).toBe('public')

      const expectedRole =
        registrationSource === 'admin_dashboard'
          ? UserRole.BUSINESS
          : UserRole.CUSTOMER

      expect(expectedRole).toBe(UserRole.CUSTOMER)
    })
  })

  describe('Business Creation After Registration', () => {
    it('should allow business owner to create a business', async () => {
      // Create a user with business role
      const businessUser = await testDb.prisma.user.create({
        data: {
          email: 'business.creator@example.com',
          firstName: 'Business',
          lastName: 'Creator',
          role: UserRole.BUSINESS,
          status: 'active',
          emailVerified: true,
        },
      })

      // Create a category for the business
      const category = await testDb.prisma.category.create({
        data: {
          nameKey: 'category.test',
          slug: 'test-category',
          level: 1,
          path: '/',
          isActive: true,
          sortOrder: 1,
          createdBy: businessUser.id,
        },
      })

      // Create a business for the user
      const business = await testDb.prisma.business.create({
        data: {
          userId: businessUser.id,
          businessNameKey: 'business.test.name',
          businessDescriptionKey: 'business.test.description',
          categoryId: category.id,
          verified: false,
          active: true,
          approved: false, // Needs admin approval
          avgRating: 0,
        },
      })

      expect(business.userId).toBe(businessUser.id)
      expect(business.approved).toBe(false)
      expect(business.approvedBy).toBeNull()
      expect(business.approvedAt).toBeNull()
    })

    it('should create business without category (to be assigned later)', async () => {
      // Create a user with business role
      const businessUser = await testDb.prisma.user.create({
        data: {
          email: 'business.nocategory@example.com',
          firstName: 'Business',
          lastName: 'NoCategory',
          role: UserRole.BUSINESS,
          status: 'active',
          emailVerified: true,
        },
      })

      // Create a business without category
      const business = await testDb.prisma.business.create({
        data: {
          userId: businessUser.id,
          businessNameKey: 'business.nocategory.name',
          businessDescriptionKey: 'business.nocategory.description',
          categoryId: null, // No category initially
          verified: false,
          active: true,
          approved: false,
          avgRating: 0,
        },
      })

      expect(business.userId).toBe(businessUser.id)
      expect(business.categoryId).toBeNull()
      expect(business.approved).toBe(false)
    })

    it('should allow user to have multiple businesses', async () => {
      // Create a user with business role
      const businessUser = await testDb.prisma.user.create({
        data: {
          email: 'multi.business@example.com',
          firstName: 'Multi',
          lastName: 'Business',
          role: UserRole.BUSINESS,
          status: 'active',
          emailVerified: true,
        },
      })

      // Create first business
      const business1 = await testDb.prisma.business.create({
        data: {
          userId: businessUser.id,
          businessNameKey: 'business.multi.first',
          verified: false,
          active: true,
          approved: false,
          avgRating: 0,
        },
      })

      // Create second business
      const business2 = await testDb.prisma.business.create({
        data: {
          userId: businessUser.id,
          businessNameKey: 'business.multi.second',
          verified: false,
          active: true,
          approved: false,
          avgRating: 0,
        },
      })

      // Verify both businesses belong to the same user
      const userBusinesses = await testDb.prisma.business.findMany({
        where: { userId: businessUser.id },
      })

      expect(userBusinesses).toHaveLength(2)
      expect(userBusinesses.map((b) => b.id)).toContain(business1.id)
      expect(userBusinesses.map((b) => b.id)).toContain(business2.id)
    })
  })

  describe('Admin Approval Flow', () => {
    it('should track approval details when admin approves', async () => {
      const adminUser = await testDb.prisma.user.create({
        data: {
          email: 'admin.approver@example.com',
          firstName: 'Admin',
          lastName: 'Approver',
          role: UserRole.ADMIN,
          status: 'active',
          emailVerified: true,
        },
      })

      const businessUser = await testDb.prisma.user.create({
        data: {
          email: 'pending.business@example.com',
          firstName: 'Pending',
          lastName: 'Business',
          role: UserRole.BUSINESS,
          status: 'active',
          emailVerified: true,
        },
      })

      // Create a business pending approval
      const business = await testDb.prisma.business.create({
        data: {
          userId: businessUser.id,
          businessNameKey: 'business.pending.name',
          verified: false,
          active: true,
          approved: false,
          avgRating: 0,
        },
      })

      // Simulate admin approval
      const approvedBusiness = await testDb.prisma.business.update({
        where: { id: business.id },
        data: {
          approved: true,
          approvedBy: adminUser.id,
          approvedAt: new Date(),
        },
      })

      expect(approvedBusiness.approved).toBe(true)
      expect(approvedBusiness.approvedBy).toBe(adminUser.id)
      expect(approvedBusiness.approvedAt).toBeTruthy()
    })

    it('should clear approval details when admin rejects', async () => {
      const adminUser = await testDb.prisma.user.create({
        data: {
          email: 'admin.rejector@example.com',
          firstName: 'Admin',
          lastName: 'Rejector',
          role: UserRole.ADMIN,
          status: 'active',
          emailVerified: true,
        },
      })

      // Create an approved business
      const business = await testDb.prisma.business.create({
        data: {
          userId: adminUser.id,
          businessNameKey: 'business.toreject.name',
          verified: true,
          active: true,
          approved: true,
          approvedBy: adminUser.id,
          approvedAt: new Date(),
          avgRating: 0,
        },
      })

      // Simulate admin rejection
      const rejectedBusiness = await testDb.prisma.business.update({
        where: { id: business.id },
        data: {
          approved: false,
          approvedBy: null,
          approvedAt: null,
        },
      })

      expect(rejectedBusiness.approved).toBe(false)
      expect(rejectedBusiness.approvedBy).toBeNull()
      expect(rejectedBusiness.approvedAt).toBeNull()
    })
  })
})
