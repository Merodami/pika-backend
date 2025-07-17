import { PageLayoutEngine } from '@pdf/services/PageLayoutEngine.js'
import { beforeEach, describe, expect, it } from 'vitest'

describe('PageLayoutEngine', () => {
  let engine: PageLayoutEngine

  beforeEach(() => {
    engine = new PageLayoutEngine()
  })

  describe('createEmptyPage', () => {
    it('should create a page with all 8 spaces available', () => {
      const page = engine.createEmptyPage(1)

      expect(page.pageNumber).toBe(1)
      expect(page.availableSpaces).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
      expect(page.occupiedSpaces.size).toBe(0)
      expect(page.placements).toEqual([])
    })

    it('should create pages with different page numbers', () => {
      const page1 = engine.createEmptyPage(1)
      const page2 = engine.createEmptyPage(5)

      expect(page1.pageNumber).toBe(1)
      expect(page2.pageNumber).toBe(5)
    })
  })

  describe('canPlaceAd', () => {
    it('should allow placing single space ad in empty spaces', () => {
      const occupiedSpaces = new Set<number>()

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'SINGLE')).toBe(true)
      expect(engine.canPlaceAd(occupiedSpaces, 8, 'SINGLE')).toBe(true)
    })

    it('should allow placing quarter ad when 2 consecutive spaces are free', () => {
      const occupiedSpaces = new Set([4, 8])

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'QUARTER')).toBe(true) // spaces 1,2
      expect(engine.canPlaceAd(occupiedSpaces, 3, 'QUARTER')).toBe(false) // spaces 3,4 - but 4 is occupied
      expect(engine.canPlaceAd(occupiedSpaces, 5, 'QUARTER')).toBe(true) // spaces 5,6
      expect(engine.canPlaceAd(occupiedSpaces, 7, 'QUARTER')).toBe(false) // spaces 7,8 - but 8 is occupied
    })

    it('should prevent placing quarter ad when spaces are occupied', () => {
      const occupiedSpaces = new Set([2, 5])

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'QUARTER')).toBe(false) // space 2 occupied
      expect(engine.canPlaceAd(occupiedSpaces, 4, 'QUARTER')).toBe(false) // space 5 occupied
    })

    it('should allow placing half ad when 4 consecutive spaces are free', () => {
      const occupiedSpaces = new Set<number>()

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'HALF')).toBe(true) // spaces 1-4
      expect(engine.canPlaceAd(occupiedSpaces, 5, 'HALF')).toBe(true) // spaces 5-8
    })

    it('should prevent placing half ad when any required space is occupied', () => {
      const occupiedSpaces = new Set([3])

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'HALF')).toBe(false) // space 3 occupied
      expect(engine.canPlaceAd(occupiedSpaces, 5, 'HALF')).toBe(true) // spaces 5-8 free
    })

    it('should allow placing full ad only when all spaces are free', () => {
      const occupiedSpaces = new Set<number>()

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'FULL')).toBe(true)
    })

    it('should prevent placing full ad when any space is occupied', () => {
      const occupiedSpaces = new Set([1])

      expect(engine.canPlaceAd(occupiedSpaces, 1, 'FULL')).toBe(false)
    })

    it('should validate position bounds', () => {
      const occupiedSpaces = new Set<number>()

      // Invalid positions for quarter ad (would exceed bounds)
      expect(engine.canPlaceAd(occupiedSpaces, 8, 'QUARTER')).toBe(false)
      expect(engine.canPlaceAd(occupiedSpaces, 0, 'QUARTER')).toBe(false)
      expect(engine.canPlaceAd(occupiedSpaces, 9, 'QUARTER')).toBe(false)
    })
  })

  describe('allocateSpace', () => {
    it('should successfully allocate single space', () => {
      const pageLayout = engine.createEmptyPage(1)

      const placement = engine.allocateSpace(pageLayout, {
        id: 'test-1',
        size: 'SINGLE',
        contentType: 'VOUCHER',
        voucherId: 'voucher-1',
      })

      expect(placement).toBeDefined()
      expect(placement!.position).toBe(1)
      expect(placement!.spacesUsed).toBe(1)
      expect(pageLayout.occupiedSpaces.has(1)).toBe(true)
      expect(pageLayout.availableSpaces).toEqual([2, 3, 4, 5, 6, 7, 8])
    })

    it('should allocate spaces in order of preference', () => {
      const pageLayout = engine.createEmptyPage(1)

      // Allocate first ad
      const placement1 = engine.allocateSpace(pageLayout, {
        id: 'test-1',
        size: 'QUARTER',
        contentType: 'VOUCHER',
        voucherId: 'voucher-1',
      })

      // Allocate second ad
      const placement2 = engine.allocateSpace(pageLayout, {
        id: 'test-2',
        size: 'QUARTER',
        contentType: 'VOUCHER',
        voucherId: 'voucher-2',
      })

      expect(placement1!.position).toBe(1) // First available position
      expect(placement2!.position).toBe(3) // Next available position for quarter ad
    })

    it('should return null when no space is available', () => {
      const pageLayout = engine.createEmptyPage(1)

      // Fill page with full ad
      engine.allocateSpace(pageLayout, {
        id: 'test-1',
        size: 'FULL',
        contentType: 'IMAGE',
        imageUrl: 'test.jpg',
      })

      // Try to allocate another ad
      const placement = engine.allocateSpace(pageLayout, {
        id: 'test-2',
        size: 'SINGLE',
        contentType: 'VOUCHER',
        voucherId: 'voucher-1',
      })

      expect(placement).toBeNull()
    })

    it('should handle mixed ad sizes correctly', () => {
      const pageLayout = engine.createEmptyPage(1)

      // Place a half ad (positions 1-4)
      const half = engine.allocateSpace(pageLayout, {
        id: 'half-1',
        size: 'HALF',
        contentType: 'VOUCHER',
        voucherId: 'voucher-1',
      })

      // Place two single ads (positions 5, 6)
      const single1 = engine.allocateSpace(pageLayout, {
        id: 'single-1',
        size: 'SINGLE',
        contentType: 'VOUCHER',
        voucherId: 'voucher-2',
      })

      const single2 = engine.allocateSpace(pageLayout, {
        id: 'single-2',
        size: 'SINGLE',
        contentType: 'VOUCHER',
        voucherId: 'voucher-3',
      })

      // Place a quarter ad (positions 7-8)
      const quarter = engine.allocateSpace(pageLayout, {
        id: 'quarter-1',
        size: 'QUARTER',
        contentType: 'VOUCHER',
        voucherId: 'voucher-4',
      })

      expect(half!.position).toBe(1)
      expect(single1!.position).toBe(5)
      expect(single2!.position).toBe(6)
      expect(quarter!.position).toBe(7)
      expect(pageLayout.availableSpaces).toEqual([])
    })
  })

  describe('calculateBounds', () => {
    it('should calculate correct bounds for single space ad', () => {
      const placement = {
        id: 'test',
        position: 1,
        size: 'SINGLE',
        spacesUsed: 1,
        contentType: 'VOUCHER' as const,
      }

      const bounds = engine.calculateBounds(placement, 210, 297, 10) // A4 with margin

      // cellWidth = (210-20)/2 = 95, cellHeight = (297-20)/4 = 69.25
      // x = 10 + 0 * 95 + 2.5 = 12.5, y = 10 + 0 * 69.25 + 2.5 = 12.5
      // width = 95 - 5 = 90, height = 69.25 - 5 = 64.25
      expect(bounds.x).toBe(12.5) // Left margin + padding
      expect(bounds.y).toBe(12.5) // Top margin + padding
      expect(bounds.width).toBe(90) // cellWidth - padding
      expect(bounds.height).toBe(64.25) // cellHeight - padding
    })

    it('should calculate correct bounds for quarter page ad', () => {
      const placement = {
        id: 'test',
        position: 1,
        size: 'QUARTER',
        spacesUsed: 2,
        contentType: 'VOUCHER' as const,
      }

      const bounds = engine.calculateBounds(placement, 210, 297, 10)

      // Quarter spans 2 columns: width = 95 * 2 - 5 = 185
      expect(bounds.width).toBe(185) // 2 columns minus padding
      expect(bounds.height).toBe(64.25) // Single row minus padding
    })

    it('should calculate correct bounds for half page ad', () => {
      const placement = {
        id: 'test',
        position: 1,
        size: 'HALF',
        spacesUsed: 4,
        contentType: 'VOUCHER' as const,
      }

      const bounds = engine.calculateBounds(placement, 210, 297, 10)

      // Half spans 2 columns and 2 rows: width = 95 * 2 - 5 = 185, height = 69.25 * 2 - 5 = 133.5
      expect(bounds.width).toBe(185) // 2 columns minus padding
      expect(bounds.height).toBe(133.5) // 2 rows minus padding
    })

    it('should calculate correct bounds for full page ad', () => {
      const placement = {
        id: 'test',
        position: 1,
        size: 'FULL',
        spacesUsed: 8,
        contentType: 'VOUCHER' as const,
      }

      const bounds = engine.calculateBounds(placement, 210, 297, 10)

      // Full spans 2 columns and 4 rows: width = 95 * 2 - 5 = 185, height = 69.25 * 4 - 5 = 272
      expect(bounds.width).toBe(185) // 2 columns minus padding
      expect(bounds.height).toBe(272) // 4 rows minus padding
    })
  })
})
