import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'
import type { GetVoucherQuery } from '@voucher-read/application/use_cases/queries/GetVoucherQuery.js'
import type { VoucherSearchQuery } from '@voucher-read/application/use_cases/queries/VoucherSearchQuery.js'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

import { VoucherDocumentMapper } from '../mappers/VoucherDocumentMapper.js'

/**
 * Prisma implementation of the VoucherReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaVoucherReadRepository implements VoucherReadRepositoryPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(
    params: VoucherSearchQuery,
  ): Prisma.VoucherWhereInput {
    const where: Prisma.VoucherWhereInput = {}

    // Filter by provider ID
    if (params.providerId) {
      where.providerId = params.providerId
    }

    // Filter by category ID
    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    // Filter by state
    if (params.state) {
      where.state = params.state
    }

    // Filter by discount type
    if (params.discountType) {
      where.discountType = params.discountType
    }

    // Filter by discount range
    if (params.minDiscount !== undefined || params.maxDiscount !== undefined) {
      where.discountValue = {}
      if (params.minDiscount !== undefined) {
        where.discountValue.gte = params.minDiscount
      }
      if (params.maxDiscount !== undefined) {
        where.discountValue.lte = params.maxDiscount
      }
    }

    // Add geospatial filter if location parameters are provided
    // TODO: Implement location filtering - see ai/todo/voucher-location-filtering.md
    // if (params.latitude && params.longitude && params.radius) {
    //   // This would use PostGIS ST_DWithin for location-based search
    //   // Actual implementation depends on Prisma PostGIS extension
    // }

    return where
  }

  /**
   * Builds a Prisma include clause for relations
   */
  private buildIncludeClause(includeCodes?: boolean): Prisma.VoucherInclude {
    const include: Prisma.VoucherInclude = {}

    if (includeCodes) {
      include.codes = {
        where: { isActive: true },
        orderBy: { type: 'asc' },
      }
    }

    return include
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   * Uses the standardized sort utility from shared package
   */
  private buildOrderByClause(
    params: VoucherSearchQuery,
  ): Prisma.VoucherOrderByWithRelationInput {
    // Use toPrismaSort utility for consistent handling of sort parameters
    const { sortBy, sortOrder } = params

    // Default to createdAt field if no sort is specified
    const sortField = sortBy || 'createdAt'
    const direction = sortOrder || 'desc'

    // Create and return the orderBy object
    return { [sortField]: direction }
  }

  /**
   * Retrieves all vouchers with filtering, pagination and sorting
   * Uses caching to improve performance for common queries
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getAllVouchers(
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const include = this.buildIncludeClause(params.includeCodes)
      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction for consistency
      const [total, vouchers] = await this.prisma.$transaction([
        this.prisma.voucher.count({ where }),
        this.prisma.voucher.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities using our helper function
      const data = vouchers.map((document: any) =>
        VoucherDocumentMapper.mapDocumentToDomain(document),
      )

      // Calculate pagination metadata
      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      // Use our advanced error handling - detect and categorize database errors
      if (error?.name === 'PrismaClientKnownRequestError') {
        throw ErrorFactory.databaseError(
          'query_vouchers',
          'Failed to query vouchers from database',
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaVoucherReadRepository.getAllVouchers',
            metadata: {
              params,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            suggestion: 'Check database connectivity and schema validity',
            retryable: true,
          },
        )
      }

      // Handle query parsing errors
      if (error?.name === 'PrismaClientValidationError') {
        throw ErrorFactory.databaseError(
          'validate_query',
          'Invalid query parameters for voucher search',
          error,
          {
            severity: ErrorSeverity.WARNING,
            source: 'PrismaVoucherReadRepository.getAllVouchers',
            metadata: { params },
            suggestion: 'Check the structure of the search parameters',
          },
        )
      }

      // Generic error fallback
      logger.error('Error retrieving vouchers:', error)
      throw ErrorFactory.fromError(
        error,
        'Failed to retrieve vouchers due to an unexpected error',
      )
    }
  }

  /**
   * Retrieves a single voucher by ID
   * Uses caching to improve performance for individual voucher lookups
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getVoucherById(params: GetVoucherQuery): Promise<Voucher | null> {
    try {
      const include = this.buildIncludeClause(params.includeCodes)

      const voucher = await this.prisma.voucher.findUnique({
        where: { id: params.id },
        include,
      })

      if (!voucher) {
        return null
      }

      return VoucherDocumentMapper.mapDocumentToDomain(voucher as any)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format for voucher ID: ${params.id}`] },
            {
              source: 'PrismaVoucherReadRepository.getVoucherById',
              metadata: { voucherId: params.id },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_voucher',
          `Failed to retrieve voucher with ID ${params.id}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaVoucherReadRepository.getVoucherById',
            metadata: {
              voucherId: params.id,
              includeCodes: params.includeCodes,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving voucher with ID ${params.id}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve voucher with ID ${params.id}`,
      )
    }
  }

  /**
   * Retrieves vouchers by provider ID with pagination
   */
  async getVouchersByProviderId(
    providerId: string,
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>> {
    // Add providerId to the search parameters
    const searchParams: VoucherSearchQuery = {
      ...params,
      providerId,
    }

    // Reuse the existing getAllVouchers method with provider filter
    return this.getAllVouchers(searchParams)
  }

  /**
   * Retrieves vouchers claimed by a specific user
   * This requires joining with the redemptions table
   */
  async getVouchersByUserId(
    userId: string,
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      // Build base where clause from params
      const baseWhere = this.buildWhereClause(params)

      // Add user redemption filter
      const where = {
        ...baseWhere,
        redemptions: {
          some: {
            userId: userId,
          },
        },
      }

      const include = {
        ...this.buildIncludeClause(params.includeCodes),
        redemptions: {
          where: { userId },
          select: {
            id: true,
            redeemedAt: true,
            codeUsed: true,
          },
        },
      }

      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction
      const [total, vouchers] = await this.prisma.$transaction([
        this.prisma.voucher.count({ where }),
        this.prisma.voucher.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map to domain entities
      const data = vouchers.map((document: any) =>
        VoucherDocumentMapper.mapDocumentToDomain(document),
      )

      // Calculate pagination metadata
      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      // Handle database errors
      if (error?.name === 'PrismaClientKnownRequestError') {
        throw ErrorFactory.databaseError(
          'query_user_vouchers',
          `Failed to query vouchers for user ${userId}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaVoucherReadRepository.getVouchersByUserId',
            metadata: {
              userId,
              params,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            suggestion: 'Check database connectivity and schema validity',
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving vouchers for user ${userId}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve vouchers for user ${userId}`,
      )
    }
  }

  /**
   * Get multiple vouchers by their IDs
   */
  async findByIds(voucherIds: string[]): Promise<any[]> {
    try {
      if (!voucherIds || voucherIds.length === 0) {
        return []
      }

      const vouchers = await this.prisma.voucher.findMany({
        where: {
          id: { in: voucherIds },
          deletedAt: null,
        },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      })

      logger.info('Vouchers fetched by IDs', {
        requested: voucherIds.length,
        found: vouchers.length,
      })

      return vouchers
    } catch (error) {
      logger.error('Database error in findByIds', error)
      throw ErrorFactory.databaseError('Voucher', 'Failed to fetch', error, {
        source: 'PrismaVoucherReadRepository.findByIds',
        metadata: { voucherIds },
      })
    }
  }
}
