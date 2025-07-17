import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import supertest from 'supertest'
import type { Express } from 'express'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'

import type { AuthTestClient, E2EAuthHelper } from '@pika/tests'
import { createE2EAuthHelper, createTestDatabase, cleanupTestDatabase, clearTestDatabase } from '@pika/tests'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'

import { createPDFServer } from '@pdf/server.js'
import type { VoucherBookDomain } from '@pika/sdk'

// Mock VoucherServiceClient to avoid BaseServiceClient dependency
vi.mock('@pdf/services/VoucherServiceClient.js', () => ({
  VoucherServiceClient: class MockVoucherServiceClient {
    async getVouchersByIds(ids: string[]) {
      const vouchers = new Map()
      for (const id of ids) {
        vouchers.set(id, {
          id,
          title: { en: 'Test Voucher', es: 'Cupón de Prueba' },
          description: { en: 'Test description', es: 'Descripción de prueba' },
          discountValue: 50,
          discountType: 'PERCENTAGE',
          providerId: 'test-provider-id',
          terms: { en: 'Terms', es: 'Términos' },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
      }
      return vouchers
    }
    
    async getVoucherById(id: string) {
      return {
        id,
        title: { en: 'Test Voucher', es: 'Cupón de Prueba' },
        description: { en: 'Test description', es: 'Descripción de prueba' },
        discountValue: 50,
        discountType: 'PERCENTAGE',
        providerId: 'test-provider-id',
        terms: { en: 'Terms', es: 'Términos' },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    }
  }
}))

// Test database
let testDb: { prisma: PrismaClient; container: any; stop: () => Promise<void> }
let app: { app: Express; server: any }

// Auth helpers
let authHelper: E2EAuthHelper
let adminClient: AuthTestClient
let userClient: AuthTestClient
let businessClient: AuthTestClient
let unauthenticatedClient: AuthTestClient

// Test data
let testBusiness: any
let testLocation: any

describe('PDF Voucher Book Integration Tests', () => {
  beforeAll(async () => {
    logger.debug('Setting up PDF service integration tests...')

    // 1. Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // 2. Create mock cache service
    const mockCacheService = new MemoryCacheService(3600)
    await mockCacheService.connect()

    // 3. Create server
    app = await createPDFServer({
      port: 5028,
      prisma: testDb.prisma,
      cacheService: mockCacheService,
    })

    // 4. Initialize auth helper
    authHelper = createE2EAuthHelper(app)
    await authHelper.createAllTestUsers(testDb.prisma)

    // 5. Get authenticated clients
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    userClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)
    unauthenticatedClient = authHelper.getUnauthenticatedClient()

    // 6. Create test business data
    testBusiness = {
      id: uuid(),
      name: 'Test McDonald\'s',
    }

    testLocation = {
      id: uuid(),
      businessId: testBusiness.id,
      name: 'Downtown Branch',
      address: '123 Main St, Downtown',
    }
  }, 120000)

  afterAll(async () => {
    logger.debug('Cleaning up PDF service test resources...')

    if (authHelper) {
      authHelper.clearTokens()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    if (testDb?.prisma) {
      // Clear database
      await clearTestDatabase(testDb.prisma)

      // Re-create test users
      authHelper.clearTokens()
      await authHelper.createAllTestUsers(testDb.prisma)

      // Re-authenticate
      adminClient = await authHelper.getAdminClient(testDb.prisma)
      userClient = await authHelper.getUserClient(testDb.prisma)
      businessClient = await authHelper.getBusinessClient(testDb.prisma)
    }
  })

  describe('Voucher Book Management', () => {
    describe('POST /api/admin/pdf/voucher-books', () => {
      const validBookData = {
        title: 'January 2024 Voucher Book',
        edition: 'January 2024',
        bookType: 'MONTHLY',
        month: 1,
        year: 2024,
        totalPages: 24,
        coverImageUrl: 'https://example.com/cover.jpg',
        metadata: {
          theme: 'New Year Special',
        },
      }

      it('should create a voucher book as admin', async () => {
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(201)

        expect(response.body).toHaveProperty('data')
        expect(response.body.data).toMatchObject({
          id: expect.any(String),
          title: validBookData.title,
          edition: validBookData.edition,
          bookType: validBookData.bookType,
          month: validBookData.month,
          year: validBookData.year,
          status: 'DRAFT',
          totalPages: validBookData.totalPages,
          createdBy: expect.any(String),
        })
      })

      it('should validate required fields', async () => {
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            // Missing required fields
            bookType: 'MONTHLY',
          })
          .expect(400)

        expect(response.body.error).toBeDefined()
        expect(response.body.error).toContain('validation')
      })

      it('should prevent duplicate books for same month/year', async () => {
        // Create first book
        await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(201)

        // Try to create duplicate
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(409)

        expect(response.body.error).toContain('already exists')
      })

      it('should reject non-admin users', async () => {
        await userClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(403)

        await businessClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(403)
      })

      it('should require authentication', async () => {
        await unauthenticatedClient
          .post('/api/admin/pdf/voucher-books')
          .send(validBookData)
          .expect(401)
      })
    })

    describe('GET /api/admin/pdf/voucher-books', () => {
      let createdBooks: VoucherBookDomain[]

      beforeEach(async () => {
        // Create test books
        createdBooks = []
        for (let month = 1; month <= 3; month++) {
          const response = await adminClient
            .post('/api/admin/pdf/voucher-books')
            .send({
              title: `${getMonthName(month)} 2024 Voucher Book`,
              bookType: 'MONTHLY',
              month,
              year: 2024,
              totalPages: 24,
            })
            .expect(201)
          createdBooks.push(response.body.data)
        }
      })

      it('should list all voucher books with pagination', async () => {
        const response = await adminClient
          .get('/api/admin/pdf/voucher-books')
          .query({ page: 1, limit: 10 })
          .expect(200)

        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data).toHaveLength(3)
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        })
      })

      it('should filter by status', async () => {
        // Publish one book
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${createdBooks[0].id}/publish`)
          .send({ generatePdf: false })
          .expect(200)

        const response = await adminClient
          .get('/api/admin/pdf/voucher-books')
          .query({ status: 'PUBLISHED' })
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].status).toBe('PUBLISHED')
      })

      it('should filter by year and month', async () => {
        const response = await adminClient
          .get('/api/admin/pdf/voucher-books')
          .query({ year: 2024, month: 2 })
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].month).toBe(2)
      })

      it('should include relations when requested', async () => {
        // Add a page to one book
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${createdBooks[0].id}/pages`)
          .send({ pageNumber: 1, layoutType: 'COVER' })
          .expect(201)

        const response = await adminClient
          .get('/api/admin/pdf/voucher-books')
          .query({ include: 'pages' })
          .expect(200)

        expect(response.body.data[0]).toHaveProperty('pages')
        expect(Array.isArray(response.body.data[0].pages)).toBe(true)
      })
    })

    describe('PUT /api/admin/pdf/voucher-books/:id', () => {
      let voucherBook: VoucherBookDomain

      beforeEach(async () => {
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Test Book',
            bookType: 'SPECIAL',
            year: 2024,
            totalPages: 20,
          })
          .expect(201)
        voucherBook = response.body.data
      })

      it('should update voucher book', async () => {
        const updateData = {
          title: 'Updated Test Book',
          edition: 'Special Edition',
          totalPages: 24,
        }

        const response = await adminClient
          .put(`/api/admin/pdf/voucher-books/${voucherBook.id}`)
          .send(updateData)
          .expect(200)

        expect(response.body.data).toMatchObject({
          id: voucherBook.id,
          title: updateData.title,
          edition: updateData.edition,
          totalPages: updateData.totalPages,
        })
      })

      it('should return 404 for non-existent book', async () => {
        const fakeId = uuid()
        await adminClient
          .put(`/api/admin/pdf/voucher-books/${fakeId}`)
          .send({ title: 'Updated' })
          .expect(404)
      })

      it('should track updatedBy', async () => {
        const response = await adminClient
          .put(`/api/admin/pdf/voucher-books/${voucherBook.id}`)
          .send({ title: 'Updated' })
          .expect(200)

        expect(response.body.data.updatedBy).toBeDefined()
      })
    })

    describe('POST /api/admin/pdf/voucher-books/:id/publish', () => {
      let voucherBook: VoucherBookDomain

      beforeEach(async () => {
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Test Book for Publishing',
            bookType: 'MONTHLY',
            month: 5,
            year: 2024,
            totalPages: 24,
          })
          .expect(201)
        voucherBook = response.body.data
      })

      it('should publish a draft book', async () => {
        const response = await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/publish`)
          .send({ generatePdf: false })
          .expect(200)

        expect(response.body.data.status).toBe('PUBLISHED')
        expect(response.body.data.publishedAt).toBeDefined()
      })

      it('should not publish already published book', async () => {
        // First publish
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/publish`)
          .send({ generatePdf: false })
          .expect(200)

        // Try to publish again
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/publish`)
          .send({ generatePdf: false })
          .expect(400)
      })
    })

    describe('DELETE /api/admin/pdf/voucher-books/:id', () => {
      let voucherBook: VoucherBookDomain

      beforeEach(async () => {
        const response = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Book to Delete',
            bookType: 'SPECIAL',
            year: 2024,
            totalPages: 20,
          })
          .expect(201)
        voucherBook = response.body.data
      })

      it('should delete a draft book', async () => {
        await adminClient
          .delete(`/api/admin/pdf/voucher-books/${voucherBook.id}`)
          .expect(204)

        // Verify deleted
        await adminClient
          .get(`/api/admin/pdf/voucher-books/${voucherBook.id}`)
          .expect(404)
      })

      it('should not delete published books', async () => {
        // Publish the book
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/publish`)
          .send({ generatePdf: false })
          .expect(200)

        // Try to delete
        await adminClient
          .delete(`/api/admin/pdf/voucher-books/${voucherBook.id}`)
          .expect(400)
      })
    })
  })

  describe('Page Management', () => {
    let voucherBook: VoucherBookDomain

    beforeEach(async () => {
      const response = await adminClient
        .post('/api/admin/pdf/voucher-books')
        .send({
          title: 'Test Book for Pages',
          bookType: 'MONTHLY',
          month: 6,
          year: 2024,
          totalPages: 24,
        })
        .expect(201)
      voucherBook = response.body.data
    })

    describe('POST /api/admin/pdf/voucher-books/:bookId/pages', () => {
      it('should create a page', async () => {
        const pageData = {
          pageNumber: 1,
          layoutType: 'COVER',
          metadata: { backgroundColor: '#FFFFFF' },
        }

        const response = await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .send(pageData)
          .expect(201)

        expect(response.body.data).toMatchObject({
          id: expect.any(String),
          bookId: voucherBook.id,
          pageNumber: pageData.pageNumber,
          layoutType: pageData.layoutType,
        })
      })

      it('should prevent duplicate page numbers', async () => {
        const pageData = { pageNumber: 1, layoutType: 'STANDARD' }

        // Create first page
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .send(pageData)
          .expect(201)

        // Try to create duplicate
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .send(pageData)
          .expect(409)
      })

      it('should validate page number range', async () => {
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .send({ pageNumber: 25, layoutType: 'STANDARD' }) // Beyond totalPages
          .expect(400)
      })
    })

    describe('GET /api/admin/pdf/voucher-books/:bookId/pages', () => {
      beforeEach(async () => {
        // Create multiple pages
        for (let i = 1; i <= 5; i++) {
          await adminClient
            .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
            .send({
              pageNumber: i,
              layoutType: i === 1 ? 'COVER' : 'STANDARD',
            })
            .expect(201)
        }
      })

      it('should list all pages for a book', async () => {
        const response = await adminClient
          .get(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .expect(200)

        expect(response.body.data).toHaveLength(5)
        expect(response.body.data[0].pageNumber).toBe(1)
        expect(response.body.data[0].layoutType).toBe('COVER')
      })

      it('should include placements when requested', async () => {
        // Add a placement to first page
        const pagesResponse = await adminClient
          .get(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .expect(200)

        const firstPage = pagesResponse.body.data[0]

        await adminClient
          .post(`/api/admin/pdf/pages/${firstPage.id}/placements`)
          .send({
            contentType: 'IMAGE',
            position: 1,
            size: 'FULL',
            imageUrl: 'https://example.com/cover-image.jpg',
          })
          .expect(201)

        // Get pages with placements
        const response = await adminClient
          .get(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
          .query({ include: 'placements' })
          .expect(200)

        expect(response.body.data[0]).toHaveProperty('placements')
        expect(response.body.data[0].placements).toHaveLength(1)
      })
    })
  })

  describe('Content Placement', () => {
    let voucherBook: VoucherBookDomain
    let page: any

    beforeEach(async () => {
      // Create book
      const bookResponse = await adminClient
        .post('/api/admin/pdf/voucher-books')
        .send({
          title: 'Test Book for Placements',
          bookType: 'MONTHLY',
          month: 7,
          year: 2024,
          totalPages: 24,
        })
        .expect(201)
      voucherBook = bookResponse.body.data

      // Create page
      const pageResponse = await adminClient
        .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/pages`)
        .send({ pageNumber: 2, layoutType: 'STANDARD' })
        .expect(201)
      page = pageResponse.body.data
    })

    describe('POST /api/admin/pdf/pages/:pageId/placements', () => {
      it('should create a voucher placement', async () => {
        const placementData = {
          contentType: 'VOUCHER',
          position: 1,
          size: 'QUARTER',
          spacesUsed: 2,
          qrCodePayload: 'eyJhbGciOiJIUzI1NiIs...',
          shortCode: 'JUL24-001',
          title: '20% Off Membership',
          description: 'Valid until July 31, 2024',
        }

        const response = await adminClient
          .post(`/api/admin/pdf/pages/${page.id}/placements`)
          .send(placementData)
          .expect(201)

        expect(response.body.data).toMatchObject({
          id: expect.any(String),
          pageId: page.id,
          contentType: placementData.contentType,
          position: placementData.position,
          size: placementData.size,
          createdBy: expect.any(String),
        })
      })

      it('should create an ad placement', async () => {
        const placementData = {
          contentType: 'AD',
          position: 3,
          size: 'HALF',
          spacesUsed: 4,
          imageUrl: 'https://example.com/ad-banner.jpg',
          title: 'Summer Sale',
          description: 'Up to 50% off on selected items',
        }

        const response = await adminClient
          .post(`/api/admin/pdf/pages/${page.id}/placements`)
          .send(placementData)
          .expect(201)

        expect(response.body.data.contentType).toBe('AD')
        expect(response.body.data.imageUrl).toBe(placementData.imageUrl)
      })

      it('should validate position conflicts', async () => {
        // Create first placement
        await adminClient
          .post(`/api/admin/pdf/pages/${page.id}/placements`)
          .send({
            contentType: 'VOUCHER',
            position: 1,
            size: 'SINGLE',
            spacesUsed: 1,
          })
          .expect(201)

        // Try to create conflicting placement
        await adminClient
          .post(`/api/admin/pdf/pages/${page.id}/placements`)
          .send({
            contentType: 'VOUCHER',
            position: 1, // Same position
            size: 'SINGLE',
            spacesUsed: 1,
          })
          .expect(409)
      })

      it('should validate space availability', async () => {
        // Fill page with placements (8 spaces total)
        for (let i = 1; i <= 8; i++) {
          await adminClient
            .post(`/api/admin/pdf/pages/${page.id}/placements`)
            .send({
              contentType: 'VOUCHER',
              position: i,
              size: 'SINGLE',
              spacesUsed: 1,
            })
            .expect(201)
        }

        // Try to add one more
        await adminClient
          .post(`/api/admin/pdf/pages/${page.id}/placements`)
          .send({
            contentType: 'VOUCHER',
            position: 9,
            size: 'SINGLE',
            spacesUsed: 1,
          })
          .expect(400)
      })
    })
  })

  describe('Book Distribution', () => {
    let voucherBook: VoucherBookDomain

    beforeEach(async () => {
      // Create and publish a book
      const bookResponse = await adminClient
        .post('/api/admin/pdf/voucher-books')
        .send({
          title: 'Test Book for Distribution',
          bookType: 'MONTHLY',
          month: 8,
          year: 2024,
          totalPages: 24,
        })
        .expect(201)
      voucherBook = bookResponse.body.data

      // Publish it
      await adminClient
        .post(`/api/admin/pdf/voucher-books/${voucherBook.id}/publish`)
        .send({ generatePdf: false })
        .expect(200)
    })

    describe('POST /api/admin/pdf/distributions', () => {
      it('should create a distribution', async () => {
        const distributionData = {
          bookId: voucherBook.id,
          businessId: testBusiness.id,
          businessName: testBusiness.name,
          locationId: testLocation.id,
          locationName: testLocation.name,
          quantity: 500,
          distributionType: 'initial',
          contactName: 'John Smith',
          contactEmail: 'john@mcdonalds.com',
          contactPhone: '+1234567890',
          deliveryAddress: testLocation.address,
          notes: 'Deliver to loading dock',
        }

        const response = await adminClient
          .post('/api/admin/pdf/distributions')
          .send(distributionData)
          .expect(201)

        expect(response.body.data).toMatchObject({
          id: expect.any(String),
          bookId: voucherBook.id,
          businessId: testBusiness.id,
          businessName: testBusiness.name,
          status: 'pending',
          quantity: distributionData.quantity,
          createdBy: expect.any(String),
        })
      })

      it('should only allow distribution of published books', async () => {
        // Create unpublished book
        const unpublishedResponse = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Unpublished Book',
            bookType: 'SPECIAL',
            year: 2024,
            totalPages: 20,
          })
          .expect(201)

        await adminClient
          .post('/api/admin/pdf/distributions')
          .send({
            bookId: unpublishedResponse.body.data.id,
            businessId: testBusiness.id,
            businessName: testBusiness.name,
            quantity: 100,
            distributionType: 'initial',
            contactName: 'Jane Doe',
          })
          .expect(400)
      })
    })

    describe('PUT /api/admin/pdf/distributions/:id/ship', () => {
      let distribution: any

      beforeEach(async () => {
        const response = await adminClient
          .post('/api/admin/pdf/distributions')
          .send({
            bookId: voucherBook.id,
            businessId: testBusiness.id,
            businessName: testBusiness.name,
            quantity: 300,
            distributionType: 'initial',
            contactName: 'Jane Doe',
            contactEmail: 'jane@business.com',
          })
          .expect(201)
        distribution = response.body.data
      })

      it('should mark distribution as shipped', async () => {
        const response = await adminClient
          .put(`/api/admin/pdf/distributions/${distribution.id}/ship`)
          .send({
            trackingNumber: 'TRK123456789',
            shippingCarrier: 'FedEx',
          })
          .expect(200)

        expect(response.body.data.status).toBe('shipped')
        expect(response.body.data.trackingNumber).toBe('TRK123456789')
        expect(response.body.data.shippingCarrier).toBe('FedEx')
        expect(response.body.data.shippedAt).toBeDefined()
      })
    })

    describe('PUT /api/admin/pdf/distributions/:id/deliver', () => {
      let distribution: any

      beforeEach(async () => {
        // Create and ship a distribution
        const createResponse = await adminClient
          .post('/api/admin/pdf/distributions')
          .send({
            bookId: voucherBook.id,
            businessId: testBusiness.id,
            businessName: testBusiness.name,
            quantity: 200,
            distributionType: 'reorder',
            contactName: 'Bob Manager',
          })
          .expect(201)
        distribution = createResponse.body.data

        // Ship it
        await adminClient
          .put(`/api/admin/pdf/distributions/${distribution.id}/ship`)
          .send({
            trackingNumber: 'TRK987654321',
            shippingCarrier: 'UPS',
          })
          .expect(200)
      })

      it('should mark distribution as delivered', async () => {
        const response = await adminClient
          .put(`/api/admin/pdf/distributions/${distribution.id}/deliver`)
          .expect(200)

        expect(response.body.data.status).toBe('delivered')
        expect(response.body.data.deliveredAt).toBeDefined()
      })

      it('should not deliver unshipped distribution', async () => {
        // Create new distribution (not shipped)
        const newDistResponse = await adminClient
          .post('/api/admin/pdf/distributions')
          .send({
            bookId: voucherBook.id,
            businessId: testBusiness.id,
            businessName: testBusiness.name,
            quantity: 100,
            distributionType: 'replacement',
            contactName: 'Alice Admin',
          })
          .expect(201)

        await adminClient
          .put(`/api/admin/pdf/distributions/${newDistResponse.body.data.id}/deliver`)
          .expect(400)
      })
    })

    describe('GET /api/admin/pdf/distributions', () => {
      beforeEach(async () => {
        // Create multiple distributions
        const distributions = [
          { businessName: 'McDonald\'s', quantity: 500, status: 'delivered' },
          { businessName: 'Burger King', quantity: 300, status: 'shipped' },
          { businessName: 'KFC', quantity: 200, status: 'pending' },
        ]

        for (const dist of distributions) {
          const response = await adminClient
            .post('/api/admin/pdf/distributions')
            .send({
              bookId: voucherBook.id,
              businessId: uuid(),
              businessName: dist.businessName,
              quantity: dist.quantity,
              distributionType: 'initial',
              contactName: 'Manager',
            })
            .expect(201)

          // Update status if needed
          if (dist.status === 'shipped' || dist.status === 'delivered') {
            await adminClient
              .put(`/api/admin/pdf/distributions/${response.body.data.id}/ship`)
              .send({ trackingNumber: 'TRK' + Date.now(), shippingCarrier: 'FedEx' })
              .expect(200)
          }

          if (dist.status === 'delivered') {
            await adminClient
              .put(`/api/admin/pdf/distributions/${response.body.data.id}/deliver`)
              .expect(200)
          }
        }
      })

      it('should list distributions with filters', async () => {
        const response = await adminClient
          .get('/api/admin/pdf/distributions')
          .query({ status: 'shipped' })
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].status).toBe('shipped')
      })

      it('should get distribution statistics', async () => {
        const response = await adminClient
          .get(`/api/admin/pdf/distributions/stats`)
          .query({ bookId: voucherBook.id })
          .expect(200)

        expect(response.body).toMatchObject({
          totalDistributions: 3,
          totalQuantity: 1000,
          statusBreakdown: {
            pending: 1,
            shipped: 1,
            delivered: 1,
            cancelled: 0,
          },
        })
      })
    })
  })

  describe('Public API', () => {
    let publishedBook: VoucherBookDomain
    let draftBook: VoucherBookDomain

    beforeEach(async () => {
      // Create draft book
      const draftResponse = await adminClient
        .post('/api/admin/pdf/voucher-books')
        .send({
          title: 'Draft Book',
          bookType: 'MONTHLY',
          month: 9,
          year: 2024,
          totalPages: 24,
        })
        .expect(201)
      draftBook = draftResponse.body.data

      // Create and publish book
      const publishResponse = await adminClient
        .post('/api/admin/pdf/voucher-books')
        .send({
          title: 'Published Book',
          bookType: 'MONTHLY',
          month: 10,
          year: 2024,
          totalPages: 24,
          pdfUrl: 'https://example.com/published-book.pdf',
        })
        .expect(201)
      publishedBook = publishResponse.body.data

      await adminClient
        .post(`/api/admin/pdf/voucher-books/${publishedBook.id}/publish`)
        .send({ generatePdf: false })
        .expect(200)
    })

    describe('GET /api/pdf/voucher-books', () => {
      it('should only return published books', async () => {
        const response = await userClient
          .get('/api/pdf/voucher-books')
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].id).toBe(publishedBook.id)
        expect(response.body.data[0].status).toBe('PUBLISHED')
      })

      it('should not require authentication', async () => {
        await unauthenticatedClient
          .get('/api/pdf/voucher-books')
          .expect(200)
      })

      it('should filter by year and month', async () => {
        const response = await userClient
          .get('/api/pdf/voucher-books')
          .query({ year: 2024, month: 10 })
          .expect(200)

        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].month).toBe(10)
      })
    })

    describe('GET /api/pdf/voucher-books/:id', () => {
      it('should return published book details', async () => {
        const response = await userClient
          .get(`/api/pdf/voucher-books/${publishedBook.id}`)
          .expect(200)

        expect(response.body.data.id).toBe(publishedBook.id)
      })

      it('should not return draft books', async () => {
        await userClient
          .get(`/api/pdf/voucher-books/${draftBook.id}`)
          .expect(404)
      })
    })

    describe('GET /api/pdf/voucher-books/:id/download', () => {
      it('should provide download info for published books', async () => {
        const response = await userClient
          .get(`/api/pdf/voucher-books/${publishedBook.id}/download`)
          .expect(200)

        expect(response.body).toMatchObject({
          url: expect.any(String),
          filename: expect.any(String),
          contentType: 'application/pdf',
        })
      })

      it('should not download draft books', async () => {
        await userClient
          .get(`/api/pdf/voucher-books/${draftBook.id}/download`)
          .expect(404)
      })
    })
  })

  describe('Error Scenarios', () => {
    describe('Invalid UUIDs', () => {
      it('should return 400 for invalid UUID formats', async () => {
        await adminClient
          .get('/api/admin/pdf/voucher-books/not-a-uuid')
          .expect(400)

        await adminClient
          .put('/api/admin/pdf/voucher-books/12345/update')
          .send({ title: 'Updated' })
          .expect(400)
      })
    })

    describe('Concurrent Operations', () => {
      it('should handle concurrent page creation', async () => {
        const bookResponse = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Concurrent Test Book',
            bookType: 'SPECIAL',
            year: 2024,
            totalPages: 10,
          })
          .expect(201)

        const bookId = bookResponse.body.data.id

        // Try to create same page number concurrently
        const promises = Array(5).fill(null).map(() =>
          adminClient
            .post(`/api/admin/pdf/voucher-books/${bookId}/pages`)
            .send({ pageNumber: 1, layoutType: 'STANDARD' })
        )

        const results = await Promise.allSettled(promises)
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201)
        const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 409)

        expect(successful).toHaveLength(1) // Only one should succeed
        expect(failed).toHaveLength(4) // Others should get conflict error
      })
    })

    describe('Business Logic Validation', () => {
      it('should prevent archiving books with active distributions', async () => {
        // Create and publish book
        const bookResponse = await adminClient
          .post('/api/admin/pdf/voucher-books')
          .send({
            title: 'Book with Distribution',
            bookType: 'ANNUAL',
            year: 2024,
            totalPages: 50,
          })
          .expect(201)

        const bookId = bookResponse.body.data.id

        await adminClient
          .post(`/api/admin/pdf/voucher-books/${bookId}/publish`)
          .send({ generatePdf: false })
          .expect(200)

        // Create active distribution
        await adminClient
          .post('/api/admin/pdf/distributions')
          .send({
            bookId,
            businessId: testBusiness.id,
            businessName: testBusiness.name,
            quantity: 1000,
            distributionType: 'initial',
            contactName: 'Manager',
          })
          .expect(201)

        // Try to archive book
        await adminClient
          .post(`/api/admin/pdf/voucher-books/${bookId}/archive`)
          .expect(400)
      })
    })
  })
})

// Helper functions
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return months[month - 1]
}