import type { IVoucherBookRepository } from '@pdf/repositories/VoucherBookRepository.js'
import { VoucherBookRepository } from '@pdf/repositories/VoucherBookRepository.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { cleanupTestDatabase, createTestDatabase } from '@pika/tests'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Test database
let testDb: { prisma: PrismaClient; container: any; stop: () => Promise<void> }
let repository: IVoucherBookRepository
let testUserId: string

describe('VoucherBookRepository Integration Tests', () => {
  beforeAll(async () => {
    logger.debug('Setting up VoucherBookRepository integration tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_repository_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Create cache service
    const cacheService = new MemoryCacheService(3600)

    await cacheService.connect()

    // Create repository
    repository = new VoucherBookRepository(testDb.prisma, cacheService)

    // Create test user
    testUserId = uuid()
    await testDb.prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })
  }, 120000)

  afterAll(async () => {
    logger.debug('Cleaning up VoucherBookRepository test resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })

  beforeEach(async () => {
    if (testDb?.prisma) {
      // Clear voucher book related tables
      await testDb.prisma.bookDistribution.deleteMany()
      await testDb.prisma.adPlacement.deleteMany()
      await testDb.prisma.voucherBookPage.deleteMany()
      await testDb.prisma.voucherBook.deleteMany()
    }
  })

  describe('create', () => {
    it('should create a voucher book', async () => {
      const bookData = {
        title: 'January 2024 Voucher Book',
        edition: 'January 2024',
        bookType: 'MONTHLY',
        month: 1,
        year: 2024,
        totalPages: 24,
        createdBy: testUserId,
      }

      const result = await repository.create(bookData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.title).toBe(bookData.title)
      expect(result.status).toBe('DRAFT')
      expect(result.createdBy).toBe(testUserId)
    })

    it('should prevent duplicate books with same title and year', async () => {
      const bookData = {
        title: 'Duplicate Book',
        bookType: 'ANNUAL',
        year: 2024,
        totalPages: 50,
        createdBy: testUserId,
      }

      // Create first book
      await repository.create(bookData)

      // Try to create duplicate
      await expect(repository.create(bookData)).rejects.toThrow(
        'already exists',
      )
    })

    it('should store metadata correctly', async () => {
      const metadata = {
        theme: 'Summer Special',
        region: 'North',
        customField: 'value',
      }

      const result = await repository.create({
        title: 'Book with Metadata',
        bookType: 'SPECIAL',
        year: 2024,
        totalPages: 20,
        metadata,
        createdBy: testUserId,
      })

      expect(result.metadata).toEqual(metadata)
    })
  })

  describe('findById', () => {
    let createdBook: any

    beforeEach(async () => {
      createdBook = await repository.create({
        title: 'Test Book',
        bookType: 'MONTHLY',
        month: 2,
        year: 2024,
        totalPages: 24,
        createdBy: testUserId,
      })
    })

    it('should find book by id', async () => {
      const result = await repository.findById(createdBook.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(createdBook.id)
      expect(result?.title).toBe(createdBook.title)
    })

    it('should return null for non-existent id', async () => {
      const result = await repository.findById(uuid())

      expect(result).toBeNull()
    })

    it('should include relations when requested', async () => {
      // Create a page for the book
      await testDb.prisma.voucherBookPage.create({
        data: {
          bookId: createdBook.id,
          pageNumber: 1,
          layoutType: 'COVER',
        },
      })

      const result = await repository.findById(createdBook.id, { pages: true })

      expect(result?.pages).toBeDefined()
      expect(Array.isArray(result?.pages)).toBe(true)
      expect(result?.pages).toHaveLength(1)
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test books
      const books = [
        {
          title: 'January Book',
          bookType: 'MONTHLY',
          month: 1,
          year: 2024,
          status: 'PUBLISHED',
        },
        {
          title: 'February Book',
          bookType: 'MONTHLY',
          month: 2,
          year: 2024,
          status: 'DRAFT',
        },
        {
          title: 'March Book',
          bookType: 'MONTHLY',
          month: 3,
          year: 2024,
          status: 'PUBLISHED',
        },
        {
          title: 'Special Edition',
          bookType: 'SPECIAL',
          year: 2024,
          status: 'DRAFT',
        },
        {
          title: 'Annual Book',
          bookType: 'ANNUAL',
          year: 2023,
          status: 'PUBLISHED',
        },
      ]

      for (const book of books) {
        await testDb.prisma.voucherBook.create({
          data: {
            ...book,
            totalPages: 24,
            createdBy: testUserId,
            updatedBy: testUserId,
            publishedAt: book.status === 'PUBLISHED' ? new Date() : null,
          },
        })
      }
    })

    it('should return paginated results', async () => {
      const result = await repository.findAll({ page: 1, limit: 2 })

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      })
    })

    it('should filter by status', async () => {
      const result = await repository.findAll({ status: 'PUBLISHED' })

      expect(result.data).toHaveLength(3)
      expect(result.data.every((book) => book.status === 'PUBLISHED')).toBe(
        true,
      )
    })

    it('should filter by year', async () => {
      const result = await repository.findAll({ year: 2024 })

      expect(result.data).toHaveLength(4)
      expect(result.data.every((book) => book.year === 2024)).toBe(true)
    })

    it('should filter by month', async () => {
      const result = await repository.findAll({ month: 2 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].month).toBe(2)
    })

    it('should filter by bookType', async () => {
      const result = await repository.findAll({ bookType: 'MONTHLY' })

      expect(result.data).toHaveLength(3)
      expect(result.data.every((book) => book.bookType === 'MONTHLY')).toBe(
        true,
      )
    })

    it('should search by title', async () => {
      const result = await repository.findAll({ search: 'February' })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toContain('February')
    })

    it('should sort results', async () => {
      const resultAsc = await repository.findAll({
        sortBy: 'title',
        sortOrder: 'asc',
      })
      const resultDesc = await repository.findAll({
        sortBy: 'title',
        sortOrder: 'desc',
      })

      expect(resultAsc.data[0].title).toBe('Annual Book')
      expect(resultDesc.data[0].title).toBe('Special Edition')
    })

    it('should filter by hasContent', async () => {
      // Add pages to one book
      const bookWithPages = await testDb.prisma.voucherBook.findFirst({
        where: { title: 'January Book' },
      })

      await testDb.prisma.voucherBookPage.create({
        data: {
          bookId: bookWithPages!.id,
          pageNumber: 1,
          layoutType: 'COVER',
        },
      })

      const withContent = await repository.findAll({ hasContent: true })
      const withoutContent = await repository.findAll({ hasContent: false })

      expect(withContent.data).toHaveLength(1)
      expect(withoutContent.data).toHaveLength(4)
    })

    it('should filter by hasPdf', async () => {
      // Update one book to have PDF
      await testDb.prisma.voucherBook.updateMany({
        where: { title: 'March Book' },
        data: { pdfUrl: 'https://example.com/march.pdf' },
      })

      const withPdf = await repository.findAll({ hasPdf: true })
      const withoutPdf = await repository.findAll({ hasPdf: false })

      expect(withPdf.data).toHaveLength(1)
      expect(withoutPdf.data).toHaveLength(4)
    })
  })

  describe('update', () => {
    let bookToUpdate: any

    beforeEach(async () => {
      bookToUpdate = await repository.create({
        title: 'Book to Update',
        bookType: 'SPECIAL',
        year: 2024,
        totalPages: 20,
        createdBy: testUserId,
      })
    })

    it('should update book properties', async () => {
      const updateData = {
        title: 'Updated Book Title',
        edition: 'Special Edition',
        totalPages: 30,
        updatedBy: testUserId,
      }

      const result = await repository.update(bookToUpdate.id, updateData)

      expect(result.title).toBe(updateData.title)
      expect(result.edition).toBe(updateData.edition)
      expect(result.totalPages).toBe(updateData.totalPages)
      expect(result.updatedBy).toBe(testUserId)
    })

    it('should update status and set publishedAt', async () => {
      const result = await repository.update(bookToUpdate.id, {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: testUserId,
      })

      expect(result.status).toBe('PUBLISHED')
      expect(result.publishedAt).toBeDefined()
    })

    it('should throw error for non-existent book', async () => {
      await expect(
        repository.update(uuid(), { title: 'Updated', updatedBy: testUserId }),
      ).rejects.toThrow('not found')
    })
  })

  describe('delete', () => {
    it('should delete a book', async () => {
      const book = await repository.create({
        title: 'Book to Delete',
        bookType: 'SPECIAL',
        year: 2024,
        totalPages: 20,
        createdBy: testUserId,
      })

      await repository.delete(book.id)

      const result = await repository.findById(book.id)

      expect(result).toBeNull()
    })

    it('should cascade delete related pages', async () => {
      const book = await repository.create({
        title: 'Book with Pages',
        bookType: 'MONTHLY',
        month: 5,
        year: 2024,
        totalPages: 10,
        createdBy: testUserId,
      })

      // Create pages
      await testDb.prisma.voucherBookPage.createMany({
        data: [
          { bookId: book.id, pageNumber: 1, layoutType: 'COVER' },
          { bookId: book.id, pageNumber: 2, layoutType: 'STANDARD' },
        ],
      })

      await repository.delete(book.id)

      const pages = await testDb.prisma.voucherBookPage.findMany({
        where: { bookId: book.id },
      })

      expect(pages).toHaveLength(0)
    })
  })

  describe('findByYearAndMonth', () => {
    beforeEach(async () => {
      // Create books for different months
      for (let month = 1; month <= 6; month++) {
        await repository.create({
          title: `${getMonthName(month)} 2024 Book`,
          bookType: 'MONTHLY',
          month,
          year: 2024,
          totalPages: 24,
          createdBy: testUserId,
        })
      }

      // Create books for different year
      await repository.create({
        title: 'December 2023 Book',
        bookType: 'MONTHLY',
        month: 12,
        year: 2023,
        totalPages: 24,
        createdBy: testUserId,
      })
    })

    it('should find books by year and month', async () => {
      const result = await repository.findByYearAndMonth(2024, 3)

      expect(result).toHaveLength(1)
      expect(result[0].month).toBe(3)
      expect(result[0].year).toBe(2024)
    })

    it('should find all books for a year when month not specified', async () => {
      const result = await repository.findByYearAndMonth(2024)

      expect(result).toHaveLength(6)
      expect(result.every((book) => book.year === 2024)).toBe(true)
    })
  })

  describe('findPublishedBooks', () => {
    beforeEach(async () => {
      // Create mix of published and draft books
      const books = [
        { title: 'Published Jan', status: 'PUBLISHED', month: 1 },
        { title: 'Draft Feb', status: 'DRAFT', month: 2 },
        { title: 'Published Mar', status: 'PUBLISHED', month: 3 },
        { title: 'Ready Apr', status: 'READY_FOR_PRINT', month: 4 },
      ]

      for (const book of books) {
        await testDb.prisma.voucherBook.create({
          data: {
            ...book,
            bookType: 'MONTHLY',
            year: 2024,
            totalPages: 24,
            publishedAt: book.status === 'PUBLISHED' ? new Date() : null,
            createdBy: testUserId,
            updatedBy: testUserId,
          },
        })
      }
    })

    it('should only return published books', async () => {
      const result = await repository.findPublishedBooks({})

      expect(result.data).toHaveLength(2)
      expect(result.data.every((book) => book.status === 'PUBLISHED')).toBe(
        true,
      )
    })

    it('should filter published books by criteria', async () => {
      const result = await repository.findPublishedBooks({ month: 1 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Published Jan')
    })
  })

  describe('updateStatus', () => {
    let book: any

    beforeEach(async () => {
      book = await repository.create({
        title: 'Status Test Book',
        bookType: 'SPECIAL',
        year: 2024,
        totalPages: 20,
        createdBy: testUserId,
      })
    })

    it('should update status to PUBLISHED and set publishedAt', async () => {
      const result = await repository.updateStatus(
        book.id,
        'PUBLISHED',
        testUserId,
      )

      expect(result.status).toBe('PUBLISHED')
      expect(result.publishedAt).toBeDefined()
      expect(result.updatedBy).toBe(testUserId)
    })

    it('should update status without setting publishedAt for non-published status', async () => {
      const result = await repository.updateStatus(
        book.id,
        'READY_FOR_PRINT',
        testUserId,
      )

      expect(result.status).toBe('READY_FOR_PRINT')
      expect(result.publishedAt).toBeNull()
    })
  })

  describe('findBooksForGeneration', () => {
    beforeEach(async () => {
      // Create books in different states
      await testDb.prisma.voucherBook.createMany({
        data: [
          {
            title: 'Ready Book 1',
            bookType: 'MONTHLY',
            year: 2024,
            month: 1,
            status: 'READY_FOR_PRINT',
            totalPages: 24,
            createdBy: testUserId,
            updatedBy: testUserId,
          },
          {
            title: 'Ready Book 2',
            bookType: 'MONTHLY',
            year: 2024,
            month: 2,
            status: 'READY_FOR_PRINT',
            totalPages: 24,
            createdBy: testUserId,
            updatedBy: testUserId,
          },
          {
            title: 'Already Generated',
            bookType: 'MONTHLY',
            year: 2024,
            month: 3,
            status: 'READY_FOR_PRINT',
            pdfUrl: 'https://example.com/generated.pdf',
            totalPages: 24,
            createdBy: testUserId,
            updatedBy: testUserId,
          },
          {
            title: 'Draft Book',
            bookType: 'MONTHLY',
            year: 2024,
            month: 4,
            status: 'DRAFT',
            totalPages: 24,
            createdBy: testUserId,
            updatedBy: testUserId,
          },
        ],
      })
    })

    it('should find books ready for PDF generation', async () => {
      const result = await repository.findBooksForGeneration()

      expect(result).toHaveLength(2)
      expect(result.every((book) => book.status === 'READY_FOR_PRINT')).toBe(
        true,
      )
      expect(result.every((book) => !book.pdfUrl)).toBe(true)
    })
  })
})

// Helper function
function getMonthName(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return months[month - 1]
}
