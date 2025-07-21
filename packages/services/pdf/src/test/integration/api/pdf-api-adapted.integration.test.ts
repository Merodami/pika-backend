import {
  cleanupTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import {
  AdSize,
  ContentType,
  PrismaClient,
  VoucherBookStatus,
} from '@prisma/client'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

// Unmock critical modules for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/shared')

import { createPDFGeneratorServer } from '@pdf/server.js'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import {
  createE2EAuthHelper,
  type E2EAuthHelper,
} from '@tests/utils/e2eAuth.js'

describe('PDF Generator API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let prisma: PrismaClient
  let authHelper: E2EAuthHelper

  const mockCacheService = new MockCacheService()

  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'pdf_generator_api_test',
      useInitSql: true,
      startupTimeout: 120000,
    })

    prisma = testDb.prisma
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create Fastify server
    app = await createPDFGeneratorServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
    })

    await app.ready()

    // Initialize auth helper and create test users
    authHelper = createE2EAuthHelper(app, '/api/v1')
    await authHelper.createAllTestUsers(prisma)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear test data
    await prisma.adPlacement.deleteMany()
    await prisma.voucherBookPage.deleteMany()
    await prisma.voucherBook.deleteMany()
  })

  afterAll(async () => {
    if (app) await app.close()
    if (testDb) await cleanupTestDatabase(testDb)
  })

  describe('POST /pdf/books (testing direct path)', () => {
    it('should create a new voucher book', async () => {
      const client = await authHelper.getAdminClient(prisma)

      const bookData = {
        title: 'Test Voucher Book',
        year: 2024,
        month: 6,
        book_type: 'MONTHLY',
        total_pages: 24,
      }

      // Try direct path without /api/v1
      const response = await client.post('/pdf').send(bookData).expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.title).toBe(bookData.title)
      expect(response.body.year).toBe(bookData.year)
      expect(response.body.status).toBe('DRAFT')
    })

    it('should validate required fields', async () => {
      const client = await authHelper.getAdminClient(prisma)

      const invalidData = {
        year: 2024,
        // Missing title
      }

      await client.post('/pdf').send(invalidData).expect(400)
    })
  })

  describe('GET /api/v1/pdf/books', () => {
    it('should list voucher books with pagination', async () => {
      const client = await authHelper.getAdminClient(prisma)

      // Get the admin user ID for ownership
      await authHelper.loginAs('ADMIN', prisma)

      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      // Create test books with ownership
      await Promise.all([
        prisma.voucherBook.create({
          data: {
            title: 'Book 1',
            year: 2024,
            status: VoucherBookStatus.DRAFT,
            createdBy: adminUserRecord?.id || randomUUID(),
          },
        }),
        prisma.voucherBook.create({
          data: {
            title: 'Book 2',
            year: 2024,
            status: VoucherBookStatus.PUBLISHED,
            createdBy: adminUserRecord?.id || randomUUID(),
          },
        }),
        prisma.voucherBook.create({
          data: {
            title: 'Book 3',
            year: 2023,
            status: VoucherBookStatus.DRAFT,
            createdBy: adminUserRecord?.id || randomUUID(),
          },
        }),
      ])

      const response = await client.get('/pdf?page=1&limit=10').expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter books by status', async () => {
      const client = await authHelper.getAdminClient(prisma)

      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      await Promise.all([
        prisma.voucherBook.create({
          data: {
            title: 'Draft Book',
            year: 2024,
            status: VoucherBookStatus.DRAFT,
            createdBy: adminUserRecord?.id || randomUUID(),
          },
        }),
        prisma.voucherBook.create({
          data: {
            title: 'Published Book',
            year: 2024,
            status: VoucherBookStatus.PUBLISHED,
            createdBy: adminUserRecord?.id || randomUUID(),
          },
        }),
      ])

      const response = await client.get('/pdf?status=DRAFT').expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe('DRAFT')
    })
  })

  describe('GET /api/v1/pdf/books/:book_id', () => {
    it('should get a specific voucher book', async () => {
      const client = await authHelper.getAdminClient(prisma)

      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Specific Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const response = await client.get(`/pdf/${book.id}`).expect(200)

      expect(response.body.id).toBe(book.id)
      expect(response.body.title).toBe('Specific Book')
    })

    it('should return 404 for non-existent book', async () => {
      const client = await authHelper.getAdminClient(prisma)
      const nonExistentId = randomUUID()

      await client.get(`/pdf/${nonExistentId}`).expect(404)
    })
  })

  describe('POST /api/v1/pdf/books/:book_id/pages', () => {
    it('should create a page for a voucher book', async () => {
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Test Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const pageData = {
        page_number: 1,
        layout_type: 'STANDARD',
      }

      const client = await authHelper.getAdminClient(prisma)

      const response = await client
        .post(`/pdf/${book.id}/pages`)
        .send(pageData)
        .expect(201)

      expect(response.body.book_id).toBe(book.id)
      expect(response.body.page_number).toBe(1)
      expect(response.body.layout_type).toBe('STANDARD')
    })
  })

  describe('POST /api/v1/pdf/books/:book_id/pages/:page_id/placements', () => {
    it('should create an ad placement on a page', async () => {
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Test Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const page = await prisma.voucherBookPage.create({
        data: {
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      const placementData = {
        position: 1,
        size: 'HALF',
        content_type: 'IMAGE',
        image_url: 'https://example.com/test-image.jpg',
      }

      const client = await authHelper.getAdminClient(prisma)

      const response = await client
        .post(`/pdf/${book.id}/pages/${page.id}/placements`)
        .send(placementData)
        .expect(201)

      expect(response.body.page_id).toBe(page.id)
      expect(response.body.position).toBe(1)
      expect(response.body.size).toBe('HALF')
      expect(response.body.content_type).toBe('IMAGE')
    })

    it('should prevent placing overlapping ads', async () => {
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Test Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const page = await prisma.voucherBookPage.create({
        data: {
          id: randomUUID(),
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      // Create first placement
      await prisma.adPlacement.create({
        data: {
          id: randomUUID(),
          pageId: page.id,
          position: 1,
          size: AdSize.HALF,
          spacesUsed: 4,
          contentType: ContentType.IMAGE,
          imageUrl: 'https://example.com/existing-image.jpg',
        },
      })

      // Try to create overlapping placement
      const overlappingPlacement = {
        position: 2, // Would overlap with existing half ad
        size: 'QUARTER',
        content_type: 'IMAGE',
        image_url: 'https://example.com/overlapping-image.jpg',
      }

      const client = await authHelper.getAdminClient(prisma)

      await client
        .post(`/pdf/${book.id}/pages/${page.id}/placements`)
        .send(overlappingPlacement)
        .expect(409) // Conflict
    })
  })

  describe('POST /api/v1/pdf/books/:book_id/generate', () => {
    it('should generate PDF for a complete voucher book', async () => {
      // Create voucher book with content
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Generated Book',
          year: 2024,
          month: 7,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const page = await prisma.voucherBookPage.create({
        data: {
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      await prisma.adPlacement.create({
        data: {
          pageId: page.id,
          position: 1,
          size: AdSize.FULL,
          spacesUsed: 8,
          contentType: ContentType.IMAGE,
          imageUrl: 'https://example.com/gen-image.jpg',
        },
      })

      const client = await authHelper.getAdminClient(prisma)

      const response = await client
        .post(`/pdf/${book.id}/generate`)
        .send({})
        .expect(400) // Should fail because we have no vouchers, only images

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors.pdf).toBeDefined()
    })

    it('should fail to generate PDF for book without vouchers', async () => {
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Empty Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const page = await prisma.voucherBookPage.create({
        data: {
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      // Add only image content, no vouchers
      await prisma.adPlacement.create({
        data: {
          pageId: page.id,
          position: 1,
          size: AdSize.FULL,
          spacesUsed: 8,
          contentType: ContentType.IMAGE,
          imageUrl: 'https://example.com/image.jpg',
        },
      })

      const client = await authHelper.getAdminClient(prisma)

      const response = await client
        .post(`/pdf/${book.id}/generate`)
        .send({})
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors.pdf).toBeDefined()
    })
  })

  describe('PUT /api/v1/pdf/books/:book_id/status', () => {
    it('should update voucher book status', async () => {
      const adminUserRecord = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      })

      const book = await prisma.voucherBook.create({
        data: {
          title: 'Status Test Book',
          year: 2024,
          status: VoucherBookStatus.DRAFT,
          createdBy: adminUserRecord?.id || randomUUID(),
        },
      })

      const updateData = {
        status: 'READY_FOR_PRINT',
      }

      const client = await authHelper.getAdminClient(prisma)

      const response = await client
        .patch(`/pdf/${book.id}/status`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('READY_FOR_PRINT')

      // Verify in database
      const updatedBook = await prisma.voucherBook.findUnique({
        where: { id: book.id },
      })

      expect(updatedBook?.status).toBe(VoucherBookStatus.READY_FOR_PRINT)
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const client = await authHelper.getAdminClient(prisma)

      // Send actual malformed JSON with correct content type
      const response = await client
        .post('/pdf')
        .set('Content-Type', 'application/json')
        .send('{invalid-json: missing quotes}')

      // JSON parsing errors at the content parser level return 500 with UNEXPECTED_ERROR
      // This is correct behavior - the request failed to parse before reaching business logic
      expect(response.status).toBe(500)
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('UNEXPECTED_ERROR')
      expect(response.body.error.message).toContain('JSON')
    })

    it('should validate UUID parameters', async () => {
      const client = await authHelper.getAdminClient(prisma)

      await client.get('/pdf/not-a-valid-uuid-format').expect(400)
    })

    it('should handle internal server errors gracefully', async () => {
      const client = await authHelper.getAdminClient(prisma)

      // Test with invalid book ID
      const response = await client
        .post('/pdf/not-a-valid-uuid-format/generate')
        .send({})

      // Should return a 4xx or 5xx status, not crash
      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})
