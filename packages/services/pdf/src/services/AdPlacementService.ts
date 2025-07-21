import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'
import type { AdPlacement, AdPosition, ContentType } from '@prisma/client'

import type {
  IAdPlacementRepository,
  IVoucherBookRepository,
} from '../repositories/index.js'
import { AdSize,PageLayoutEngine } from './PageLayoutEngine.js'

export interface CreateAdPlacementData {
  voucherBookId: string
  position: AdPosition
  contentType: ContentType
  title: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  textContent?: string
  displayOrder?: number
  isActive?: boolean
  createdById: string
  updatedById: string
}

export interface UpdateAdPlacementData {
  position?: AdPosition
  contentType?: ContentType
  title?: string
  description?: string
  imageUrl?: string
  linkUrl?: string
  textContent?: string
  displayOrder?: number
  isActive?: boolean
  updatedById: string
}

export interface ReorderPlacementData {
  id: string
  displayOrder: number
}

export interface PlacementValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  conflictingPlacements: string[]
}

export interface IAdPlacementService {
  createAdPlacement(data: CreateAdPlacementData): Promise<AdPlacement>
  getAdPlacementById(id: string): Promise<AdPlacement>
  getAdPlacementsByVoucherBookId(voucherBookId: string): Promise<AdPlacement[]>
  updateAdPlacement(
    id: string,
    data: UpdateAdPlacementData,
  ): Promise<AdPlacement>
  deleteAdPlacement(id: string): Promise<void>
  reorderPlacements(
    voucherBookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void>
  validatePlacement(
    voucherBookId: string,
    position: AdPosition,
    excludeId?: string,
  ): Promise<PlacementValidation>
  getOptimalPlacementSuggestions(
    voucherBookId: string,
    contentType: ContentType,
  ): Promise<AdPosition[]>
}

/**
 * AdPlacementService manages advertisement placement with sophisticated layout validation.
 *
 * Uses the proven PageLayoutEngine from the original Pika service for:
 * - Grid-based layout system (2x4 grid = 8 spaces)
 * - Size validation (SINGLE=1, QUARTER=2, HALF=4, FULL=8 spaces)
 * - Position conflict detection
 * - Optimal placement suggestions
 *
 * Position mapping:
 * - SINGLE → 1 space
 * - QUARTER → 2 spaces
 * - HALF → 4 spaces
 * - FULL → 8 spaces (entire page)
 */
export class AdPlacementService implements IAdPlacementService {
  private readonly pageLayoutEngine: PageLayoutEngine

  constructor(
    private readonly placementRepository: IAdPlacementRepository,
    private readonly voucherBookRepository: IVoucherBookRepository,
    private readonly cache: ICacheService,
  ) {
    this.pageLayoutEngine = new PageLayoutEngine()
  }

  async createAdPlacement(data: CreateAdPlacementData): Promise<AdPlacement> {
    try {
      logger.info('Creating ad placement', {
        voucherBookId: data.voucherBookId,
        position: data.position,
        contentType: data.contentType,
      })

      // Validate voucher book exists and is modifiable
      await this.validateVoucherBookModifiable(data.voucherBookId)

      // Validate content type requirements
      this.validateContentTypeData(data)

      // Validate placement using sophisticated layout engine
      const validation = await this.validatePlacement(
        data.voucherBookId,
        data.position,
      )

      if (!validation.isValid) {
        throw ErrorFactory.badRequest(
          `Placement validation failed: ${validation.errors.join(', ')}`,
        )
      }

      // Set display order if not provided
      const displayOrder =
        data.displayOrder ??
        (await this.getNextDisplayOrder(data.voucherBookId))

      const placement = await this.placementRepository.create({
        ...data,
        displayOrder,
        isActive: data.isActive ?? true,
      })

      // Invalidate cache
      await this.invalidateRelatedCache(data.voucherBookId)

      logger.info('Ad placement created successfully', {
        id: placement.id,
        voucherBookId: data.voucherBookId,
        position: data.position,
      })

      return placement
    } catch (error) {
      logger.error('Failed to create ad placement', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:ad-placement',
    keyGenerator: (id) => id,
  })
  async getAdPlacementById(id: string): Promise<AdPlacement> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const placement = await this.placementRepository.findById(id)

      if (!placement) {
        throw ErrorFactory.notFound('Ad placement not found')
      }

      return placement
    } catch (error) {
      logger.error('Failed to get ad placement by ID', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:ad-placements-book',
    keyGenerator: (voucherBookId) => voucherBookId,
  })
  async getAdPlacementsByVoucherBookId(
    voucherBookId: string,
  ): Promise<AdPlacement[]> {
    try {
      if (!isUuidV4(voucherBookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const placements =
        await this.placementRepository.findByVoucherBookId(voucherBookId)

      return placements
    } catch (error) {
      logger.error('Failed to get ad placements by voucher book ID', {
        error,
        voucherBookId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateAdPlacement(
    id: string,
    data: UpdateAdPlacementData,
  ): Promise<AdPlacement> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const currentPlacement = await this.getAdPlacementById(id)

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(currentPlacement.voucherBookId)

      // If position is changing, validate new position
      if (data.position && data.position !== currentPlacement.position) {
        const validation = await this.validatePlacement(
          currentPlacement.voucherBookId,
          data.position,
          id, // Exclude current placement from conflict check
        )

        if (!validation.isValid) {
          throw ErrorFactory.badRequest(
            `Position validation failed: ${validation.errors.join(', ')}`,
          )
        }
      }

      // Validate content type requirements
      if (data.contentType || data.imageUrl || data.textContent) {
        this.validateContentTypeData({
          ...currentPlacement,
          ...data,
        })
      }

      const updatedPlacement = await this.placementRepository.update(id, data)

      // Invalidate cache
      await this.invalidateRelatedCache(currentPlacement.voucherBookId)
      await this.cache.del(`service:ad-placement:${id}`)

      logger.info('Ad placement updated', {
        id,
        updatedFields: Object.keys(data),
      })

      return updatedPlacement
    } catch (error) {
      logger.error('Failed to update ad placement', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteAdPlacement(id: string): Promise<void> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid ad placement ID format')
      }

      const placement = await this.getAdPlacementById(id)

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(placement.voucherBookId)

      await this.placementRepository.delete(id)

      // Invalidate cache
      await this.invalidateRelatedCache(placement.voucherBookId)
      await this.cache.del(`service:ad-placement:${id}`)

      logger.info('Ad placement deleted', { id })
    } catch (error) {
      logger.error('Failed to delete ad placement', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async reorderPlacements(
    voucherBookId: string,
    reorderData: ReorderPlacementData[],
    userId: string,
  ): Promise<void> {
    try {
      if (!isUuidV4(voucherBookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      // Validate voucher book is modifiable
      await this.validateVoucherBookModifiable(voucherBookId)

      // Validate all placements belong to the voucher book
      const placements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const placementIds = new Set(placements.map((p) => p.id))

      for (const { id } of reorderData) {
        if (!placementIds.has(id)) {
          throw ErrorFactory.badRequest(
            `Placement ${id} does not belong to voucher book ${voucherBookId}`,
          )
        }
      }

      await this.placementRepository.reorderPlacements(
        voucherBookId,
        reorderData,
        userId,
      )

      // Invalidate cache
      await this.invalidateRelatedCache(voucherBookId)

      logger.info('Ad placements reordered', {
        voucherBookId,
        count: reorderData.length,
      })
    } catch (error) {
      logger.error('Failed to reorder ad placements', {
        error,
        voucherBookId,
        reorderData,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async validatePlacement(
    voucherBookId: string,
    position: AdPosition,
    excludeId?: string,
  ): Promise<PlacementValidation> {
    try {
      const errors: string[] = []
      const warnings: string[] = []
      const conflictingPlacements: string[] = []

      // Get existing placements
      const existingPlacements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const activePlacements = existingPlacements.filter(
        (p) => p.isActive && (!excludeId || p.id !== excludeId),
      )

      // Map our position enum to the layout engine's AdSize
      const adSize = this.mapPositionToAdSize(position)
      const requiredSpaces = this.pageLayoutEngine.getRequiredSpaces(adSize)

      // Use the sophisticated layout engine for validation
      const canPlace = this.pageLayoutEngine.canPlaceAd(
        this.buildOccupiedSpacesFromPlacements(activePlacements),
        1, // Start position - simplified for now
        adSize,
      )

      if (!canPlace.success) {
        errors.push(`Cannot place ${position} ad: ${canPlace.reason}`)

        // Find conflicting placements
        for (const placement of activePlacements) {
          if (this.checkPositionConflict(position, placement.position)) {
            conflictingPlacements.push(placement.id)
          }
        }
      }

      // Add warnings for layout optimization
      if (activePlacements.length === 0 && position !== 'FULL') {
        warnings.push(
          'Consider using FULL size for maximum impact on empty page',
        )
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        conflictingPlacements,
      }
    } catch (error) {
      logger.error('Failed to validate placement', {
        error,
        voucherBookId,
        position,
      })

      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
        warnings: [],
        conflictingPlacements: [],
      }
    }
  }

  async getOptimalPlacementSuggestions(
    voucherBookId: string,
    contentType: ContentType,
  ): Promise<AdPosition[]> {
    try {
      const existingPlacements =
        await this.getAdPlacementsByVoucherBookId(voucherBookId)
      const suggestions: AdPosition[] = []

      // Test each position size
      const positionsToTest: AdPosition[] = [
        'SINGLE',
        'QUARTER',
        'HALF',
        'FULL',
      ]

      for (const position of positionsToTest) {
        const validation = await this.validatePlacement(voucherBookId, position)

        if (validation.isValid) {
          suggestions.push(position)
        }
      }

      // Prioritize based on content type and existing placements
      return this.prioritizeSuggestions(
        suggestions,
        contentType,
        existingPlacements.length,
      )
    } catch (error) {
      logger.error('Failed to get optimal placement suggestions', {
        error,
        voucherBookId,
        contentType,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Private helper methods
   */

  private async validateVoucherBookModifiable(
    voucherBookId: string,
  ): Promise<void> {
    const voucherBook = await this.voucherBookRepository.findById(voucherBookId)

    if (!voucherBook) {
      throw ErrorFactory.notFound('Voucher book not found')
    }

    if (
      voucherBook.status === 'PUBLISHED' ||
      voucherBook.status === 'ARCHIVED'
    ) {
      throw ErrorFactory.badRequest(
        `Cannot modify placements in ${voucherBook.status.toLowerCase()} voucher book`,
      )
    }
  }

  private validateContentTypeData(data: Partial<CreateAdPlacementData>): void {
    switch (data.contentType) {
      case 'IMAGE':
        if (!data.imageUrl) {
          throw ErrorFactory.badRequest(
            'Image URL is required for IMAGE content type',
          )
        }
        break
      case 'TEXT':
        if (!data.textContent) {
          throw ErrorFactory.badRequest(
            'Text content is required for TEXT content type',
          )
        }
        break
      case 'VOUCHER':
        // Voucher placements are validated separately
        break
      case 'AD':
        if (!data.title) {
          throw ErrorFactory.badRequest('Title is required for AD content type')
        }
        break
    }
  }

  private async getNextDisplayOrder(voucherBookId: string): Promise<number> {
    const existingPlacements =
      await this.getAdPlacementsByVoucherBookId(voucherBookId)
    const maxOrder = Math.max(
      ...existingPlacements.map((p) => p.displayOrder),
      0,
    )

    return maxOrder + 1
  }

  private async invalidateRelatedCache(voucherBookId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`service:ad-placements-book:${voucherBookId}`),
      this.cache.del(`service:voucher-book:${voucherBookId}`),
    ])
  }

  private mapPositionToAdSize(position: AdPosition): AdSize {
    // Map our position enum to the layout engine's size system
    const mapping: Record<AdPosition, AdSize> = {
      SINGLE: 'SINGLE',
      QUARTER: 'QUARTER',
      HALF: 'HALF',
      FULL: 'FULL',
    }

    return mapping[position] || 'SINGLE'
  }

  private buildOccupiedSpacesFromPlacements(
    placements: AdPlacement[],
  ): Set<number> {
    const occupiedSpaces = new Set<number>()

    for (const placement of placements) {
      const adSize = this.mapPositionToAdSize(placement.position)
      const requiredSpaces = this.pageLayoutEngine.getRequiredSpaces(adSize)

      // Simplified space mapping - in real implementation would be more sophisticated
      for (let i = 0; i < requiredSpaces; i++) {
        occupiedSpaces.add(i + 1)
      }
    }

    return occupiedSpaces
  }

  private checkPositionConflict(
    position1: AdPosition,
    position2: AdPosition,
  ): boolean {
    // If either is FULL, they conflict
    if (position1 === 'FULL' || position2 === 'FULL') {
      return true
    }

    // If both are HALF, they conflict
    if (position1 === 'HALF' && position2 === 'HALF') {
      return true
    }

    // More sophisticated conflict detection would use the layout engine
    return false
  }

  private prioritizeSuggestions(
    suggestions: AdPosition[],
    contentType: ContentType,
    existingCount: number,
  ): AdPosition[] {
    // Prioritize based on content type
    const priority: Record<ContentType, AdPosition[]> = {
      VOUCHER: ['SINGLE', 'QUARTER', 'HALF', 'FULL'],
      AD: ['QUARTER', 'HALF', 'SINGLE', 'FULL'],
      IMAGE: ['HALF', 'FULL', 'QUARTER', 'SINGLE'],
      TEXT: ['SINGLE', 'QUARTER', 'HALF', 'FULL'],
    }

    const preferredOrder = priority[contentType] || [
      'SINGLE',
      'QUARTER',
      'HALF',
      'FULL',
    ]

    return suggestions.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a)
      const bIndex = preferredOrder.indexOf(b)

      return aIndex - bIndex
    })
  }
}
