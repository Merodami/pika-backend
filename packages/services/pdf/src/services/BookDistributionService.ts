import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { ErrorFactory, isUuidV4, logger } from '@pika/shared'
import type {
  BookDistribution,
  BusinessType,
  DistributionStatus,
  DistributionType,
} from '@prisma/client'

import type {
  IBookDistributionRepository,
  IVoucherBookRepository,
} from '../repositories/index.js'

export interface CreateBookDistributionData {
  voucherBookId: string
  businessName: string
  businessType: BusinessType
  locationName?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  requestedQuantity: number
  distributionType: DistributionType
  notes?: string
  createdById: string
  updatedById: string
}

export interface UpdateBookDistributionData {
  businessName?: string
  businessType?: BusinessType
  locationName?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  requestedQuantity?: number
  shippedQuantity?: number
  status?: DistributionStatus
  distributionType?: DistributionType
  trackingNumber?: string
  carrier?: string
  shippedAt?: Date
  deliveredAt?: Date
  deliveryConfirmedBy?: string
  notes?: string
  updatedById: string
}

export interface BookDistributionSearchParams {
  page?: number
  limit?: number
  voucherBookId?: string
  businessName?: string
  businessType?: BusinessType
  status?: DistributionStatus
  distributionType?: DistributionType
  locationName?: string
  createdById?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'businessName' | 'requestedQuantity'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BusinessDistributionStats {
  businessName: string
  businessType: BusinessType
  totalDistributions: number
  totalRequested: number
  totalShipped: number
  statusBreakdown: Record<DistributionStatus, number>
}

export interface IBookDistributionService {
  createDistribution(
    data: CreateBookDistributionData,
  ): Promise<BookDistribution>
  getDistributionById(id: string): Promise<BookDistribution>
  getAllDistributions(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistribution>>
  getDistributionsByVoucherBookId(
    voucherBookId: string,
  ): Promise<BookDistribution[]>
  updateDistribution(
    id: string,
    data: UpdateBookDistributionData,
  ): Promise<BookDistribution>
  deleteDistribution(id: string): Promise<void>
  shipDistribution(
    id: string,
    shippingData: {
      shippedQuantity: number
      trackingNumber?: string
      carrier?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistribution>
  confirmDelivery(
    id: string,
    deliveryData: {
      deliveryConfirmedBy?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistribution>
  getBusinessStats(): Promise<BusinessDistributionStats[]>
}

/**
 * BookDistributionService manages bulk distribution tracking and logistics.
 *
 * Distribution Lifecycle: PENDING → SHIPPED → DELIVERED
 * Features from original Pika implementation:
 * - Business-focused distribution tracking
 * - Multi-location support for business chains
 * - Complete shipping and delivery audit trail
 * - Contact management for delivery coordination
 * - Distribution analytics and reporting
 */
export class BookDistributionService implements IBookDistributionService {
  constructor(
    private readonly distributionRepository: IBookDistributionRepository,
    private readonly voucherBookRepository: IVoucherBookRepository,
    private readonly cache: ICacheService,
  ) {}

  async createDistribution(
    data: CreateBookDistributionData,
  ): Promise<BookDistribution> {
    try {
      logger.info('Creating book distribution', {
        voucherBookId: data.voucherBookId,
        businessName: data.businessName,
        requestedQuantity: data.requestedQuantity,
      })

      // Validate voucher book exists and is published
      await this.validateVoucherBookForDistribution(data.voucherBookId)

      // Validate business data
      this.validateBusinessData(data)

      // Create distribution with default status
      const distribution = await this.distributionRepository.create({
        ...data,
        status: 'PENDING' as DistributionStatus,
      })

      // Invalidate related cache
      await this.invalidateRelatedCache(data.voucherBookId)

      logger.info('Book distribution created successfully', {
        id: distribution.id,
        businessName: data.businessName,
        requestedQuantity: data.requestedQuantity,
      })

      return distribution
    } catch (error) {
      logger.error('Failed to create book distribution', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:book-distribution',
    keyGenerator: (id) => id,
  })
  async getDistributionById(id: string): Promise<BookDistribution> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const distribution = await this.distributionRepository.findById(id)

      if (!distribution) {
        throw ErrorFactory.notFound('Book distribution not found')
      }

      return distribution
    } catch (error) {
      logger.error('Failed to get distribution by ID', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL / 2,
    prefix: 'service:book-distributions',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllDistributions(
    params: BookDistributionSearchParams,
  ): Promise<PaginatedResult<BookDistribution>> {
    try {
      const result = await this.distributionRepository.findAll(params)

      return result
    } catch (error) {
      logger.error('Failed to get all distributions', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:book-distributions-by-book',
    keyGenerator: (voucherBookId) => voucherBookId,
  })
  async getDistributionsByVoucherBookId(
    voucherBookId: string,
  ): Promise<BookDistribution[]> {
    try {
      if (!isUuidV4(voucherBookId)) {
        throw ErrorFactory.badRequest('Invalid voucher book ID format')
      }

      const distributions =
        await this.distributionRepository.findByVoucherBookId(voucherBookId)

      return distributions
    } catch (error) {
      logger.error('Failed to get distributions by voucher book ID', {
        error,
        voucherBookId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateDistribution(
    id: string,
    data: UpdateBookDistributionData,
  ): Promise<BookDistribution> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const currentDistribution = await this.getDistributionById(id)

      // Validate status transitions
      if (data.status) {
        this.validateStatusTransition(currentDistribution.status, data.status)
      }

      // Validate shipping data if updating to shipped status
      if (data.status === 'SHIPPED' || data.shippedQuantity) {
        this.validateShippingData(data, currentDistribution)
      }

      const updatedDistribution = await this.distributionRepository.update(
        id,
        data,
      )

      // Invalidate cache
      await this.cache.del(`service:book-distribution:${id}`)
      await this.invalidateRelatedCache(currentDistribution.voucherBookId)

      logger.info('Distribution updated', {
        id,
        updatedFields: Object.keys(data),
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to update distribution', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteDistribution(id: string): Promise<void> {
    try {
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid distribution ID format')
      }

      const distribution = await this.getDistributionById(id)

      // Only allow deletion of pending distributions
      if (distribution.status !== 'PENDING') {
        throw ErrorFactory.badRequest(
          'Only pending distributions can be deleted',
        )
      }

      await this.distributionRepository.delete(id)

      // Invalidate cache
      await this.cache.del(`service:book-distribution:${id}`)
      await this.invalidateRelatedCache(distribution.voucherBookId)

      logger.info('Distribution deleted', { id })
    } catch (error) {
      logger.error('Failed to delete distribution', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async shipDistribution(
    id: string,
    shippingData: {
      shippedQuantity: number
      trackingNumber?: string
      carrier?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistribution> {
    try {
      const distribution = await this.getDistributionById(id)

      // Validate current status allows shipping
      if (distribution.status !== 'PENDING') {
        throw ErrorFactory.badRequest(
          'Only pending distributions can be shipped',
        )
      }

      // Validate shipped quantity
      if (shippingData.shippedQuantity <= 0) {
        throw ErrorFactory.badRequest('Shipped quantity must be greater than 0')
      }

      if (shippingData.shippedQuantity > distribution.requestedQuantity) {
        throw ErrorFactory.badRequest(
          'Shipped quantity cannot exceed requested quantity',
        )
      }

      const updateData: UpdateBookDistributionData = {
        status: 'SHIPPED',
        shippedQuantity: shippingData.shippedQuantity,
        trackingNumber: shippingData.trackingNumber,
        carrier: shippingData.carrier,
        shippedAt: new Date(),
        notes: shippingData.notes || distribution.notes,
        updatedById: shippingData.updatedById,
      }

      const updatedDistribution = await this.updateDistribution(id, updateData)

      logger.info('Distribution shipped', {
        id,
        shippedQuantity: shippingData.shippedQuantity,
        trackingNumber: shippingData.trackingNumber,
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to ship distribution', { error, id, shippingData })
      throw ErrorFactory.fromError(error)
    }
  }

  async confirmDelivery(
    id: string,
    deliveryData: {
      deliveryConfirmedBy?: string
      notes?: string
      updatedById: string
    },
  ): Promise<BookDistribution> {
    try {
      const distribution = await this.getDistributionById(id)

      // Validate current status allows delivery confirmation
      if (distribution.status !== 'SHIPPED') {
        throw ErrorFactory.badRequest(
          'Only shipped distributions can be marked as delivered',
        )
      }

      const updateData: UpdateBookDistributionData = {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryConfirmedBy: deliveryData.deliveryConfirmedBy,
        notes: deliveryData.notes || distribution.notes,
        updatedById: deliveryData.updatedById,
      }

      const updatedDistribution = await this.updateDistribution(id, updateData)

      logger.info('Distribution delivery confirmed', {
        id,
        deliveryConfirmedBy: deliveryData.deliveryConfirmedBy,
      })

      return updatedDistribution
    } catch (error) {
      logger.error('Failed to confirm delivery', { error, id, deliveryData })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL * 2, // Longer cache for analytics
    prefix: 'service:business-stats',
    keyGenerator: () => 'all',
  })
  async getBusinessStats(): Promise<BusinessDistributionStats[]> {
    try {
      const stats = await this.distributionRepository.getBusinessStats()

      return stats
    } catch (error) {
      logger.error('Failed to get business stats', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Private helper methods
   */

  private async validateVoucherBookForDistribution(
    voucherBookId: string,
  ): Promise<void> {
    if (!isUuidV4(voucherBookId)) {
      throw ErrorFactory.badRequest('Invalid voucher book ID format')
    }

    const voucherBook = await this.voucherBookRepository.findById(voucherBookId)

    if (!voucherBook) {
      throw ErrorFactory.notFound('Voucher book not found')
    }

    // Only allow distribution for published books
    if (voucherBook.status !== 'PUBLISHED') {
      throw ErrorFactory.badRequest(
        'Only published voucher books can be distributed',
      )
    }

    if (!voucherBook.isActive) {
      throw ErrorFactory.badRequest('Cannot distribute inactive voucher books')
    }
  }

  private validateBusinessData(data: CreateBookDistributionData): void {
    if (!data.businessName?.trim()) {
      throw ErrorFactory.badRequest('Business name is required')
    }

    if (data.requestedQuantity <= 0) {
      throw ErrorFactory.badRequest('Requested quantity must be greater than 0')
    }

    // Validate contact email format if provided
    if (data.contactEmail && !this.isValidEmail(data.contactEmail)) {
      throw ErrorFactory.badRequest('Invalid contact email format')
    }

    // Validate phone format if provided
    if (data.contactPhone && !this.isValidPhone(data.contactPhone)) {
      throw ErrorFactory.badRequest('Invalid contact phone format')
    }
  }

  private validateStatusTransition(
    currentStatus: DistributionStatus,
    newStatus: DistributionStatus,
  ): void {
    const allowedTransitions: Record<DistributionStatus, DistributionStatus[]> =
      {
        PENDING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED', 'CANCELLED'],
        DELIVERED: [], // Terminal state
        CANCELLED: [], // Terminal state
      }

    const allowed = allowedTransitions[currentStatus] || []

    if (!allowed.includes(newStatus)) {
      throw ErrorFactory.badRequest(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      )
    }
  }

  private validateShippingData(
    data: UpdateBookDistributionData,
    currentDistribution: BookDistribution,
  ): void {
    if (data.shippedQuantity && data.shippedQuantity <= 0) {
      throw ErrorFactory.badRequest('Shipped quantity must be greater than 0')
    }

    if (
      data.shippedQuantity &&
      data.shippedQuantity > currentDistribution.requestedQuantity
    ) {
      throw ErrorFactory.badRequest(
        'Shipped quantity cannot exceed requested quantity',
      )
    }
  }

  private async invalidateRelatedCache(voucherBookId: string): Promise<void> {
    await Promise.all([
      this.cache.del(`service:book-distributions-by-book:${voucherBookId}`),
      this.cache.del('service:business-stats:all'),
    ])
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/

    return phoneRegex.test(phone)
  }
}
