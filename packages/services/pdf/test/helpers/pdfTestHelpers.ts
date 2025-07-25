/**
 * PDF Service Test Helpers
 *
 * Shared test utilities and data factories for PDF integration tests.
 * Following the factory pattern for test data generation.
 *
 * Key features:
 * - Creates test data with proper foreign key relationships
 * - Supports various voucher book states (draft/published)
 * - Provides shared test data for efficient test execution
 * - Handles proper test data cleanup and relationships
 */

import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

export interface VoucherBookTestData {
  voucherBooks: any[]
  users?: any[]
}

/**
 * Shared test data structure for reuse across tests
 * Created once in beforeAll() and reused across all tests for performance
 */
export interface SharedPDFTestData {
  // Voucher Books by type
  publishedBooks: any[]
  draftBooks: any[]
  
  // Quick access
  allBooks: any[]
  bookById: Map<string, any>
}

export interface SeedVoucherBooksOptions {
  generateDrafts?: boolean
  generatePublished?: boolean
  count?: number
  addPages?: boolean
  addAds?: boolean
  createdBy?: string // UUID of the user who created the voucher books
}

/**
 * Creates test voucher books with proper relationships
 */
export async function seedTestVoucherBooks(
  prisma: PrismaClient,
  options: SeedVoucherBooksOptions = {},
): Promise<VoucherBookTestData> {
  const {
    generateDrafts = false,
    generatePublished = true,
    count = 3,
    addPages = false,
    addAds = false,
    createdBy,
  } = options
  
  // Get a test user if createdBy not provided
  let userId = createdBy
  if (!userId) {
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@test.com' } },
    })
    if (!testUser) {
      throw new Error('No test users found and no createdBy provided.')
    }
    userId = testUser.id
  }

  const voucherBooks: any[] = []

  for (let i = 0; i < count; i++) {
    // Create published book by default
    let status: 'draft' | 'published' = 'published'
    
    if (generateDrafts && generatePublished) {
      status = i % 2 === 0 ? 'published' : 'draft'
    } else if (generateDrafts) {
      status = 'draft'
    }

    const voucherBook = await prisma.voucherBook.create({
      data: {
        id: uuid(),
        title: `Test Voucher Book ${i + 1}`,
        year: new Date().getFullYear(),
        month: (new Date().getMonth() + i) % 12 + 1,
        bookType: i % 2 === 0 ? 'monthly' : 'special_edition',
        totalPages: 24 + (i * 8), // 24, 32, 40, etc.
        status,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    // Add pages if requested
    if (addPages) {
      for (let pageNum = 1; pageNum <= voucherBook.totalPages; pageNum++) {
        await prisma.voucherBookPage.create({
          data: {
            id: uuid(),
            voucherBookId: voucherBook.id,
            pageNumber: pageNum,
            pageType: pageNum % 4 === 0 ? 'ADVERTISEMENT' : 'VOUCHER',
            content: `Page ${pageNum} content`,
            createdBy: userId,
          },
        })
      }
    }

    // Add ads if requested
    if (addAds) {
      await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: voucherBook.id,
          businessId: uuid(), // Mock business ID
          pageNumber: Math.floor(Math.random() * voucherBook.totalPages) + 1,
          adType: 'FULL_PAGE',
          position: 'CENTER',
          status: 'ACTIVE',
          price: 100.0,
          createdBy: userId,
        },
      })
    }

    voucherBooks.push(voucherBook)
  }

  return {
    voucherBooks,
  }
}

/**
 * Creates shared test data for reuse across all tests
 * This is called once in beforeAll() to improve test performance
 */
export async function createSharedPDFTestData(
  prisma: PrismaClient,
): Promise<SharedPDFTestData> {
  // Get a test user for foreign key references
  const testUser = await prisma.user.findFirst({
    where: { email: { contains: '@test.com' } },
  })
  
  if (!testUser) {
    throw new Error('No test users found. Make sure authHelper.createAllTestUsers() was called first.')
  }
  // Create published books
  const publishedBooksData = await seedTestVoucherBooks(prisma, {
    generatePublished: true,
    generateDrafts: false,
    count: 3,
    addPages: true,
    createdBy: testUser.id,
  })

  // Create draft books
  const draftBooksData = await seedTestVoucherBooks(prisma, {
    generatePublished: false,
    generateDrafts: true,
    count: 2,
    createdBy: testUser.id,
  })

  const allBooks = [...publishedBooksData.voucherBooks, ...draftBooksData.voucherBooks]
  const bookById = new Map(allBooks.map((book) => [book.id, book]))

  return {
    publishedBooks: publishedBooksData.voucherBooks,
    draftBooks: draftBooksData.voucherBooks,
    allBooks,
    bookById,
  }
}

/**
 * Helper function to create a single test voucher book
 */
export async function createTestVoucherBook(
  prisma: PrismaClient,
  status: 'draft' | 'published' = 'published',
  title?: string,
  createdBy?: string,
): Promise<any> {
  // Get a test user if createdBy not provided
  let userId = createdBy
  if (!userId) {
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@test.com' } },
    })
    if (!testUser) {
      throw new Error('No test users found and no createdBy provided.')
    }
    userId = testUser.id
  }

  return await prisma.voucherBook.create({
    data: {
      id: uuid(),
      title: title || `Test Voucher Book`,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      bookType: 'monthly',
      totalPages: 24,
      status,
      createdBy: userId,
      updatedBy: userId,
    },
  })
}