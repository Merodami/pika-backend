import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import {
  type CustomerVoucherDocument,
  type CustomerVoucherDomain,
  type VoucherDomain,
  VoucherMapper,
} from '@pika/sdk'
import { ErrorFactory, logger, toPrismaInclude } from '@pika/shared'
import type { ParsedIncludes } from '@pika/types'
import type { PaginatedResult, VoucherState } from '@pika/types'
import { CustomerVoucherStatus, VoucherCodeType } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'
import { set } from 'lodash-es'

import type { VoucherSearchParams } from '../types/index.js'
import type {
  CreateValidationCodeData,
  ValidationCodeRecord,
} from '../types/validation.js'
import {
  RedemptionAnalyticsRepository,
  type VoucherRedemptionLogData,
} from './RedemptionAnalyticsRepository.js'

export interface IVoucherRepository {
  findAll(params: VoucherSearchParams): Promise<PaginatedResult<VoucherDomain>>
  findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain | null>
  findByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>>
  findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  findByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  findUserVoucher(
    userId: string,
    voucherId: string,
  ): Promise<VoucherDomain | null>
  claimVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain>
  redeemVoucher(
    voucherId: string,
    userId: string,
    redemptionData?: VoucherRedemptionLogData,
  ): Promise<CustomerVoucherDomain>
  findCustomerVoucher(
    userId: string,
    voucherId: string,
  ): Promise<CustomerVoucherDomain | null>
  getCustomerVouchers(
    userId: string,
    status?: string,
  ): Promise<PaginatedResult<CustomerVoucherDomain>>
  // Code-based voucher lookup methods (critical for QR scanning)
  findByShortCode(shortCode: string): Promise<VoucherDomain | null>
  findByStaticCode(staticCode: string): Promise<VoucherDomain | null>
  findByAnyCode(code: string): Promise<VoucherDomain | null>
  upsertSearchQuery(query: string): Promise<void>
  getPopularSearches(limit: number): Promise<string[]>
  // Validation code methods for URL-based QR
  createValidationCode(data: CreateValidationCodeData): Promise<void>
  findValidationCode(code: string): Promise<ValidationCodeRecord | null>
  markValidationCodeUsed(code: string, userId: string): Promise<void>
  deleteExpiredValidationCodes(): Promise<number>
}

export class VoucherRepository implements IVoucherRepository {
  private redemptionAnalytics: RedemptionAnalyticsRepository

  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {
    this.redemptionAnalytics = new RedemptionAnalyticsRepository(prisma, cache)
  }

  async findAll(
    params: VoucherSearchParams = {},
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const {
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const where = this.buildWhereClause(params)

      const orderBy = this.buildOrderBy(sortBy, sortOrder)
      const include = this.buildInclude(parsedIncludes)

      const [items, total] = await Promise.all([
        this.prisma.voucher.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include,
        }),
        this.prisma.voucher.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: items.map((item) => VoucherMapper.fromDocument(item)),
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find all vouchers', { error, params })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findAll',
          'Failed to retrieve vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<VoucherDomain | null> {
    try {
      const include = this.buildInclude(parsedIncludes)

      const voucher = await this.prisma.voucher.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include,
      })

      return voucher ? VoucherMapper.fromDocument(voucher) : null
    } catch (error) {
      logger.error('Failed to find voucher by id', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findById',
          'Failed to retrieve voucher',
          error,
        )
      }

      throw error
    }
  }

  async findByIds(
    ids: string[],
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      if (ids.length === 0) {
        // Repository builds pagination metadata for empty result
        return {
          data: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }
      }

      const include = this.buildInclude(parsedIncludes)

      const vouchers = await this.prisma.voucher.findMany({
        where: {
          id: { in: ids },
          deletedAt: null,
        },
        include,
      })

      // Repository builds pagination metadata for bounded operation
      const voucherDomains = vouchers.map((voucher) =>
        VoucherMapper.fromDocument(voucher),
      )

      return {
        data: voucherDomains,
        pagination: {
          page: 1,
          limit: ids.length,
          total: vouchers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by ids', { error, ids })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByIds',
          'Failed to retrieve vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findByBusinessId(
    businessId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    return this.findAll({ ...params, businessId })
  }

  async findByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const {
        state,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'claimedAt',
        sortOrder = 'desc',
        parsedIncludes,
      } = params

      const where: any = {
        customerId: userId,
        voucher: {
          deletedAt: null,
        },
      }

      if (state) {
        if (Array.isArray(state)) {
          where.state = { in: state }
        } else {
          where.state = state
        }
      }

      const include = {
        voucher: {
          include: this.buildInclude(parsedIncludes),
        },
      }

      const [items, total] = await Promise.all([
        this.prisma.customerVoucher.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: (page - 1) * limit,
          take: limit,
          include,
        }),
        this.prisma.customerVoucher.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: items.map((item) => {
          const voucher = VoucherMapper.fromDocument(item.voucher)

          // Add user-specific state based on customer voucher status
          voucher.state =
            item.status === CustomerVoucherStatus.CLAIMED
              ? ('claimed' as VoucherState)
              : item.status === CustomerVoucherStatus.REDEEMED
                ? ('redeemed' as VoucherState)
                : voucher.state

          return voucher
        }),
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find vouchers by user id', { error, userId })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByUserId',
          'Failed to retrieve user vouchers',
          error,
        )
      }

      throw error
    }
  }

  async findUserVoucher(
    userId: string,
    voucherId: string,
  ): Promise<VoucherDomain | null> {
    try {
      const customerVoucher = await this.prisma.customerVoucher.findUnique({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        include: {
          voucher: true,
        },
      })

      if (!customerVoucher) {
        return null
      }

      const voucher = VoucherMapper.fromDocument(customerVoucher.voucher)

      // Add user-specific state based on customer voucher status
      voucher.state =
        customerVoucher.status === CustomerVoucherStatus.CLAIMED
          ? ('claimed' as VoucherState)
          : customerVoucher.status === CustomerVoucherStatus.REDEEMED
            ? ('redeemed' as VoucherState)
            : voucher.state

      return voucher
    } catch (error) {
      logger.error('Failed to find user voucher', {
        error,
        customerId: userId,
        voucherId,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findUserVoucher',
          'Failed to retrieve user voucher',
          error,
        )
      }

      throw error
    }
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    // Handle nested sorting for related fields
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.')

      return {
        [relation]: {
          [field]: sortOrder,
        },
      }
    }

    return {
      [sortBy]: sortOrder,
    }
  }

  private buildInclude(
    parsedIncludes?: ParsedIncludes,
  ): Prisma.VoucherInclude | undefined {
    return parsedIncludes && Object.keys(parsedIncludes).length > 0
      ? (toPrismaInclude(parsedIncludes) as Prisma.VoucherInclude)
      : undefined
  }

  async findByShortCode(shortCode: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findFirst({
        where: {
          OR: [
            { qrCode: shortCode }, // QR code field also stores short codes
            {
              codes: {
                some: {
                  code: shortCode,
                  type: VoucherCodeType.SHORT,
                  isActive: true,
                },
              },
            },
          ],
          deletedAt: null,
        },
        include: this.buildInclude(),
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by short code', { error, shortCode })
      throw ErrorFactory.fromError(error)
    }
  }

  async findByStaticCode(staticCode: string): Promise<VoucherDomain | null> {
    try {
      const voucher = await this.prisma.voucher.findFirst({
        where: {
          codes: {
            some: {
              code: staticCode,
              type: VoucherCodeType.STATIC,
              isActive: true,
            },
          },
          deletedAt: null,
        },
        include: this.buildInclude(),
      })

      if (!voucher) {
        return null
      }

      return VoucherMapper.fromDocument(voucher)
    } catch (error) {
      logger.error('Failed to find voucher by static code', {
        error,
        staticCode,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async findByAnyCode(code: string): Promise<VoucherDomain | null> {
    try {
      // Try all code types in order of likelihood
      // 1. Validation code (URL-based QR - NEW PRIMARY METHOD)
      const validationCode = await this.findValidationCode(code)

      if (validationCode && validationCode.voucherId) {
        const voucher = await this.findById(validationCode.voucherId)

        if (voucher) return voucher
      }

      // 2. Short code (human-readable codes - KEEP)
      let voucher = await this.findByShortCode(code)

      if (voucher) return voucher

      // 3. Static code (campaign codes - KEEP)
      voucher = await this.findByStaticCode(code)
      if (voucher) return voucher

      return null
    } catch (error) {
      logger.error('Failed to find voucher by any code', { error, code })
      throw ErrorFactory.fromError(error)
    }
  }

  async claimVoucher(
    voucherId: string,
    userId: string,
  ): Promise<CustomerVoucherDomain> {
    try {
      // Create customer voucher relationship
      const customerVoucher = await this.prisma.customerVoucher.create({
        data: {
          customerId: userId,
          voucherId,
          status: CustomerVoucherStatus.CLAIMED,
          claimedAt: new Date(),
        },
        include: {
          voucher: true,
        },
      })

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to claim voucher', { error, voucherId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async redeemVoucher(
    voucherId: string,
    userId: string,
    redemptionData?: VoucherRedemptionLogData,
  ): Promise<CustomerVoucherDomain> {
    try {
      // Update customer voucher to redeemed status
      const customerVoucher = await this.prisma.customerVoucher.update({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        data: {
          status: CustomerVoucherStatus.REDEEMED,
          redeemedAt: new Date(),
        },
        include: {
          voucher: true,
        },
      })

      // Increment the voucher's redemption count
      await this.incrementRedemptions(voucherId)

      // Log redemption asynchronously - non-blocking
      this.redemptionAnalytics
        .logRedemption(
          voucherId,
          userId,
          customerVoucher.voucher,
          redemptionData,
        )
        .catch((error) => {
          // Log error to APM/monitoring but don't block the user
          logger.error('Failed to log voucher redemption', {
            error,
            voucherId,
            userId,
            redemptionData,
            severity: 'warning',
            alertType: 'redemption_logging_failed',
          })
          // Here you would send to your APM service (e.g., Sentry, DataDog, etc.)
          // Example: Sentry.captureException(error, { tags: { type: 'redemption_log_failure' } })
        })

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to redeem voucher', { error, voucherId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async findCustomerVoucher(
    userId: string,
    voucherId: string,
  ): Promise<CustomerVoucherDomain | null> {
    try {
      const customerVoucher = await this.prisma.customerVoucher.findUnique({
        where: {
          customerId_voucherId: {
            customerId: userId,
            voucherId,
          },
        },
        include: {
          voucher: true,
        },
      })

      if (!customerVoucher) {
        return null
      }

      return VoucherMapper.mapCustomerVoucherFromDocument(
        this.convertPrismaCustomerVoucherToDocument(customerVoucher),
      )
    } catch (error) {
      logger.error('Failed to find customer voucher', {
        error,
        customerId: userId,
        voucherId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getCustomerVouchers(
    userId: string,
    status?: string,
  ): Promise<PaginatedResult<CustomerVoucherDomain>> {
    try {
      const whereClause: any = { customerId: userId }

      if (status && status !== 'all') {
        whereClause.status = status
      }

      const customerVouchers = await this.prisma.customerVoucher.findMany({
        where: whereClause,
        include: {
          voucher: true,
        },
        orderBy: {
          claimedAt: 'desc',
        },
      })

      // Repository builds pagination metadata for bounded operation
      const customerVoucherDomains = customerVouchers.map((cv) => {
        // Map Prisma result to CustomerVoucherDocument format
        const customerVoucherDoc: CustomerVoucherDocument = {
          id: cv.id,
          userId: cv.customerId, // Map customerId to userId
          voucherId: cv.voucherId,
          status: cv.status,
          claimedAt: cv.claimedAt,
          redeemedAt: cv.redeemedAt,
          expiresAt: cv.voucher?.validUntil || new Date(),
          redemptionCode: null,
          redemptionLocation: null,
          metadata: cv.notificationPreferences,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
          voucher: cv.voucher as any,
        }

        return VoucherMapper.mapCustomerVoucherFromDocument(customerVoucherDoc)
      })

      return {
        data: customerVoucherDomains,
        pagination: {
          page: 1,
          limit: customerVouchers.length,
          total: customerVouchers.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }
    } catch (error) {
      logger.error('Failed to get customer vouchers', {
        error,
        customerId: userId,
        status,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  private async incrementRedemptions(voucherId: string): Promise<void> {
    try {
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          redemptionsCount: { increment: 1 },
        },
      })
    } catch (error) {
      logger.error('Failed to increment redemptions', { error, voucherId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Helper method to convert Prisma CustomerVoucher to CustomerVoucherDocument
   */
  private convertPrismaCustomerVoucherToDocument(
    prismaCustomerVoucher: any,
  ): CustomerVoucherDocument {
    return {
      id: prismaCustomerVoucher.id,
      userId: prismaCustomerVoucher.customerId, // Map customerId to userId
      voucherId: prismaCustomerVoucher.voucherId,
      status: prismaCustomerVoucher.status,
      claimedAt: prismaCustomerVoucher.claimedAt,
      redeemedAt: prismaCustomerVoucher.redeemedAt,
      expiresAt: prismaCustomerVoucher.voucher?.validUntil || new Date(),
      redemptionCode: null,
      redemptionLocation: null,
      metadata: prismaCustomerVoucher.notificationPreferences,
      createdAt: prismaCustomerVoucher.createdAt,
      updatedAt: prismaCustomerVoucher.updatedAt,
      voucher: prismaCustomerVoucher.voucher || undefined,
    }
  }

  private buildWhereClause(params: VoucherSearchParams): any {
    const {
      businessId,
      type,
      state,
      search,
      minValue,
      maxValue,
      minDiscount,
      maxDiscount,
      validFrom,
      validUntil,
      maxRedemptions,
    } = params

    const where: any = { deletedAt: null }

    // Basic filters
    if (businessId) where.businessId = businessId
    if (type) where.type = type
    if (search) {
      where.OR = [
        { titleKey: { contains: search, mode: 'insensitive' } },
        { qrCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    // State filter (array or single value)
    if (state) {
      where.state = Array.isArray(state) ? { in: state } : state
    }

    // Range filters
    this.addRangeFilter(where, 'value', minValue, maxValue)
    this.addRangeFilter(where, 'discount', minDiscount, maxDiscount)

    // Date filters
    if (validFrom) where.validFrom = { lte: validFrom }
    if (validUntil) where.validUntil = { gte: validUntil }
    if (maxRedemptions !== undefined)
      where.maxRedemptions = { gte: maxRedemptions }

    return where
  }

  private addRangeFilter(
    where: any,
    field: string,
    min?: number,
    max?: number,
  ): void {
    if (min !== undefined || max !== undefined) {
      set(where, field, {})
      if (min !== undefined) set(where, `${field}.gte`, min)
      if (max !== undefined) set(where, `${field}.lte`, max)
    }
  }

  /**
   * Upsert a search query for popular searches tracking
   * Uses raw SQL for efficient upsert operation
   */
  async upsertSearchQuery(query: string): Promise<void> {
    try {
      // Use raw SQL for upsert since Prisma's upsert is not ideal for this use case
      await this.prisma.$executeRaw`
        INSERT INTO analytics.search_queries (query, count, last_searched, created_at, updated_at)
        VALUES (${query}, 1, NOW(), NOW(), NOW())
        ON CONFLICT (query) 
        DO UPDATE SET 
          count = analytics.search_queries.count + 1,
          last_searched = NOW(),
          updated_at = NOW()
      `
    } catch (error) {
      logger.warn('Failed to upsert search query', { error, query })
      // Don't throw - this is analytics, shouldn't break main functionality
    }
  }

  /**
   * Get popular search terms ordered by count
   * Returns the query strings only
   */
  async getPopularSearches(limit: number): Promise<string[]> {
    try {
      const results = await this.prisma.$queryRaw<Array<{ query: string }>>`
        SELECT query
        FROM analytics.search_queries
        ORDER BY count DESC, last_searched DESC
        LIMIT ${limit}
      `

      return results.map((row) => row.query)
    } catch (error) {
      logger.warn('Failed to get popular searches', { error, limit })

      return []
    }
  }

  // ============= Validation Code Methods (URL-based QR) =============

  /**
   * Create a new validation code for URL-based QR
   */
  async createValidationCode(data: CreateValidationCodeData): Promise<void> {
    try {
      await this.prisma.voucherValidationCode.create({
        data: {
          voucherId: data.voucherId,
          code: data.code,
          type: data.type as any, // Prisma enum conversion
          expiresAt: data.expiresAt,
        },
      })

      logger.debug('Created validation code', {
        voucherId: data.voucherId,
        code: data.code,
        type: data.type,
      })
    } catch (error) {
      logger.error('Failed to create validation code', { error, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.uniqueConstraintViolation(
            'ValidationCode',
            'code',
            data.code,
          )
        }
        throw ErrorFactory.databaseError(
          'createValidationCode',
          'Failed to create validation code',
          error,
        )
      }

      throw error
    }
  }

  /**
   * Find a validation code by code string
   */
  async findValidationCode(code: string): Promise<ValidationCodeRecord | null> {
    try {
      const validationCode = await this.prisma.voucherValidationCode.findUnique(
        {
          where: { code },
          include: {
            voucher: false, // Don't include voucher here, fetch separately if needed
          },
        },
      )

      if (!validationCode) {
        return null
      }

      // Map to ValidationCodeRecord type
      return {
        id: validationCode.id,
        voucherId: validationCode.voucherId,
        code: validationCode.code,
        type: validationCode.type as any, // Convert Prisma enum
        expiresAt: validationCode.expiresAt,
        usedAt: validationCode.usedAt,
        usedBy: validationCode.usedBy,
        createdAt: validationCode.createdAt,
      }
    } catch (error) {
      logger.error('Failed to find validation code', { error, code })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findValidationCode',
          'Failed to find validation code',
          error,
        )
      }

      throw error
    }
  }

  /**
   * Mark a validation code as used
   */
  async markValidationCodeUsed(code: string, userId: string): Promise<void> {
    try {
      await this.prisma.voucherValidationCode.update({
        where: { code },
        data: {
          usedAt: new Date(),
          usedBy: userId,
        },
      })

      logger.debug('Marked validation code as used', {
        code,
        userId,
      })
    } catch (error) {
      logger.error('Failed to mark validation code as used', {
        error,
        code,
        userId,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('ValidationCode', code)
        }
        throw ErrorFactory.databaseError(
          'markValidationCodeUsed',
          'Failed to mark validation code as used',
          error,
        )
      }

      throw error
    }
  }

  /**
   * Delete expired validation codes
   */
  async deleteExpiredValidationCodes(): Promise<number> {
    try {
      const result = await this.prisma.voucherValidationCode.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      logger.info('Deleted expired validation codes', {
        count: result.count,
      })

      return result.count
    } catch (error) {
      logger.error('Failed to delete expired validation codes', { error })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'deleteExpiredValidationCodes',
          'Failed to delete expired validation codes',
          error,
        )
      }

      throw error
    }
  }
}
