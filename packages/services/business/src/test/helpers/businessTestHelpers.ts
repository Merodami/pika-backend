/**
 * Business Service Test Helpers
 *
 * Shared test utilities and data factories for business integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper foreign key relationships
 * - Supports various business states (active/inactive, verified/unverified)
 * - Provides shared test data for efficient test execution
 * - Handles user creation with proper BUSINESS role assignment
 */

import type { PrismaClient } from '@prisma/client'
import { UserRole, UserStatus } from '@prisma/client'
import { get } from 'lodash-es'
import { v4 as uuid } from 'uuid'

export interface BusinessTestData {
  businesses: any[]
  category: any
  users?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedBusinessTestData {
  // Categories
  activeCategory: any
  inactiveCategory: any

  // Businesses by type
  activeBusinesses: any[]
  inactiveBusinesses: any[]
  verifiedBusinesses: any[]
  unverifiedBusinesses: any[]

  // Users
  businessOwners: any[]

  // Quick access
  allBusinesses: any[]
  businessById: Map<string, any>
}

export interface SeedBusinessOptions {
  generateInactive?: boolean
  generateUnverified?: boolean
  count?: number
  useSharedCategory?: boolean
  sharedCategory?: any
  adminUserId?: string
  userId?: string // Use specific user ID for all businesses
  customData?: Array<{ active?: boolean; verified?: boolean }> // Custom business configurations
}

/**
 * Factory function to create test businesses with proper relationships
 *
 * @param prismaClient - Prisma client instance
 * @param options - Options for generating test data
 * @returns Object containing created businesses, category, and users
 */
export async function seedTestBusinesses(
  prismaClient: PrismaClient,
  options: SeedBusinessOptions = {},
): Promise<BusinessTestData> {
  const {
    generateInactive = false,
    generateUnverified = false,
    count = 3,
    useSharedCategory = true,
    sharedCategory,
    adminUserId = uuid(),
    userId,
    customData,
  } = options

  // Use shared category if provided and requested, otherwise create new one
  const categoryToUse =
    useSharedCategory && sharedCategory
      ? sharedCategory
      : await createTestCategory(prismaClient, adminUserId)

  const businesses = []
  const users = []

  // If userId is provided, create/use that user, otherwise create multiple users
  let singleUser = null

  if (userId) {
    // Check if user already exists
    singleUser = await prismaClient.user.findUnique({ where: { id: userId } })

    if (!singleUser) {
      // Create the specified user
      singleUser = await prismaClient.user.create({
        data: {
          id: userId,
          email: `business-${Date.now()}@test.com`,
          firstName: 'Business',
          lastName: 'Owner',
          password:
            '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe', // hashed "password123"
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })
    }
    users.push(singleUser)
  }

  // Generate test businesses with users
  for (let i = 0; i < count; i++) {
    let businessUserId: string

    if (userId && singleUser) {
      // Use the specified user for all businesses
      businessUserId = singleUser.id
    } else {
      // Create a new user for each business (original behavior)
      const user = await prismaClient.user.create({
        data: {
          id: uuid(),
          email: `business-${Date.now()}-${i + 1}@test.com`,
          firstName: 'Business',
          lastName: `Owner ${i + 1}`,
          password:
            '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe', // hashed "password123"
          role: UserRole.business,
          status: UserStatus.active,
          emailVerified: true,
        },
      })

      users.push(user)
      businessUserId = user.id
    }

    // Determine business properties
    let isActive: boolean
    let isVerified: boolean

    const customConfig = get(customData, i)

    if (customConfig) {
      // Use custom configuration if provided for this specific business
      isActive = customConfig.active ?? true
      isVerified = customConfig.verified ?? true
    } else {
      // Use original behavior: alternating pattern when generate flags are true
      isActive = generateInactive ? i % 2 !== 0 : true // When generateInactive=true, odd indices (1,3,5...) are inactive
      isVerified = generateUnverified ? i % 2 !== 0 : true // When generateUnverified=true, odd indices (1,3,5...) are unverified
    }

    // Create business for this user
    const business = await prismaClient.business.create({
      data: {
        userId: businessUserId,
        businessNameKey: `test.business.name.${Date.now()}.${i + 1}`,
        businessDescriptionKey: `test.business.description.${Date.now()}.${i + 1}`,
        categoryId: categoryToUse.id,
        verified: isVerified,
        active: isActive,
        avgRating: Math.floor(Math.random() * 5) + 1,
      },
    })

    businesses.push(business)
  }

  return { businesses, category: categoryToUse, users }
}

/**
 * Factory function to create a test category
 */
export async function createTestCategory(
  prismaClient: PrismaClient,
  adminUserId: string = uuid(),
) {
  const categorySlug = `test-category-${uuid().substring(0, 8)}`

  return await prismaClient.category.create({
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
}

/**
 * Factory function to create a single test business with user
 */
export async function createTestBusiness(
  prismaClient: PrismaClient,
  options: {
    categoryId: string
    verified?: boolean
    active?: boolean
    businessNameKey?: string
    businessDescriptionKey?: string
    avgRating?: number
  },
) {
  // Create user first
  const user = await prismaClient.user.create({
    data: {
      id: uuid(),
      email: `business-${Date.now()}@test.com`,
      firstName: 'Business',
      lastName: 'Owner',
      password: '$2b$10$K7L1OJvKgU0.JoKnExKQqevVtNp5x8W/D9v5dJF4CqG8bUoHaSyQe',
      role: UserRole.business,
      status: UserStatus.active,
      emailVerified: true,
    },
  })

  // Create business
  const business = await prismaClient.business.create({
    data: {
      userId: user.id,
      businessNameKey: options.businessNameKey || `test.business.${Date.now()}`,
      businessDescriptionKey:
        options.businessDescriptionKey ||
        `test.business.description.${Date.now()}`,
      categoryId: options.categoryId,
      verified: options.verified ?? true,
      active: options.active ?? true,
      avgRating: options.avgRating ?? 4.0,
    },
  })

  return { business, user }
}

/**
 * Clean up test data - useful for afterEach hooks
 */
export async function cleanupBusinessTestData(
  prismaClient: PrismaClient,
  options: {
    preserveSharedCategory?: boolean
    sharedCategoryId?: string
  } = {},
) {
  // Delete in proper order to avoid foreign key constraints
  await prismaClient.business.deleteMany({})
  await prismaClient.user.deleteMany({
    where: {
      role: UserRole.business,
      email: {
        contains: '@test.com',
      },
    },
  })

  if (!options.preserveSharedCategory) {
    await prismaClient.category.deleteMany({})
  } else if (options.sharedCategoryId) {
    // Delete all categories except the shared one
    await prismaClient.category.deleteMany({
      where: {
        id: {
          not: options.sharedCategoryId,
        },
      },
    })
  }
}

/**
 * Generate test business data without persisting to database
 * Useful for testing DTOs and mappers
 */
export function generateBusinessTestData(
  options: {
    count?: number
    includeInactive?: boolean
    includeUnverified?: boolean
  } = {},
) {
  const {
    count = 3,
    includeInactive = false,
    includeUnverified = false,
  } = options
  const businesses = []

  for (let i = 0; i < count; i++) {
    businesses.push({
      id: uuid(),
      userId: uuid(),
      businessNameKey: `test.business.name.${i + 1}`,
      businessDescriptionKey: `test.business.description.${i + 1}`,
      categoryId: uuid(),
      verified: includeUnverified ? i % 2 === 0 : true,
      active: includeInactive ? i % 2 === 0 : true,
      avgRating: Math.floor(Math.random() * 5) + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }

  return businesses
}

/**
 * Create comprehensive shared test data for all tests
 * This creates a variety of businesses in different states that can be reused
 */
export async function createSharedBusinessTestData(
  prismaClient: PrismaClient,
  adminUserId: string = uuid(),
): Promise<SharedBusinessTestData> {
  // Create categories
  const activeCategory = await createTestCategory(prismaClient, adminUserId)
  const inactiveCategory = await prismaClient.category.create({
    data: {
      nameKey: 'category.inactive.test',
      descriptionKey: 'category.inactive.test.description',
      slug: `inactive-category-${uuid().substring(0, 8)}`,
      level: 1,
      path: '/',
      isActive: false,
      sortOrder: 2,
      createdBy: adminUserId,
    },
  })

  const businessOwners: any[] = []
  const activeBusinesses: any[] = []
  const inactiveBusinesses: any[] = []
  const verifiedBusinesses: any[] = []
  const unverifiedBusinesses: any[] = []
  const allBusinesses: any[] = []
  const businessById = new Map<string, any>()

  // Create active verified businesses
  for (let i = 0; i < 3; i++) {
    const { business, user } = await createTestBusiness(prismaClient, {
      categoryId: activeCategory.id,
      verified: true,
      active: true,
      businessNameKey: `test.business.active.verified.${i + 1}`,
      avgRating: 4 + Math.random(),
    })

    businessOwners.push(user)
    activeBusinesses.push(business)
    verifiedBusinesses.push(business)
    allBusinesses.push(business)
    businessById.set(business.id, business)
  }

  // Create inactive businesses
  for (let i = 0; i < 2; i++) {
    const { business, user } = await createTestBusiness(prismaClient, {
      categoryId: activeCategory.id,
      verified: true,
      active: false,
      businessNameKey: `test.business.inactive.${i + 1}`,
      avgRating: 3 + Math.random(),
    })

    businessOwners.push(user)
    inactiveBusinesses.push(business)
    verifiedBusinesses.push(business)
    allBusinesses.push(business)
    businessById.set(business.id, business)
  }

  // Create unverified businesses
  for (let i = 0; i < 2; i++) {
    const { business, user } = await createTestBusiness(prismaClient, {
      categoryId: activeCategory.id,
      verified: false,
      active: true,
      businessNameKey: `test.business.unverified.${i + 1}`,
      avgRating: 2 + Math.random(),
    })

    businessOwners.push(user)
    activeBusinesses.push(business)
    unverifiedBusinesses.push(business)
    allBusinesses.push(business)
    businessById.set(business.id, business)
  }

  // Create one business in inactive category
  const { business: inactiveCategoryBusiness, user: inactiveCategoryUser } =
    await createTestBusiness(prismaClient, {
      categoryId: inactiveCategory.id,
      verified: true,
      active: true,
      businessNameKey: 'test.business.inactive.category',
      avgRating: 4.5,
    })

  businessOwners.push(inactiveCategoryUser)
  activeBusinesses.push(inactiveCategoryBusiness)
  verifiedBusinesses.push(inactiveCategoryBusiness)
  allBusinesses.push(inactiveCategoryBusiness)
  businessById.set(inactiveCategoryBusiness.id, inactiveCategoryBusiness)

  return {
    activeCategory,
    inactiveCategory,
    activeBusinesses,
    inactiveBusinesses,
    verifiedBusinesses,
    unverifiedBusinesses,
    businessOwners,
    allBusinesses,
    businessById,
  }
}
