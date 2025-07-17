// pdf-generator.integration.test.ts

/**
 * Integration tests for the PDF Generator Service API
 *
 * Tests all endpoints with a real PostgreSQL testcontainer using Supertest.
 */
import { vi } from 'vitest' // vi must be imported to be used

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared // Return all actual exports
})
// --- END MOCKING CONFIGURATION ---

import {
  PrismaClient,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { v4 as uuid } from 'uuid'

import { createPDFGeneratorServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Seed function for test voucher books
async function seedTestVoucherBooks(
  prismaClient: PrismaClient,
  options?: { count?: number; userId?: string },
): Promise<{ voucherBooks: any[] }> {
  logger.debug('Seeding test voucher books...')

  // Create a test user if userId not provided
  let createdBy = options?.userId

  if (!createdBy) {
    const testUser = await prismaClient.user.create({
      data: {
        email: 'pdf-test-user@example.com',
        firstName: 'PDF',
        lastName: 'Test',
        emailVerified: true,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    createdBy = testUser.id
  }

  const voucherBooks = []
  const count = options?.count || 3

  for (let i = 0; i < count; i++) {
    const voucherBook = await prismaClient.voucherBook.create({
      data: {
        title: `Test Voucher Book ${i + 1}`,
        edition: i === 0 ? 'Special Edition' : null,
        bookType:
          i === 0 ? VoucherBookType.SPECIAL_EDITION : VoucherBookType.MONTHLY,
        month: i === 0 ? null : (i % 12) + 1,
        year: 2024,
        status: i === 0 ? VoucherBookStatus.PUBLISHED : VoucherBookStatus.DRAFT,
        totalPages: 24,
        pdfUrl: i === 0 ? 'https://example.com/book.pdf' : null,
        pdfGeneratedAt: i === 0 ? new Date() : null,
        publishedAt: i === 0 ? new Date() : null,
        createdBy,
      },
    })

    voucherBooks.push(voucherBook)
  }

  logger.debug('Test voucher books seeded.')

  return { voucherBooks }
}

describe('PDF Generator API Integration Tests with Supertest', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

  const mockCacheService = new MockCacheService()

  const mockFileStorage: FileStoragePort = {
    upload: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/file.pdf',
      path: 'file.pdf',
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  }

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_generator',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    app = await createPDFGeneratorServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
      // Clear cached tokens to force regeneration with new user IDs
      authHelper.clearTokens()
      // Recreate test users after clearing database
      await authHelper.createAllTestUsers(testDb.prisma)

      // IMPORTANT: Recreate authenticated clients with new user IDs
      // The JWT tokens need to match the new user IDs in the database
      adminClient = await authHelper.getAdminClient(testDb.prisma)
      customerClient = await authHelper.getCustomerClient(testDb.prisma)
    }
  })

  // Read API Tests (using supertest)
  describe('GET /pdf/books', () => {
    it('should return all voucher books with pagination', async () => {
      await seedTestVoucherBooks(testDb.prisma)

      const response = await customerClient
        .get('/pdf')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3)
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter voucher books by status', async () => {
      await seedTestVoucherBooks(testDb.prisma)

      const response = await customerClient
        .get('/pdf?status=PUBLISHED')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe('PUBLISHED')
    })

    it('should filter voucher books by book type', async () => {
      await seedTestVoucherBooks(testDb.prisma)

      const response = await customerClient
        .get('/pdf?book_type=MONTHLY')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(
        response.body.data.every((book: any) => book.book_type === 'MONTHLY'),
      ).toBe(true)
    })

    it('should filter voucher books by year', async () => {
      await seedTestVoucherBooks(testDb.prisma)

      const response = await customerClient
        .get('/pdf?year=2024')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.data.every((book: any) => book.year === 2024)).toBe(
        true,
      )
    })

    it('should paginate results correctly', async () => {
      await seedTestVoucherBooks(testDb.prisma, { count: 15 })

      const response = await customerClient
        .get('/pdf?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(15)
      expect(response.body.data).toHaveLength(5)
    })
  })

  describe('GET /pdf/books/:book_id', () => {
    it('should return a specific voucher book by ID', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const testBook = voucherBooks[0]

      const response = await customerClient
        .get(`/pdf/${testBook.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testBook.id)
      expect(response.body.title).toBe(testBook.title)
      expect(response.body.status).toBe(testBook.status)
    })

    it('should return 404 for non-existent voucher book ID', async () => {
      const nonExistentId = uuid()

      await customerClient
        .get(`/pdf/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /pdf/books', () => {
    const voucherBookData = {
      title: 'New Test Voucher Book',
      edition: 'Test Edition',
      book_type: 'MONTHLY',
      month: 12,
      year: 2024,
      total_pages: 24,
      cover_image_url: 'https://example.com/cover.jpg',
    }

    it('should create a new voucher book', async () => {
      const response = await adminClient
        .post('/pdf')
        .set('Accept', 'application/json')
        .send(voucherBookData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.title).toBe(voucherBookData.title)
      expect(response.body.status).toBe('DRAFT') // Default status

      const savedBook = await testDb.prisma.voucherBook.findUnique({
        where: { id: response.body.id },
      })

      expect(savedBook).not.toBeNull()
      expect(savedBook?.title).toBe(voucherBookData.title)
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { title: 'Test' } // Missing year

      const response = await adminClient
        .post('/pdf')
        .set('Accept', 'application/json')
        .send(incompleteData)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })

    it('should require admin authentication for POST', async () => {
      await customerClient
        .post('/pdf')
        .set('Accept', 'application/json')
        .send(voucherBookData)
        .expect(403) // Forbidden
    })
  })

  describe('PATCH /pdf/books/:book_id', () => {
    it('should update an existing voucher book', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const testBook = voucherBooks[1] // Use a draft book

      const updateData = {
        title: 'Updated Voucher Book Title',
        edition: 'Updated Edition',
      }

      const response = await adminClient
        .patch(`/pdf/${testBook.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.title).toBe('Updated Voucher Book Title')
      expect(response.body.edition).toBe('Updated Edition')

      const updatedBook = await testDb.prisma.voucherBook.findUnique({
        where: { id: testBook.id },
      })

      expect(updatedBook?.title).toBe('Updated Voucher Book Title')
      expect(updatedBook?.edition).toBe('Updated Edition')
    })

    it('should prevent updating published books', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const publishedBook = voucherBooks[0] // First book is published

      const updateData = {
        title: 'Should Not Update',
      }

      const response = await adminClient
        .patch(`/pdf/${publishedBook.id}`)
        .set('Accept', 'application/json')
        .send(updateData)

      // Debug: Check what error we're getting
      if (response.status !== 400) {
        console.log('Update published book - Status:', response.status)
        console.log(
          'Update published book - Body:',
          JSON.stringify(response.body, null, 2),
        )
      }

      expect(response.status).toBe(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return error for PATCH on non-existent voucher book', async () => {
      const response = await adminClient
        .patch(`/pdf/${uuid()}`)
        .set('Accept', 'application/json')
        .send({ title: 'Should Not Work' })
        .expect(404)

      expect(response.body.error).toBeDefined()
    })

    it('should require admin authentication for PATCH', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const testBook = voucherBooks[1]

      await customerClient
        .patch(`/pdf/${testBook.id}`)
        .set('Accept', 'application/json')
        .send({ title: 'Should Not Work' })
        .expect(403)
    })
  })

  describe('PATCH /pdf/books/:book_id/status', () => {
    it('should update voucher book status from DRAFT to READY_FOR_PRINT', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const draftBook = voucherBooks[1] // Draft book

      const statusUpdate = {
        status: 'READY_FOR_PRINT',
      }

      const response = await adminClient
        .patch(`/pdf/${draftBook.id}/status`)
        .set('Accept', 'application/json')
        .send(statusUpdate)
        .expect(200)

      expect(response.body.status).toBe('READY_FOR_PRINT')
      expect(response.body.pdf_generated_at).toBeDefined()
    })

    it('should publish voucher book with PDF URL', async () => {
      // First create a book in READY_FOR_PRINT status
      const testUser = await testDb.prisma.user.findFirst({
        where: { email: 'admin@e2etest.com' },
      })

      const book = await testDb.prisma.voucherBook.create({
        data: {
          title: 'Book to Publish',
          year: 2024,
          month: 6,
          status: VoucherBookStatus.READY_FOR_PRINT,
          pdfGeneratedAt: new Date(),
          createdBy: testUser!.id,
        },
      })

      const statusUpdate = {
        status: 'PUBLISHED',
        pdf_url: 'https://example.com/published-book.pdf',
      }

      const response = await adminClient
        .patch(`/pdf/${book.id}/status`)
        .set('Accept', 'application/json')
        .send(statusUpdate)
        .expect(200)

      expect(response.body.status).toBe('PUBLISHED')
      expect(response.body.pdf_url).toBe(
        'https://example.com/published-book.pdf',
      )
      expect(response.body.published_at).toBeDefined()
    })

    it('should validate invalid status transitions', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const draftBook = voucherBooks[1] // Draft book

      const invalidStatusUpdate = {
        status: 'PUBLISHED', // Can't go directly from DRAFT to PUBLISHED
      }

      const response = await adminClient
        .patch(`/pdf/${draftBook.id}/status`)
        .set('Accept', 'application/json')
        .send(invalidStatusUpdate)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should require PDF URL when publishing', async () => {
      // Create a book in READY_FOR_PRINT status
      const testUser = await testDb.prisma.user.findFirst({
        where: { email: 'admin@e2etest.com' },
      })

      const book = await testDb.prisma.voucherBook.create({
        data: {
          title: 'Book to Publish',
          year: 2024,
          month: 6,
          status: VoucherBookStatus.READY_FOR_PRINT,
          pdfGeneratedAt: new Date(),
          createdBy: testUser!.id,
        },
      })

      const statusUpdate = {
        status: 'PUBLISHED',
        // Missing pdf_url
      }

      const response = await adminClient
        .patch(`/pdf/${book.id}/status`)
        .set('Accept', 'application/json')
        .send(statusUpdate)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors.pdfUrl).toBeDefined()
    })
  })

  describe('DELETE /pdf/books/:book_id', () => {
    it('should delete a draft voucher book', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const draftBook = voucherBooks[1] // Draft book

      await adminClient
        .delete(`/pdf/${draftBook.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedBook = await testDb.prisma.voucherBook.findUnique({
        where: { id: draftBook.id },
      })

      expect(deletedBook).toBeNull()
    })

    it('should prevent deletion of published books', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const publishedBook = voucherBooks[0] // Published book

      const response = await adminClient
        .delete(`/pdf/${publishedBook.id}`)
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return error for DELETE on non-existent voucher book', async () => {
      const response = await adminClient
        .delete(`/pdf/${uuid()}`)
        .set('Accept', 'application/json')
        .expect(404)

      expect(response.body.error).toBeDefined()
    })

    it('should require admin authentication for DELETE', async () => {
      const { voucherBooks } = await seedTestVoucherBooks(testDb.prisma)
      const draftBook = voucherBooks[1]

      await customerClient
        .delete(`/pdf/${draftBook.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Error Handling with Supertest', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        title: '', // Empty title
        year: 'not-a-number', // Invalid year
      }

      const response = await adminClient
        .post('/pdf')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })

    it('should handle invalid UUIDs in path parameters for GET', async () => {
      const response = await customerClient
        .get('/pdf/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    if (app) await app.close() // Close Fastify server first

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })
})
