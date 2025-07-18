import { GeneratePDFCommandHandler } from '@pdf-write/application/use_cases/commands/GeneratePDFCommandHandler.js'
import { PrismaPDFWriteRepository } from '@pdf-write/infrastructure/persistence/pgsql/repositories/PrismaPDFWriteRepository.js'
import { PageLayoutEngine } from '@pdf-write/infrastructure/services/PageLayoutEngine.js'
import { FileStoragePort } from '@pika/shared'
import { createTestDatabase } from '@pika/tests'
import {
  AdSize,
  ContentType,
  PrismaClient,
  VoucherBookStatus,
} from '@prisma/client'
import { randomUUID } from 'crypto'
import { get } from 'lodash-es'
import { nanoid } from 'nanoid'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

// Mock file storage
class MockFileStorage implements FileStoragePort {
  async saveFile(file: any, prefix?: string) {
    // Extract filename from file or generate one
    const filename = file.filename || `${prefix}/${Date.now()}.pdf`

    return {
      url: `https://mock-storage.com/${filename}`,
      size: file.buffer ? file.buffer.length : 1000,
      mimetype: file.mimetype || 'application/pdf',
    }
  }

  async deleteFile(): Promise<void> {
    // Mock delete
  }
}

// Mock rate limiter
class MockPDFGenerationRateLimiter {
  async checkRateLimit() {
    return {
      allowed: true,
      remaining: 10,
      resetTime: new Date(Date.now() + 3600000),
      retryAfter: 0,
    }
  }
}

// Mock service clients
class MockVoucherServiceClient {
  private providerIdOverride?: string

  setProviderId(id: string) {
    this.providerIdOverride = id
  }

  async getVouchersByIds(ids: string[]) {
    const vouchers = new Map()

    for (const id of ids) {
      vouchers.set(id, {
        id,
        title: { en: 'Test Voucher', es: 'Cupón de Prueba' },
        description: { en: 'Test description', es: 'Descripción de prueba' },
        discount_value: 50,
        discount_type: 'PERCENTAGE',
        provider_id: this.providerIdOverride || 'test-provider-id',
        terms_and_conditions: { en: 'Terms', es: 'Términos' },
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
    }

    return vouchers
  }
}

class MockCryptoServiceAdapter {
  async generateShortCode(voucherId: string) {
    return {
      shortCode: nanoid(8).toUpperCase(),
      checksum: 'ABC',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        voucherId,
        type: 'print',
        hasExpiration: true,
        codeFormat: 'ALPHANUMERIC',
      },
    }
  }

  async generateBatchQRPayloads(vouchers: any[]) {
    const payloads = new Map()

    for (const voucher of vouchers) {
      payloads.set(voucher.voucherId, `mock-jwt-payload-${voucher.voucherId}`)
    }

    return payloads
  }
}

class MockProviderServiceClient {
  async getProvider(id: string) {
    return {
      id,
      businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
    }
  }
}

describe('PDF Generation Full Integration Test', () => {
  let prisma: PrismaClient
  let cleanup: () => Promise<void>
  let repository: PrismaPDFWriteRepository
  let handler: GeneratePDFCommandHandler
  let fileStorage: MockFileStorage
  let testUser: any
  let testDb: any
  let testProvider: any
  let testCategory: any
  let mockVoucherServiceClient: MockVoucherServiceClient
  let mockPDFGenerationService: any

  // Helper function to create a test voucher
  const createTestVoucher = async (
    id: string,
    title: string = 'Test Voucher',
  ) => {
    return await prisma.voucher.create({
      data: {
        id,
        title: { en: title, es: `${title} (ES)` },
        description: { en: 'Test Description', es: 'Descripción de Prueba' },
        terms: { en: 'Test Terms', es: 'Términos de Prueba' },
        discountType: 'PERCENTAGE',
        discountValue: 50,
        categoryId: testCategory.id,
        providerId: testProvider.id,
        state: 'PUBLISHED',
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })
  }

  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase()
    prisma = testDb.prisma
    cleanup = testDb.cleanup

    // Initialize repository and services
    repository = new PrismaPDFWriteRepository(prisma)
    fileStorage = new MockFileStorage()
    mockVoucherServiceClient = new MockVoucherServiceClient()

    // Mock PDF generation service to avoid pdfkit dependencies
    mockPDFGenerationService = {
      generateVoucherBookPDF: vi
        .fn()
        .mockResolvedValue(Buffer.from('mock-pdf-content')),
    }

    // Initialize handler with all dependencies
    handler = new GeneratePDFCommandHandler(
      repository,
      fileStorage,
      mockPDFGenerationService as any,
      new PageLayoutEngine(),
      mockVoucherServiceClient as any,
      new MockCryptoServiceAdapter() as any,
      new MockProviderServiceClient() as any,
      new MockPDFGenerationRateLimiter() as any,
    )
  })

  beforeEach(async () => {
    // Clear relevant tables in correct order
    await prisma.adPlacement.deleteMany()
    await prisma.voucherBookPage.deleteMany()
    await prisma.voucherBook.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.provider.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()

    // Reset mocks
    vi.clearAllMocks()
    mockPDFGenerationService.generateVoucherBookPDF.mockResolvedValue(
      Buffer.from('mock-pdf-content'),
    )

    // Reset voucher service client to default implementation
    mockVoucherServiceClient.getVouchersByIds =
      MockVoucherServiceClient.prototype.getVouchersByIds.bind(
        mockVoucherServiceClient,
      )

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
      },
    })

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: { en: 'Test Category', es: 'Categoría de Prueba' },
        description: { en: 'Test Description', es: 'Descripción de Prueba' },
        slug: 'test-category',
        active: true,
      },
    })

    // Create test provider
    testProvider = await prisma.provider.create({
      data: {
        id: randomUUID(),
        userId: testUser.id,
        businessName: { en: 'Test Business', es: 'Negocio de Prueba' },
        businessDescription: {
          en: 'Test Description',
          es: 'Descripción de Prueba',
        },
        categoryId: testCategory.id,
        verified: true,
        active: true,
      },
    })

    // Set the provider ID in the mock
    mockVoucherServiceClient.setProviderId(testProvider.id)
  })

  afterAll(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  it('should generate a PDF with voucher placements', async () => {
    // Create voucher book
    const book = await prisma.voucherBook.create({
      data: {
        title: 'Test Voucher Book January 2024',
        year: 2024,
        month: 1,
        status: VoucherBookStatus.DRAFT,
        totalPages: 2,
        createdBy: testUser.id,
      },
    })

    // Create pages
    const page1 = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 1,
        layoutType: 'STANDARD',
      },
    })

    const page2 = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 2,
        layoutType: 'STANDARD',
      },
    })

    // Create vouchers first
    const voucherId1 = randomUUID()
    const voucherId2 = randomUUID()
    const voucherId3 = randomUUID()

    await prisma.voucher.create({
      data: {
        id: voucherId1,
        title: { en: 'Test Voucher 1', es: 'Cupón de Prueba 1' },
        description: { en: 'Description 1', es: 'Descripción 1' },
        terms: { en: 'Terms 1', es: 'Términos 1' },
        discountType: 'PERCENTAGE',
        discountValue: 50,
        categoryId: testCategory.id,
        providerId: testProvider.id,
        state: 'PUBLISHED',
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    await prisma.voucher.create({
      data: {
        id: voucherId2,
        title: { en: 'Test Voucher 2', es: 'Cupón de Prueba 2' },
        description: { en: 'Description 2', es: 'Descripción 2' },
        terms: { en: 'Terms 2', es: 'Términos 2' },
        discountType: 'PERCENTAGE',
        discountValue: 25,
        categoryId: testCategory.id,
        providerId: testProvider.id,
        state: 'PUBLISHED',
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.voucher.create({
      data: {
        id: voucherId3,
        title: { en: 'Test Voucher 3', es: 'Cupón de Prueba 3' },
        description: { en: 'Description 3', es: 'Descripción 3' },
        terms: { en: 'Terms 3', es: 'Términos 3' },
        discountType: 'PERCENTAGE',
        discountValue: 10,
        categoryId: testCategory.id,
        providerId: testProvider.id,
        state: 'PUBLISHED',
        validFrom: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Create ad placements with different sizes
    await prisma.adPlacement.create({
      data: {
        pageId: page1.id,
        position: 1,
        size: AdSize.HALF,
        spacesUsed: 4,
        contentType: ContentType.VOUCHER,
        voucherId: voucherId1,
        shortCode: 'TEST001',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page1.id,
        position: 5,
        size: AdSize.QUARTER,
        spacesUsed: 2,
        contentType: ContentType.VOUCHER,
        voucherId: voucherId2,
        shortCode: 'TEST002',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page1.id,
        position: 7,
        size: AdSize.SINGLE,
        spacesUsed: 1,
        contentType: ContentType.IMAGE,
        imageUrl: 'https://example.com/ad-image.jpg',
        title: 'Advertisement',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page2.id,
        position: 1,
        size: AdSize.FULL,
        spacesUsed: 8,
        contentType: ContentType.VOUCHER,
        voucherId: voucherId3,
        shortCode: 'TEST003',
      },
    })

    // Execute PDF generation
    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    // Verify result
    expect(result.success).toBe(true)
    expect(result.pdfUrl).toBeDefined()
    expect(result.pdfUrl).toContain('mock-storage.com')
    expect(result.generatedAt).toBeDefined()
    expect(result.error).toBeUndefined()

    // Verify book status was updated
    const updatedBook = await prisma.voucherBook.findUnique({
      where: { id: book.id },
    })

    expect(updatedBook?.status).toBe(VoucherBookStatus.READY_FOR_PRINT)
    expect(updatedBook?.pdfUrl).toBe(result.pdfUrl)
    expect(updatedBook?.pdfGeneratedAt).toBeDefined()
  })

  it('should fail gracefully when no vouchers are found', async () => {
    // Create voucher book without any voucher placements
    const book = await prisma.voucherBook.create({
      data: {
        title: 'Empty Voucher Book',
        year: 2024,
        month: 2,
        status: VoucherBookStatus.DRAFT,
        totalPages: 1,
        createdBy: testUser.id,
      },
    })

    const page = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 1,
        layoutType: 'STANDARD',
      },
    })

    // Only add image placements, no vouchers
    await prisma.adPlacement.create({
      data: {
        pageId: page.id,
        position: 1,
        size: AdSize.FULL,
        spacesUsed: 8,
        contentType: ContentType.IMAGE,
        imageUrl: 'https://example.com/full-page-ad.jpg',
      },
    })

    // Execute PDF generation
    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    // Should fail with appropriate error
    expect(result.success).toBe(false)
    expect(result.error).toContain('No vouchers found')
    expect(result.pdfUrl).toBeUndefined()
  })

  it('should handle mixed content types on pages', async () => {
    // Create voucher book
    const book = await prisma.voucherBook.create({
      data: {
        title: 'Mixed Content Book',
        year: 2024,
        status: VoucherBookStatus.DRAFT,
        createdBy: testUser.id,
      },
    })

    const page = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 1,
        layoutType: 'STANDARD',
      },
    })

    // Mix of vouchers, images, ads, and sponsored content
    const voucherId = randomUUID()

    await createTestVoucher(voucherId, 'Mixed Content Voucher')

    await prisma.adPlacement.create({
      data: {
        pageId: page.id,
        position: 1,
        size: AdSize.QUARTER,
        spacesUsed: 2,
        contentType: ContentType.VOUCHER,
        voucherId,
        shortCode: 'MIX001',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page.id,
        position: 3,
        size: AdSize.QUARTER,
        spacesUsed: 2,
        contentType: ContentType.AD,
        title: 'Advertisement',
        description: 'Buy our products!',
        imageUrl: 'https://example.com/ad.jpg',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page.id,
        position: 5,
        size: AdSize.HALF,
        spacesUsed: 4,
        contentType: ContentType.SPONSORED,
        title: 'Sponsored Content',
        description: 'This content is sponsored',
        providerId: testProvider.id,
      },
    })

    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    expect(result.success).toBe(true)
    expect(result.pdfUrl).toBeDefined()
  })

  it('should handle large voucher books with multiple pages', async () => {
    // Create a larger voucher book with 10 pages
    const book = await prisma.voucherBook.create({
      data: {
        title: 'Large Voucher Book',
        year: 2024,
        month: 3,
        status: VoucherBookStatus.DRAFT,
        totalPages: 10,
        createdBy: testUser.id,
      },
    })

    // Create pages with varying content
    const pages = []
    const voucherIds = []

    for (let pageNum = 1; pageNum <= 10; pageNum++) {
      const page = await prisma.voucherBookPage.create({
        data: {
          bookId: book.id,
          pageNumber: pageNum,
          layoutType: 'STANDARD',
        },
      })

      pages.push(page)

      // Add 4 vouchers per page (QUARTER size each)
      for (let pos = 1; pos <= 8; pos += 2) {
        const voucherId = randomUUID()

        voucherIds.push(voucherId)

        await createTestVoucher(
          voucherId,
          `Large Book Voucher Page ${pageNum} Pos ${pos}`,
        )

        await prisma.adPlacement.create({
          data: {
            pageId: page.id,
            position: pos,
            size: AdSize.QUARTER,
            spacesUsed: 2,
            contentType: ContentType.VOUCHER,
            voucherId,
            shortCode: `LRG${pageNum}${pos}`,
          },
        })
      }
    }

    // Execute PDF generation
    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    expect(result.success).toBe(true)
    expect(result.pdfUrl).toBeDefined()
    expect(result.generatedAt).toBeDefined()

    // Verify book status was updated
    const updatedBook = await prisma.voucherBook.findUnique({
      where: { id: book.id },
    })

    expect(updatedBook?.status).toBe(VoucherBookStatus.READY_FOR_PRINT)
  })

  it('should handle voucher generation errors gracefully', async () => {
    // Create voucher book with voucher placement
    const book = await prisma.voucherBook.create({
      data: {
        title: 'Error Test Book',
        year: 2024,
        status: VoucherBookStatus.DRAFT,
        createdBy: testUser.id,
      },
    })

    const page = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 1,
        layoutType: 'STANDARD',
      },
    })

    // Create a voucher that will exist in the database but fail during fetch
    const errorVoucherId = randomUUID()

    await createTestVoucher(errorVoucherId, 'Error Test Voucher')

    await prisma.adPlacement.create({
      data: {
        pageId: page.id,
        position: 1,
        size: AdSize.FULL,
        spacesUsed: 8,
        contentType: ContentType.VOUCHER,
        voucherId: errorVoucherId,
        shortCode: 'ERR001',
      },
    })

    // Mock the voucher service to return an error for this specific test
    const originalGetVouchersByIds = mockVoucherServiceClient.getVouchersByIds

    mockVoucherServiceClient.getVouchersByIds = vi
      .fn()
      .mockRejectedValueOnce(new Error('Failed to fetch vouchers from service'))

    // Execute PDF generation - should fail due to voucher service error
    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    expect(result.success).toBe(false)
    // The error message comes from the thrown error
    expect(result.error).toBe('Failed to fetch vouchers from service')
    expect(result.pdfUrl).toBeUndefined()

    // Restore original implementation
    mockVoucherServiceClient.getVouchersByIds = originalGetVouchersByIds
  })

  it('should validate PDF file content and structure', async () => {
    // Create a simple voucher book for testing
    const book = await prisma.voucherBook.create({
      data: {
        title: 'PDF Validation Book',
        year: 2024,
        month: 4,
        status: VoucherBookStatus.DRAFT,
        totalPages: 2,
        createdBy: testUser.id,
      },
    })

    const page1 = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 1,
        layoutType: 'STANDARD',
      },
    })

    const page2 = await prisma.voucherBookPage.create({
      data: {
        bookId: book.id,
        pageNumber: 2,
        layoutType: 'STANDARD',
      },
    })

    // Add different types of content
    const voucherId1 = randomUUID()
    const voucherId2 = randomUUID()

    await createTestVoucher(voucherId1, 'PDF Validation Voucher 1')
    await createTestVoucher(voucherId2, 'PDF Validation Voucher 2')

    await prisma.adPlacement.create({
      data: {
        pageId: page1.id,
        position: 1,
        size: AdSize.HALF,
        spacesUsed: 4,
        contentType: ContentType.VOUCHER,
        voucherId: voucherId1,
        shortCode: 'VAL001',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page1.id,
        position: 5,
        size: AdSize.HALF,
        spacesUsed: 4,
        contentType: ContentType.IMAGE,
        imageUrl: 'https://example.com/test-image.jpg',
        title: 'Test Image Ad',
      },
    })

    await prisma.adPlacement.create({
      data: {
        pageId: page2.id,
        position: 1,
        size: AdSize.FULL,
        spacesUsed: 8,
        contentType: ContentType.VOUCHER,
        voucherId: voucherId2,
        shortCode: 'VAL002',
      },
    })

    // Execute PDF generation
    const result = await handler.execute(
      {
        bookId: book.id,
        userId: testUser.id,
      },
      {
        userId: testUser.id,
        role: 'ADMIN',
        permissions: ['pdf:write'],
      },
    )

    expect(result.success).toBe(true)
    expect(result.pdfUrl).toBeDefined()
    expect(result.pdfUrl).toMatch(
      /^https:\/\/mock-storage\.com\/voucher-books\//,
    )

    // Verify database was updated correctly
    const updatedBook = await prisma.voucherBook.findUnique({
      where: { id: book.id },
    })

    expect(updatedBook?.pdfUrl).toBe(result.pdfUrl)
    expect(updatedBook?.pdfGeneratedAt).toBeDefined()
    expect(updatedBook?.status).toBe(VoucherBookStatus.READY_FOR_PRINT)
  })

  it('should handle concurrent PDF generation requests', async () => {
    // Create multiple voucher books
    const books = await Promise.all([
      prisma.voucherBook.create({
        data: {
          title: 'Concurrent Book 1',
          year: 2024,
          month: 1,
          totalPages: 1,
          status: VoucherBookStatus.DRAFT,
          createdBy: testUser.id,
        },
      }),
      prisma.voucherBook.create({
        data: {
          title: 'Concurrent Book 2',
          year: 2024,
          month: 2,
          totalPages: 1,
          status: VoucherBookStatus.DRAFT,
          createdBy: testUser.id,
        },
      }),
      prisma.voucherBook.create({
        data: {
          title: 'Concurrent Book 3',
          year: 2024,
          month: 3,
          totalPages: 1,
          status: VoucherBookStatus.DRAFT,
          createdBy: testUser.id,
        },
      }),
    ])

    // Add content to each book
    for (const book of books) {
      const page = await prisma.voucherBookPage.create({
        data: {
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      const voucherId = randomUUID()

      await createTestVoucher(voucherId, `Concurrent Voucher ${book.title}`)

      await prisma.adPlacement.create({
        data: {
          pageId: page.id,
          position: 1,
          size: AdSize.FULL,
          spacesUsed: 8,
          contentType: ContentType.VOUCHER,
          voucherId,
          shortCode: nanoid(6).toUpperCase(),
        },
      })
    }

    // Execute PDF generation concurrently
    const promises = books.map((book) =>
      handler.execute(
        {
          bookId: book.id,
          userId: testUser.id,
        },
        {
          userId: testUser.id,
          role: 'ADMIN',
          permissions: ['pdf:write'],
        },
      ),
    )

    const results = await Promise.all(promises)

    // All should succeed
    results.forEach((result, index) => {
      expect(result.success).toBe(true)
      expect(result.pdfUrl).toBeDefined()
      expect(result.pdfUrl).toContain(get(books, index).id)
    })

    // Verify all books were updated
    for (const book of books) {
      const updatedBook = await prisma.voucherBook.findUnique({
        where: { id: book.id },
      })

      expect(updatedBook?.status).toBe(VoucherBookStatus.READY_FOR_PRINT)
      expect(updatedBook?.pdfUrl).toBeDefined()
    }
  })
})
