import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { cleanupTestDatabase, createTestDatabase } from '@pika/tests'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { IBookDistributionRepository } from '../../../repositories/BookDistributionRepository.js'
import { BookDistributionRepository } from '../../../repositories/BookDistributionRepository.js'

// Test database
let testDb: { prisma: PrismaClient; container: any; stop: () => Promise<void> }
let repository: IBookDistributionRepository
let testUserId: string
let testBookId: string
let testBusinessId: string
let testLocationId: string

describe('BookDistributionRepository Integration Tests', () => {
  beforeAll(async () => {
    logger.debug('Setting up BookDistributionRepository integration tests...')

    // Create test database
    testDb = await createTestDatabase({
      databaseName: 'test_pdf_distribution_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Create cache service
    const cacheService = new MemoryCacheService(3600)

    await cacheService.connect()

    // Create repository
    repository = new BookDistributionRepository(testDb.prisma, cacheService)

    // Create test data
    testUserId = uuid()
    testBookId = uuid()
    testBusinessId = uuid()
    testLocationId = uuid()

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

    await testDb.prisma.voucherBook.create({
      data: {
        id: testBookId,
        title: 'Test Voucher Book',
        bookType: 'MONTHLY',
        month: 1,
        year: 2024,
        status: 'PUBLISHED',
        totalPages: 24,
        publishedAt: new Date(),
        createdBy: testUserId,
        updatedBy: testUserId,
      },
    })
  }, 120000)

  beforeEach(async () => {
    if (testDb?.prisma) {
      // Clear distribution tables
      await testDb.prisma.bookDistribution.deleteMany()
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up BookDistributionRepository test resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })

  describe('create', () => {
    it('should create a book distribution', async () => {
      const distributionData = {
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: "McDonald's Corporation",
        locationId: testLocationId,
        locationName: 'Downtown Branch',
        quantity: 500,
        distributionType: 'initial',
        contactName: 'John Smith',
        contactEmail: 'john.smith@mcdonalds.com',
        contactPhone: '+1234567890',
        deliveryAddress: '123 Main St, Downtown, City 12345',
        notes: 'Deliver to loading dock. Contact security on arrival.',
        metadata: {
          priority: 'high',
          deliveryInstructions: 'Morning delivery preferred',
        },
        createdBy: testUserId,
      }

      const result = await repository.create(distributionData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.bookId).toBe(testBookId)
      expect(result.businessId).toBe(testBusinessId)
      expect(result.businessName).toBe("McDonald's Corporation")
      expect(result.locationId).toBe(testLocationId)
      expect(result.locationName).toBe('Downtown Branch')
      expect(result.quantity).toBe(500)
      expect(result.distributionType).toBe('initial')
      expect(result.status).toBe('pending')
      expect(result.contactName).toBe('John Smith')
      expect(result.createdBy).toBe(testUserId)
    })

    it('should create distribution without location', async () => {
      const distributionData = {
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Burger King',
        quantity: 300,
        distributionType: 'reorder',
        contactName: 'Jane Doe',
        contactEmail: 'jane@burgerking.com',
        createdBy: testUserId,
      }

      const result = await repository.create(distributionData)

      expect(result.businessName).toBe('Burger King')
      expect(result.locationId).toBeNull()
      expect(result.locationName).toBeNull()
      expect(result.distributionType).toBe('reorder')
    })
  })

  describe('findById', () => {
    let createdDistribution: any

    beforeEach(async () => {
      createdDistribution = await repository.create({
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Test Business',
        quantity: 200,
        distributionType: 'initial',
        contactName: 'Test Contact',
        createdBy: testUserId,
      })
    })

    it('should find distribution by id', async () => {
      const result = await repository.findById(createdDistribution.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(createdDistribution.id)
      expect(result?.businessName).toBe('Test Business')
    })

    it('should return null for non-existent id', async () => {
      const result = await repository.findById(uuid())

      expect(result).toBeNull()
    })

    it('should include relations when requested', async () => {
      const result = await repository.findById(createdDistribution.id, {
        book: true,
      })

      expect(result?.book).toBeDefined()
      expect(result?.book?.title).toBe('Test Voucher Book')
    })
  })

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test distributions
      const distributions = [
        {
          businessName: "McDonald's",
          locationName: 'Branch A',
          quantity: 500,
          distributionType: 'initial',
          status: 'delivered',
        },
        {
          businessName: 'Burger King',
          locationName: 'Branch B',
          quantity: 300,
          distributionType: 'reorder',
          status: 'shipped',
        },
        {
          businessName: 'KFC',
          locationName: 'Branch C',
          quantity: 200,
          distributionType: 'replacement',
          status: 'pending',
        },
        {
          businessName: "McDonald's",
          locationName: 'Branch D',
          quantity: 400,
          distributionType: 'initial',
          status: 'pending',
        },
      ]

      for (const dist of distributions) {
        await testDb.prisma.bookDistribution.create({
          data: {
            bookId: testBookId,
            businessId: uuid(),
            businessName: dist.businessName,
            locationId: uuid(),
            locationName: dist.locationName,
            quantity: dist.quantity,
            distributionType: dist.distributionType,
            status: dist.status,
            contactName: 'Manager',
            createdBy: testUserId,
            updatedBy: testUserId,
            shippedAt:
              dist.status === 'shipped' || dist.status === 'delivered'
                ? new Date()
                : null,
            deliveredAt: dist.status === 'delivered' ? new Date() : null,
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
        total: 4,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      })
    })

    it('should filter by status', async () => {
      const result = await repository.findAll({ status: 'pending' })

      expect(result.data).toHaveLength(2)
      expect(result.data.every((dist) => dist.status === 'pending')).toBe(true)
    })

    it('should filter by businessId', async () => {
      // Create distribution with known businessId
      const knownBusinessId = uuid()

      await testDb.prisma.bookDistribution.create({
        data: {
          bookId: testBookId,
          businessId: knownBusinessId,
          businessName: 'Specific Business',
          quantity: 100,
          distributionType: 'initial',
          contactName: 'Manager',
          createdBy: testUserId,
          updatedBy: testUserId,
        },
      })

      const result = await repository.findAll({ businessId: knownBusinessId })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].businessId).toBe(knownBusinessId)
    })

    it('should filter by distributionType', async () => {
      const result = await repository.findAll({ distributionType: 'initial' })

      expect(result.data).toHaveLength(2)
      expect(
        result.data.every((dist) => dist.distributionType === 'initial'),
      ).toBe(true)
    })

    it('should sort results', async () => {
      const resultAsc = await repository.findAll({
        sortBy: 'businessName',
        sortOrder: 'asc',
      })
      const resultDesc = await repository.findAll({
        sortBy: 'businessName',
        sortOrder: 'desc',
      })

      expect(resultAsc.data[0].businessName).toBe('Burger King')
      expect(resultDesc.data[0].businessName).toBe("McDonald's")
    })

    it('should sort by quantity', async () => {
      const result = await repository.findAll({
        sortBy: 'quantity',
        sortOrder: 'desc',
      })

      expect(result.data[0].quantity).toBe(500)
      expect(result.data[result.data.length - 1].quantity).toBe(200)
    })
  })

  describe('update', () => {
    let distributionToUpdate: any

    beforeEach(async () => {
      distributionToUpdate = await repository.create({
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Business to Update',
        quantity: 250,
        distributionType: 'initial',
        contactName: 'Original Contact',
        contactEmail: 'original@business.com',
        createdBy: testUserId,
      })
    })

    it('should update distribution properties', async () => {
      const updateData = {
        contactName: 'Updated Contact',
        contactEmail: 'updated@business.com',
        contactPhone: '+9876543210',
        quantity: 350,
        notes: 'Updated delivery instructions',
        updatedBy: testUserId,
      }

      const result = await repository.update(
        distributionToUpdate.id,
        updateData,
      )

      expect(result.contactName).toBe(updateData.contactName)
      expect(result.contactEmail).toBe(updateData.contactEmail)
      expect(result.contactPhone).toBe(updateData.contactPhone)
      expect(result.quantity).toBe(updateData.quantity)
      expect(result.notes).toBe(updateData.notes)
      expect(result.updatedBy).toBe(testUserId)
    })

    it('should update status and shipping info', async () => {
      const updateData = {
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber: 'TRK123456789',
        shippingCarrier: 'FedEx',
        updatedBy: testUserId,
      }

      const result = await repository.update(
        distributionToUpdate.id,
        updateData,
      )

      expect(result.status).toBe('shipped')
      expect(result.shippedAt).toBeDefined()
      expect(result.trackingNumber).toBe('TRK123456789')
      expect(result.shippingCarrier).toBe('FedEx')
    })

    it('should throw error for non-existent distribution', async () => {
      await expect(
        repository.update(uuid(), {
          contactName: 'Updated',
          updatedBy: testUserId,
        }),
      ).rejects.toThrow('not found')
    })
  })

  describe('findByBusiness', () => {
    let businessId1: string
    let businessId2: string
    let locationId1: string
    let locationId2: string

    beforeEach(async () => {
      businessId1 = uuid()
      businessId2 = uuid()
      locationId1 = uuid()
      locationId2 = uuid()

      // Create distributions for business 1
      await repository.create({
        bookId: testBookId,
        businessId: businessId1,
        businessName: 'Business One',
        locationId: locationId1,
        locationName: 'Location A',
        quantity: 100,
        distributionType: 'initial',
        contactName: 'Contact A',
        createdBy: testUserId,
      })

      await repository.create({
        bookId: testBookId,
        businessId: businessId1,
        businessName: 'Business One',
        locationId: locationId2,
        locationName: 'Location B',
        quantity: 150,
        distributionType: 'reorder',
        contactName: 'Contact B',
        createdBy: testUserId,
      })

      // Create distribution for business 2
      await repository.create({
        bookId: testBookId,
        businessId: businessId2,
        businessName: 'Business Two',
        quantity: 200,
        distributionType: 'initial',
        contactName: 'Contact C',
        createdBy: testUserId,
      })
    })

    it('should find all distributions for a business', async () => {
      const result = await repository.findByBusiness(businessId1)

      expect(result).toHaveLength(2)
      expect(result.every((dist) => dist.businessId === businessId1)).toBe(true)
    })

    it('should find distributions for specific location', async () => {
      const result = await repository.findByBusiness(businessId1, locationId1)

      expect(result).toHaveLength(1)
      expect(result[0].locationId).toBe(locationId1)
      expect(result[0].locationName).toBe('Location A')
    })

    it('should return empty array for non-existent business', async () => {
      const result = await repository.findByBusiness(uuid())

      expect(result).toHaveLength(0)
    })
  })

  describe('updateStatus', () => {
    let distribution: any

    beforeEach(async () => {
      distribution = await repository.create({
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Status Test Business',
        quantity: 300,
        distributionType: 'initial',
        contactName: 'Status Contact',
        createdBy: testUserId,
      })
    })

    it('should update status', async () => {
      const result = await repository.updateStatus(
        distribution.id,
        'shipped',
        testUserId,
      )

      expect(result.status).toBe('shipped')
      expect(result.updatedBy).toBe(testUserId)
    })
  })

  describe('markAsShipped', () => {
    let distribution: any

    beforeEach(async () => {
      distribution = await repository.create({
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Shipping Test Business',
        quantity: 400,
        distributionType: 'reorder',
        contactName: 'Shipping Contact',
        createdBy: testUserId,
      })
    })

    it('should mark distribution as shipped with tracking info', async () => {
      const result = await repository.markAsShipped(
        distribution.id,
        'TRK987654321',
        'UPS',
        testUserId,
      )

      expect(result.status).toBe('shipped')
      expect(result.trackingNumber).toBe('TRK987654321')
      expect(result.shippingCarrier).toBe('UPS')
      expect(result.shippedAt).toBeDefined()
      expect(result.updatedBy).toBe(testUserId)
    })
  })

  describe('markAsDelivered', () => {
    let shippedDistribution: any

    beforeEach(async () => {
      const distribution = await repository.create({
        bookId: testBookId,
        businessId: testBusinessId,
        businessName: 'Delivery Test Business',
        quantity: 350,
        distributionType: 'replacement',
        contactName: 'Delivery Contact',
        createdBy: testUserId,
      })

      shippedDistribution = await repository.markAsShipped(
        distribution.id,
        'TRK111222333',
        'DHL',
        testUserId,
      )
    })

    it('should mark distribution as delivered', async () => {
      const result = await repository.markAsDelivered(
        shippedDistribution.id,
        testUserId,
      )

      expect(result.status).toBe('delivered')
      expect(result.deliveredAt).toBeDefined()
      expect(result.updatedBy).toBe(testUserId)
    })
  })

  describe('getDistributionStats', () => {
    beforeEach(async () => {
      // Create distributions with different statuses and types
      const distributions = [
        {
          status: 'pending',
          quantity: 100,
          distributionType: 'initial',
          businessId: uuid(),
        },
        {
          status: 'shipped',
          quantity: 200,
          distributionType: 'reorder',
          businessId: uuid(),
        },
        {
          status: 'delivered',
          quantity: 150,
          distributionType: 'initial',
          businessId: uuid(),
        },
        {
          status: 'cancelled',
          quantity: 50,
          distributionType: 'replacement',
          businessId: uuid(),
        },
        {
          status: 'delivered',
          quantity: 300,
          distributionType: 'initial',
          businessId: uuid(),
        },
      ]

      for (const dist of distributions) {
        await testDb.prisma.bookDistribution.create({
          data: {
            bookId: testBookId,
            businessId: dist.businessId,
            businessName: `Business ${dist.businessId.slice(0, 8)}`,
            quantity: dist.quantity,
            distributionType: dist.distributionType,
            status: dist.status,
            contactName: 'Manager',
            createdBy: testUserId,
            updatedBy: testUserId,
          },
        })
      }
    })

    it('should return comprehensive distribution statistics', async () => {
      const stats = await repository.getDistributionStats(testBookId)

      expect(stats).toEqual({
        totalDistributions: 5,
        totalQuantity: 800,
        statusBreakdown: {
          pending: 1,
          shipped: 1,
          delivered: 2,
          cancelled: 1,
        },
        quantityByStatus: {
          pending: 100,
          shipped: 200,
          delivered: 450,
          cancelled: 50,
        },
        distributionsByBusiness: expect.any(Object),
        distributionsByType: {
          initial: 3,
          reorder: 1,
          replacement: 1,
        },
      })

      // Check that each business has 1 distribution
      const businessCounts = Object.values(stats.distributionsByBusiness)

      expect(businessCounts.every((count) => count === 1)).toBe(true)
      expect(businessCounts).toHaveLength(5)
    })
  })

  describe('deleteByBookId', () => {
    let otherBookId: string

    beforeEach(async () => {
      // Create another book
      otherBookId = uuid()
      await testDb.prisma.voucherBook.create({
        data: {
          id: otherBookId,
          title: 'Other Test Book',
          bookType: 'SPECIAL',
          year: 2024,
          status: 'DRAFT',
          totalPages: 20,
          createdBy: testUserId,
          updatedBy: testUserId,
        },
      })

      // Create distributions for both books
      await repository.create({
        bookId: testBookId,
        businessId: uuid(),
        businessName: 'Business for Book 1',
        quantity: 100,
        distributionType: 'initial',
        contactName: 'Contact 1',
        createdBy: testUserId,
      })

      await repository.create({
        bookId: otherBookId,
        businessId: uuid(),
        businessName: 'Business for Book 2',
        quantity: 200,
        distributionType: 'initial',
        contactName: 'Contact 2',
        createdBy: testUserId,
      })
    })

    it('should delete all distributions for a specific book', async () => {
      // Verify initial state
      const allDistributions = await repository.findAll({})

      expect(allDistributions.data).toHaveLength(2)

      // Delete distributions for one book
      await repository.deleteByBookId(testBookId)

      // Verify only distributions for other book remain
      const remainingDistributions = await repository.findAll({})

      expect(remainingDistributions.data).toHaveLength(1)
      expect(remainingDistributions.data[0].bookId).toBe(otherBookId)
    })
  })

  describe('date filtering', () => {
    beforeEach(async () => {
      // Create distributions with different dates
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      await testDb.prisma.bookDistribution.createMany({
        data: [
          {
            bookId: testBookId,
            businessId: uuid(),
            businessName: 'Yesterday Business',
            quantity: 100,
            distributionType: 'initial',
            contactName: 'Contact',
            createdBy: testUserId,
            updatedBy: testUserId,
            createdAt: yesterday,
          },
          {
            bookId: testBookId,
            businessId: uuid(),
            businessName: 'Today Business',
            quantity: 200,
            distributionType: 'initial',
            contactName: 'Contact',
            createdBy: testUserId,
            updatedBy: testUserId,
            createdAt: now,
          },
          {
            bookId: testBookId,
            businessId: uuid(),
            businessName: 'Tomorrow Business',
            quantity: 300,
            distributionType: 'initial',
            contactName: 'Contact',
            createdBy: testUserId,
            updatedBy: testUserId,
            createdAt: tomorrow,
          },
        ],
      })
    })

    it('should filter by start date', async () => {
      const startDate = new Date()
      const result = await repository.findAll({ startDate })

      expect(result.data).toHaveLength(2) // today and tomorrow
    })

    it('should filter by end date', async () => {
      const endDate = new Date()
      const result = await repository.findAll({ endDate })

      expect(result.data).toHaveLength(2) // yesterday and today
    })

    it('should filter by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const today = new Date()

      const result = await repository.findAll({
        startDate: yesterday,
        endDate: today,
      })

      expect(result.data).toHaveLength(2) // yesterday and today
    })
  })
})
