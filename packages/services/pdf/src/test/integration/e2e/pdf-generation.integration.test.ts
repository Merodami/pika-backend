import { PageLayoutEngine } from '@pdf-write/infrastructure/services/PageLayoutEngine.js'
import { PDFGenerationService } from '@pdf-write/infrastructure/services/PDFGenerationService.js'
import { QRCodeService } from '@pdf-write/infrastructure/services/QRCodeService.js'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import { PrismaClient, VoucherBookStatus } from '@prisma/client'
import { randomUUID } from 'crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('PDF Generation Integration Tests', () => {
  let testDb: TestDatabaseResult
  let prisma: PrismaClient
  let pdfGenerationService: PDFGenerationService
  let pageLayoutEngine: PageLayoutEngine
  let qrCodeService: QRCodeService
  let testUser: any

  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase()
    prisma = testDb.prisma

    // Initialize services
    pdfGenerationService = new PDFGenerationService()
    pageLayoutEngine = new PageLayoutEngine()
    qrCodeService = new QRCodeService()
  })

  beforeEach(async () => {
    // Clear test database
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)

      // Create a test user for createdBy field
      testUser = await prisma.user.create({
        data: {
          email: 'pdf-test@example.com',
          firstName: 'PDF',
          lastName: 'Test',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
        },
      })
    }
  })

  afterAll(async () => {
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })

  describe('QR Code Generation', () => {
    it('should generate QR code as SVG', async () => {
      const testData = 'https://pika.com/voucher/123'
      const svg = await qrCodeService.generateSVG(testData)

      expect(svg).toBeDefined()
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })

    it('should generate QR code as PNG buffer', async () => {
      const testData = 'https://pika.com/voucher/123'
      const buffer = await qrCodeService.generatePNG(testData)

      expect(buffer).toBeDefined()
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })

    it('should generate QR code with different sizes based on ad placement', () => {
      expect(qrCodeService.getOptimalQRSize('SINGLE')).toBe(150)
      expect(qrCodeService.getOptimalQRSize('QUARTER')).toBe(200)
      expect(qrCodeService.getOptimalQRSize('HALF')).toBe(250)
      expect(qrCodeService.getOptimalQRSize('FULL')).toBe(300)
    })
  })

  describe('Page Layout Engine', () => {
    it('should calculate required spaces for each ad size', () => {
      expect(pageLayoutEngine.getRequiredSpaces('SINGLE')).toBe(1)
      expect(pageLayoutEngine.getRequiredSpaces('QUARTER')).toBe(2)
      expect(pageLayoutEngine.getRequiredSpaces('HALF')).toBe(4)
      expect(pageLayoutEngine.getRequiredSpaces('FULL')).toBe(8)
    })

    it('should validate ad placement positions', () => {
      const occupiedSpaces = new Set<number>()

      // Full page must start at position 1
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 1, 'FULL')).toBe(true)
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 2, 'FULL')).toBe(false)

      // Half page must start at position 1 or 5
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 1, 'HALF')).toBe(true)
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 5, 'HALF')).toBe(true)
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 3, 'HALF')).toBe(false)

      // Quarter page must align properly
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 1, 'QUARTER')).toBe(
        true,
      )
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 3, 'QUARTER')).toBe(
        true,
      )
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 2, 'QUARTER')).toBe(
        false,
      )
    })

    it('should detect overlapping placements', () => {
      const occupiedSpaces = new Set([1, 2, 3, 4]) // Top half occupied

      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 1, 'SINGLE')).toBe(
        false,
      )
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 5, 'SINGLE')).toBe(
        true,
      )
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 1, 'HALF')).toBe(false)
      expect(pageLayoutEngine.canPlaceAd(occupiedSpaces, 5, 'HALF')).toBe(true)
    })

    it('should find available positions for ads', () => {
      const occupiedSpaces = new Set([1, 2]) // First quarter occupied

      expect(
        pageLayoutEngine.findAvailablePosition(occupiedSpaces, 'SINGLE'),
      ).toBe(3)
      expect(
        pageLayoutEngine.findAvailablePosition(occupiedSpaces, 'QUARTER'),
      ).toBe(3)
      expect(
        pageLayoutEngine.findAvailablePosition(occupiedSpaces, 'HALF'),
      ).toBe(5)

      // Full page with any occupation returns null
      occupiedSpaces.add(3)
      expect(
        pageLayoutEngine.findAvailablePosition(occupiedSpaces, 'FULL'),
      ).toBeNull()
    })
  })

  describe('PDF Generation', () => {
    it('should generate a simple PDF with voucher placements', async () => {
      // Create test data
      const bookId = randomUUID()
      const voucherId = randomUUID()
      const providerId = randomUUID()
      const categoryId = randomUUID()
      const userId = randomUUID()

      // Create a user first (required for provider)
      await prisma.user.create({
        data: {
          id: userId,
          email: 'test@provider.com',
          role: 'PROVIDER',
          firstName: 'Test',
          lastName: 'Provider',
          status: 'ACTIVE',
        },
      })

      // Create a category
      await prisma.category.create({
        data: {
          id: categoryId,
          name: { en: 'Test Category' },
          description: { en: 'Test Category Description' },
          slug: 'test-category',
          sortOrder: 1,
          active: true,
        },
      })

      // Create a provider with all required fields
      await prisma.provider.create({
        data: {
          id: providerId,
          userId: userId,
          businessName: { en: 'Test Provider' },
          businessDescription: { en: 'Test Provider Description' },
          categoryId: categoryId,
          verified: false,
          active: true,
        },
      })

      // Create a voucher
      await prisma.voucher.create({
        data: {
          id: voucherId,
          providerId: providerId,
          categoryId: categoryId,
          title: { en: 'Test Voucher' },
          description: { en: 'Test Description' },
          terms: { en: 'Test terms and conditions' },
          discountType: 'PERCENTAGE',
          discountValue: 10,
          validFrom: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          state: 'PUBLISHED',
        },
      })

      // Create voucher book
      const book = await prisma.voucherBook.create({
        data: {
          id: bookId,
          title: 'Test Voucher Book',
          year: 2024,
          month: 1,
          status: VoucherBookStatus.DRAFT,
          totalPages: 1,
          createdBy: testUser.id,
        },
      })

      // Create a page
      const page = await prisma.voucherBookPage.create({
        data: {
          id: randomUUID(),
          bookId: book.id,
          pageNumber: 1,
          layoutType: 'STANDARD',
        },
      })

      // Create an ad placement
      await prisma.adPlacement.create({
        data: {
          id: randomUUID(),
          pageId: page.id,
          position: 1,
          size: 'SINGLE',
          spacesUsed: 1,
          contentType: 'VOUCHER',
          voucherId: voucherId,
          shortCode: 'TEST123',
        },
      })

      // Create page layout
      const pageLayout = pageLayoutEngine.createEmptyPage(1)

      pageLayoutEngine.allocateSpace(pageLayout, {
        id: randomUUID(),
        size: 'SINGLE',
        contentType: 'VOUCHER',
        voucherId: voucherId,
        shortCode: 'TEST123',
      })

      // Prepare test voucher data
      const vouchers = new Map([
        [
          voucherId,
          {
            id: voucherId,
            title: 'Test Voucher',
            description: '50% off',
            discount: '50% OFF',
            businessName: 'Test Business',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        ],
      ])

      const qrPayloads = new Map([
        [voucherId, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'], // Mock JWT
      ])

      // Generate PDF
      const pdfBuffer = await pdfGenerationService.generateVoucherBookPDF({
        bookId: book.id,
        title: book.title,
        month: book.month!,
        year: book.year,
        pages: [pageLayout],
        vouchers,
        qrPayloads,
      })

      expect(pdfBuffer).toBeDefined()
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(1000) // Should have some content

      // Verify PDF starts with correct header
      const pdfHeader = pdfBuffer.toString('utf8', 0, 5)

      expect(pdfHeader).toBe('%PDF-')
    })

    it('should handle multiple ad placements on a page', async () => {
      const pageLayout = pageLayoutEngine.createEmptyPage(1)

      // Add multiple placements
      const placements = [
        {
          size: 'HALF' as const,
          contentType: 'VOUCHER' as const,
          voucherId: 'v1',
        },
        {
          size: 'QUARTER' as const,
          contentType: 'IMAGE' as const,
          designUrl: 'http://example.com/ad1.jpg',
        },
        { size: 'SINGLE' as const, contentType: 'AD' as const },
        { size: 'SINGLE' as const, contentType: 'SPONSORED' as const },
      ]

      for (const placement of placements) {
        pageLayoutEngine.allocateSpace(pageLayout, {
          id: randomUUID(),
          ...placement,
        })
      }

      expect(pageLayout.placements).toHaveLength(4)
      expect(pageLayout.occupiedSpaces.size).toBe(8) // All spaces should be occupied
      expect(pageLayout.availableSpaces).toHaveLength(0)
    })
  })

  describe('Page Layout Validation', () => {
    it('should validate correct page layouts', () => {
      const pageLayout = pageLayoutEngine.createEmptyPage(1)

      pageLayoutEngine.allocateSpace(pageLayout, {
        id: '1',
        size: 'HALF',
        contentType: 'VOUCHER',
      })

      pageLayoutEngine.allocateSpace(pageLayout, {
        id: '2',
        size: 'HALF',
        contentType: 'VOUCHER',
      })

      const validation = pageLayoutEngine.validatePageLayout(pageLayout)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should calculate correct bounds for placements', () => {
      const placement = {
        id: '1',
        position: 1,
        size: 'SINGLE' as const,
        spacesUsed: 1,
        contentType: 'VOUCHER' as const,
      }

      const bounds = pageLayoutEngine.calculateBounds(
        placement,
        420, // A5 width
        595, // A5 height
        20, // margin
      )

      expect(bounds.x).toBeGreaterThan(0)
      expect(bounds.y).toBeGreaterThan(0)
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.height).toBeGreaterThan(0)
    })
  })
})
