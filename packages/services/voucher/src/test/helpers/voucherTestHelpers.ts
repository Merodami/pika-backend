/**
 * Voucher Service Test Helpers
 *
 * Shared test utilities and data factories for voucher integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper foreign key relationships
 * - Supports various voucher states (draft, published, expired, paused)
 * - Provides shared test data for efficient test execution
 * - Handles business and category relationships
 */

import { VoucherState } from '@pika/types'
import type { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { v4 as uuid } from 'uuid'

export interface VoucherTestData {
  vouchers: any[]
  categories: any[]
  businesses: any[]
  users?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedVoucherTestData {
  // Categories
  activeCategories: any[]
  inactiveCategories: any[]

  // Businesses
  activeBusiness: any
  inactiveBusiness: any

  // Vouchers by state
  activeVouchers: any[]
  inactiveVouchers: any[]
  expiredVouchers: any[]
  draftVouchers: any[]
  publishedVouchers: any[]

  // Quick access
  allVouchers: any[]
  voucherById: Map<string, any>
}

export interface SeedVoucherOptions {
  businessId?: string
  includeCategories?: string[]
  generateInactive?: boolean
  generateExpired?: boolean
  count?: number
}

/**
 * Creates comprehensive shared test data for voucher tests
 * This data is created once and reused across all tests for performance
 */
export async function createSharedVoucherTestData(
  prisma: PrismaClient,
  options: SeedVoucherOptions = {},
): Promise<SharedVoucherTestData> {
  const {
    businessId = uuid(),
    includeCategories = [],
    generateInactive = true,
    generateExpired = true,
    count = 10,
  } = options

  // Create categories if not provided
  let categories = []

  if (includeCategories.length > 0) {
    categories = await prisma.category.findMany({
      where: { id: { in: includeCategories } },
    })
  } else {
    // Create default categories
    categories = await Promise.all([
      prisma.category.create({
        data: {
          nameKey: `category.test.active.${uuid()}`,
          descriptionKey: `category.description.active.${uuid()}`,
          slug: `active-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/active',
          sortOrder: 1,
          createdBy: uuid(),
        },
      }),
      prisma.category.create({
        data: {
          nameKey: `category.test.inactive.${uuid()}`,
          descriptionKey: `category.description.inactive.${uuid()}`,
          slug: `inactive-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/inactive',
          isActive: false,
          sortOrder: 2,
          createdBy: uuid(),
        },
      }),
    ])
  }

  const activeCategories = categories.filter((c) => c.isActive)
  const inactiveCategories = categories.filter((c) => !c.isActive)

  // Create businesses if not provided
  let business

  try {
    business = await prisma.business.findUnique({
      where: { id: businessId },
    })
  } catch {
    // Business doesn't exist, create it
  }

  if (!business) {
    business = await prisma.business.create({
      data: {
        id: businessId,
        userId: uuid(),
        businessNameKey: `business.test.${uuid()}`,
        categoryId: activeCategories[0]?.id || null,
        verified: true,
        active: true,
      },
    })
  }

  // Create vouchers with different states
  const vouchers = []
  const voucherStates = [
    VoucherState.DRAFT,
    VoucherState.PUBLISHED,
    VoucherState.SUSPENDED,
  ] // Using SUSPENDED instead of 'paused'
  const now = new Date()
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  for (let i = 0; i < count; i++) {
    const state = voucherStates[i % voucherStates.length]
    const isExpired = generateExpired && i % 5 === 4 // 20% expired if generating expired
    const categoryId =
      activeCategories.length > 0
        ? activeCategories[i % activeCategories.length].id
        : null

    const voucher = await prisma.voucher.create({
      data: {
        titleKey: `voucher.test.${i + 1}.title`,
        descriptionKey: `voucher.test.${i + 1}.description`,
        termsAndConditionsKey: `voucher.test.${i + 1}.terms`,
        categoryId,
        businessId: business.id,
        type: 'fixed',
        value: new Decimal(5000 + i * 1000), // $50 + $10 per voucher
        currency: 'PYG',
        state: isExpired ? VoucherState.EXPIRED : state,
        validUntil: isExpired ? pastDate : futureDate,
        maxRedemptions: 50 + i * 10, // Acts like quantity
      },
    })

    vouchers.push(voucher)
  }

  // Categorize vouchers
  const activeVouchers = vouchers.filter(
    (v) => v.state !== VoucherState.EXPIRED,
  )
  const inactiveVouchers: typeof vouchers = [] // No isActive field in schema
  const expiredVouchers = vouchers.filter(
    (v) => v.state === VoucherState.EXPIRED,
  )
  const draftVouchers = vouchers.filter((v) => v.state === VoucherState.DRAFT)
  const publishedVouchers = vouchers.filter(
    (v) => v.state === VoucherState.PUBLISHED,
  )

  // Create lookup map
  const voucherById = new Map()

  vouchers.forEach((voucher) => {
    voucherById.set(voucher.id, voucher)
  })

  return {
    activeCategories,
    inactiveCategories,
    activeBusiness: business,
    inactiveBusiness: null, // Can be created if needed
    activeVouchers,
    inactiveVouchers,
    expiredVouchers,
    draftVouchers,
    publishedVouchers,
    allVouchers: vouchers,
    voucherById,
  }
}

/**
 * Seeds test vouchers with configurable options
 * Used when you need fresh vouchers for specific tests
 */
export async function seedTestVouchers(
  prisma: PrismaClient,
  options: SeedVoucherOptions = {},
): Promise<VoucherTestData> {
  const { businessId = uuid(), includeCategories = [], count = 5 } = options

  // Get or create categories
  let categories = []

  if (includeCategories.length > 0) {
    categories = await prisma.category.findMany({
      where: { id: { in: includeCategories } },
    })
  } else {
    const category = await prisma.category.create({
      data: {
        nameKey: `category.test.${uuid()}`,
        descriptionKey: `category.description.${uuid()}`,
        slug: `test-cat-${uuid().substring(0, 8)}`,
        level: 1,
        path: '/test',
        sortOrder: 1,
        createdBy: uuid(),
      },
    })

    categories = [category]
  }

  // Get or create business
  let business

  try {
    business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    })
  } catch {
    business = await prisma.business.create({
      data: {
        id: businessId,
        userId: uuid(),
        businessNameKey: `business.seed.${uuid()}`,
        categoryId: categories[0].id,
        verified: true,
        active: true,
      },
    })
  }

  // Create vouchers
  const vouchers = []

  for (let i = 0; i < count; i++) {
    const voucher = await prisma.voucher.create({
      data: {
        titleKey: `voucher.seed.${i + 1}.title`,
        descriptionKey: `voucher.seed.${i + 1}.description`,
        termsAndConditionsKey: `voucher.seed.${i + 1}.terms`,
        categoryId: categories[i % categories.length].id,
        businessId: business.id,
        type: 'fixed',
        value: new Decimal(3000 + i * 500),
        currency: 'PYG',
        state: VoucherState.PUBLISHED,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        maxRedemptions: 25 + i * 5, // Acts like quantity
      },
    })

    vouchers.push(voucher)
  }

  return {
    vouchers,
    categories,
    businesses: [business],
  }
}

/**
 * Cleans up voucher test data
 * Used in beforeEach to clean up test-specific data while preserving shared data
 */
export async function cleanupVoucherTestData(
  prisma: PrismaClient,
  options: {
    preserveSharedData?: boolean
    sharedVoucherIds?: string[]
  } = {},
): Promise<void> {
  const { preserveSharedData = false, sharedVoucherIds = [] } = options

  if (preserveSharedData && sharedVoucherIds.length > 0) {
    // Only delete vouchers not in the shared data list
    await prisma.voucher.deleteMany({
      where: {
        id: { notIn: sharedVoucherIds },
      },
    })
  } else {
    // Delete all test vouchers
    await prisma.voucher.deleteMany({
      where: {
        titleKey: {
          contains: 'voucher.test.',
        },
      },
    })

    await prisma.voucher.deleteMany({
      where: {
        titleKey: {
          contains: 'voucher.seed.',
        },
      },
    })
  }
}
