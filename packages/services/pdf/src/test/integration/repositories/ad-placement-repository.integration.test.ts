import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { clearTestDatabase, createTestDatabase } from '@pika/tests'
import type { PrismaClient } from '@prisma/client'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { IAdPlacementRepository } from '../../../repositories/AdPlacementRepository.js'
import { AdPlacementRepository } from '../../../repositories/AdPlacementRepository.js'

describe('AdPlacementRepository Integration Tests', () => {
  let prisma: PrismaClient
  let repository: IAdPlacementRepository
  let cache: MemoryCacheService
  let testContext: { cleanup: () => Promise<void> }

  // Test data
  let testUser: { id: string; email: string }
  let testVoucherBook: { id: string; title: string }

  beforeAll(async () => {
    const result = await createTestDatabase()

    prisma = result.prisma
    testContext = result
    cache = new MemoryCacheService()
    repository = new AdPlacementRepository(prisma, cache)
  })

  afterAll(async () => {
    try {
      await testContext.cleanup()
    } catch (error) {
      logger.error('Failed to cleanup test database', { error })
    }
  })

  beforeEach(async () => {
    await clearTestDatabase(prisma)

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: uuid(),
        email: 'test-user@example.com',
        passwordHash: 'hashedpassword',
        emailVerified: true,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })

    // Create test voucher book
    testVoucherBook = await prisma.voucherBook.create({
      data: {
        id: uuid(),
        title: 'Test Voucher Book',
        description: 'Test Description',
        format: 'A5',
        orientation: 'PORTRAIT',
        totalPages: 20,
        vouchersPerPage: 4,
        totalVouchers: 80,
        isActive: true,
        createdById: testUser.id,
        updatedById: testUser.id,
      },
    })
  })

  describe('create', () => {
    it('should create an ad placement successfully', async () => {
      const createData = {
        voucherBookId: testVoucherBook.id,
        position: 'FRONT_COVER' as const,
        contentType: 'IMAGE' as const,
        title: 'Premium Gym Advertisement',
        description: 'Join the best gym in town!',
        imageUrl: 'https://example.com/gym-ad.jpg',
        linkUrl: 'https://premiumgym.com',
        displayOrder: 1,
        isActive: true,
        createdById: testUser.id,
        updatedById: testUser.id,
      }

      const result = await repository.create(createData)

      expect(result).toMatchObject({
        id: expect.any(String),
        voucherBookId: testVoucherBook.id,
        position: 'FRONT_COVER',
        contentType: 'IMAGE',
        title: 'Premium Gym Advertisement',
        description: 'Join the best gym in town!',
        imageUrl: 'https://example.com/gym-ad.jpg',
        linkUrl: 'https://premiumgym.com',
        displayOrder: 1,
        isActive: true,
        createdById: testUser.id,
        updatedById: testUser.id,
      })

      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create text-based ad placement', async () => {
      const createData = {
        voucherBookId: testVoucherBook.id,
        position: 'BACK_COVER' as const,
        contentType: 'TEXT' as const,
        title: 'Visit Our Website',
        textContent: 'Check out our latest offers at www.example.com',
        displayOrder: 2,
        isActive: true,
        createdById: testUser.id,
        updatedById: testUser.id,
      }

      const result = await repository.create(createData)

      expect(result).toMatchObject({
        position: 'BACK_COVER',
        contentType: 'TEXT',
        title: 'Visit Our Website',
        textContent: 'Check out our latest offers at www.example.com',
        imageUrl: null,
        linkUrl: null,
        displayOrder: 2,
      })
    })
  })

  describe('findByVoucherBookId', () => {
    it('should find ad placements by voucher book id', async () => {
      // Create multiple ad placements
      await prisma.adPlacement.createMany({
        data: [
          {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'IMAGE',
            title: 'Ad 1',
            displayOrder: 1,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
          {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'INSIDE_FRONT',
            contentType: 'TEXT',
            title: 'Ad 2',
            displayOrder: 2,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
          {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'BACK_COVER',
            contentType: 'IMAGE',
            title: 'Ad 3',
            displayOrder: 3,
            isActive: false, // Inactive ad
            createdById: testUser.id,
            updatedById: testUser.id,
          },
        ],
      })

      const result = await repository.findByVoucherBookId(testVoucherBook.id)

      expect(result).toHaveLength(3)

      // Should be ordered by displayOrder
      expect(result[0].title).toBe('Ad 1')
      expect(result[1].title).toBe('Ad 2')
      expect(result[2].title).toBe('Ad 3')

      // Should include inactive ads
      expect(result[2].isActive).toBe(false)
    })
  })

  describe('findByPosition', () => {
    it('should find active ad placements by position', async () => {
      await prisma.adPlacement.createMany({
        data: [
          {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'IMAGE',
            title: 'Active Front Cover Ad',
            displayOrder: 1,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
          {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'TEXT',
            title: 'Inactive Front Cover Ad',
            displayOrder: 2,
            isActive: false,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
        ],
      })

      const result = await repository.findByPosition('FRONT_COVER')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Active Front Cover Ad')
      expect(result[0].isActive).toBe(true)
    })
  })

  describe('update', () => {
    it('should update ad placement content', async () => {
      const adPlacement = await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: testVoucherBook.id,
          position: 'INSIDE_BACK',
          contentType: 'IMAGE',
          title: 'Original Title',
          description: 'Original Description',
          displayOrder: 1,
          isActive: true,
          createdById: testUser.id,
          updatedById: testUser.id,
        },
      })

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        imageUrl: 'https://example.com/new-image.jpg',
        linkUrl: 'https://newlink.com',
        updatedById: testUser.id,
      }

      const result = await repository.update(adPlacement.id, updateData)

      expect(result).toMatchObject({
        id: adPlacement.id,
        title: 'Updated Title',
        description: 'Updated Description',
        imageUrl: 'https://example.com/new-image.jpg',
        linkUrl: 'https://newlink.com',
        updatedById: testUser.id,
      })

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        adPlacement.updatedAt.getTime(),
      )
    })

    it('should update display order and status', async () => {
      const adPlacement = await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: testVoucherBook.id,
          position: 'FOOTER',
          contentType: 'TEXT',
          title: 'Footer Ad',
          displayOrder: 5,
          isActive: true,
          createdById: testUser.id,
          updatedById: testUser.id,
        },
      })

      const updateData = {
        displayOrder: 1,
        isActive: false,
        updatedById: testUser.id,
      }

      const result = await repository.update(adPlacement.id, updateData)

      expect(result).toMatchObject({
        displayOrder: 1,
        isActive: false,
        updatedById: testUser.id,
      })
    })
  })

  describe('delete', () => {
    it('should soft delete an ad placement', async () => {
      const adPlacement = await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: testVoucherBook.id,
          position: 'HEADER',
          contentType: 'IMAGE',
          title: 'Delete Test Ad',
          displayOrder: 1,
          isActive: true,
          createdById: testUser.id,
          updatedById: testUser.id,
        },
      })

      await repository.delete(adPlacement.id)

      // Should not be found in regular queries
      const result = await repository.findById(adPlacement.id)

      expect(result).toBeNull()

      // But should exist in database with deletedAt timestamp
      const deletedRecord = await prisma.adPlacement.findFirst({
        where: { id: adPlacement.id },
      })

      expect(deletedRecord?.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('reorderPlacements', () => {
    it('should reorder ad placements within a voucher book', async () => {
      // Create three ad placements
      const placements = await Promise.all([
        prisma.adPlacement.create({
          data: {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'TEXT',
            title: 'Ad 1',
            displayOrder: 1,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
        }),
        prisma.adPlacement.create({
          data: {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'TEXT',
            title: 'Ad 2',
            displayOrder: 2,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
        }),
        prisma.adPlacement.create({
          data: {
            id: uuid(),
            voucherBookId: testVoucherBook.id,
            position: 'FRONT_COVER',
            contentType: 'TEXT',
            title: 'Ad 3',
            displayOrder: 3,
            isActive: true,
            createdById: testUser.id,
            updatedById: testUser.id,
          },
        }),
      ])

      // Reorder: [3, 1, 2]
      const reorderData = [
        { id: placements[2].id, displayOrder: 1 },
        { id: placements[0].id, displayOrder: 2 },
        { id: placements[1].id, displayOrder: 3 },
      ]

      await repository.reorderPlacements(
        testVoucherBook.id,
        reorderData,
        testUser.id,
      )

      // Verify new order
      const reorderedPlacements = await repository.findByVoucherBookId(
        testVoucherBook.id,
      )

      expect(reorderedPlacements[0].title).toBe('Ad 3')
      expect(reorderedPlacements[0].displayOrder).toBe(1)

      expect(reorderedPlacements[1].title).toBe('Ad 1')
      expect(reorderedPlacements[1].displayOrder).toBe(2)

      expect(reorderedPlacements[2].title).toBe('Ad 2')
      expect(reorderedPlacements[2].displayOrder).toBe(3)
    })
  })

  describe('caching behavior', () => {
    it('should cache and retrieve results', async () => {
      const adPlacement = await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: testVoucherBook.id,
          position: 'SIDEBAR',
          contentType: 'IMAGE',
          title: 'Cache Test Ad',
          displayOrder: 1,
          isActive: true,
          createdById: testUser.id,
          updatedById: testUser.id,
        },
      })

      // First call - should cache the result
      const result1 = await repository.findById(adPlacement.id)

      expect(result1).not.toBeNull()

      // Check if cached
      const cacheKey = `ad_placement:${adPlacement.id}`
      const cached = await cache.get(cacheKey)

      expect(cached).not.toBeNull()

      // Second call - should use cache
      const result2 = await repository.findById(adPlacement.id)

      expect(result2).toEqual(result1)
    })

    it('should invalidate cache on update', async () => {
      const adPlacement = await prisma.adPlacement.create({
        data: {
          id: uuid(),
          voucherBookId: testVoucherBook.id,
          position: 'FOOTER',
          contentType: 'TEXT',
          title: 'Cache Update Test',
          displayOrder: 1,
          isActive: true,
          createdById: testUser.id,
          updatedById: testUser.id,
        },
      })

      // Cache the result
      await repository.findById(adPlacement.id)

      // Update should invalidate cache
      await repository.update(adPlacement.id, {
        title: 'Updated Title',
        updatedById: testUser.id,
      })

      // Cache should be cleared
      const cacheKey = `ad_placement:${adPlacement.id}`
      const cached = await cache.get(cacheKey)

      expect(cached).toBeNull()
    })
  })
})
