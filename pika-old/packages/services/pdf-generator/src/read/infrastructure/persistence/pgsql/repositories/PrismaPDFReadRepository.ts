import type { GetVoucherBookQuery } from '@pdf-read/application/use_cases/queries/GetVoucherBookQuery.js'
import type { VoucherBookSearchQuery } from '@pdf-read/application/use_cases/queries/VoucherBookSearchQuery.js'
import { VoucherBook } from '@pdf-read/domain/entities/VoucherBook.js'
import { PDFReadRepositoryPort } from '@pdf-read/domain/port/pdf/PDFReadRepositoryPort.js'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'
import { get } from 'lodash-es'

import {
  type VoucherBookDocument,
  VoucherBookDocumentMapper,
} from '../mappers/VoucherBookDocumentMapper.js'
import {
  VoucherBookInclude,
  VoucherBookOrderByInput,
  VoucherBookWhereInput,
} from '../types/PrismaTypes.js'

/**
 * Prisma implementation of the PDFReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaPDFReadRepository implements PDFReadRepositoryPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(
    params: VoucherBookSearchQuery,
  ): VoucherBookWhereInput {
    const where: VoucherBookWhereInput = {
      // Always exclude soft-deleted records
      deletedAt: null,
    }

    // Filter by status
    if (params.status) {
      where.status = params.status
    }

    // Filter by book type
    if (params.bookType) {
      where.bookType = params.bookType
    }

    // Filter by year
    if (params.year !== undefined) {
      where.year = params.year
    }

    // Filter by month
    if (params.month !== undefined) {
      where.month = params.month
    }

    // Filter by edition
    if (params.edition) {
      where.edition = params.edition
    }

    return where
  }

  /**
   * Builds a Prisma include clause for relations
   */
  private buildIncludeClause(includePages?: boolean): VoucherBookInclude {
    const include: VoucherBookInclude = {}

    if (includePages) {
      include.pages = {
        orderBy: { pageNumber: 'asc' },
        include: {
          adPlacements: {
            orderBy: { position: 'asc' },
          },
        },
      }
    }

    return include
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   * Uses the standardized sort utility from shared package
   */
  private buildOrderByClause(
    params: VoucherBookSearchQuery,
  ): VoucherBookOrderByInput {
    // Use toPrismaSort utility for consistent handling of sort parameters
    const { sortBy, sortOrder } = params

    // Default to year/month desc if no sort is specified
    const sortField = sortBy || 'year'
    const direction = sortOrder || 'desc'

    // Map domain field names to Prisma field names
    const fieldMap: Record<string, string> = {
      year: 'year',
      month: 'month',
      createdAt: 'createdAt',
      publishedAt: 'publishedAt',
      title: 'title',
    }

    const prismaField = get(fieldMap, sortField, 'year')

    return { [prismaField]: direction }
  }

  /**
   * Retrieve all voucher books
   */
  public async getAllVoucherBooks(
    query: VoucherBookSearchQuery,
  ): Promise<PaginatedResult<VoucherBook>> {
    const cacheKey = `voucher_books:${JSON.stringify(query)}`

    // Try to get from cache if available
    if (this.cacheService) {
      const cached =
        await this.cacheService.get<PaginatedResult<VoucherBook>>(cacheKey)

      if (cached) {
        logger.debug('Returning cached voucher books')

        return cached
      }
    }

    try {
      const { page = 1, limit = 20 } = query
      const skip = (page - 1) * limit

      const where = this.buildWhereClause(query)
      const include = this.buildIncludeClause(query.includePages)
      const orderBy = this.buildOrderByClause(query)

      // Execute count and find in parallel for performance
      const [total, voucherBooks] = await Promise.all([
        this.prisma.voucherBook.count({ where }),
        this.prisma.voucherBook.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Convert Prisma models to domain entities using mapper
      const domainVoucherBooks = voucherBooks.map((book) =>
        VoucherBookDocumentMapper.mapDocumentToDomain(
          book as VoucherBookDocument,
        ),
      )

      const result: PaginatedResult<VoucherBook> = {
        data: domainVoucherBooks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      }

      // Cache the result if caching is available
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, result, 300) // Cache for 5 minutes
      }

      return result
    } catch (error) {
      logger.error('Error in getAllVoucherBooks:', error)

      throw ErrorFactory.databaseError(
        'get_all_voucher_books',
        'Failed to retrieve voucher books',
        error,
        {
          source: 'PrismaPDFReadRepository.getAllVoucherBooks',
          severity: ErrorSeverity.ERROR,
          metadata: { query },
        },
      )
    }
  }

  /**
   * Retrieve a voucher book by ID
   */
  public async getVoucherBookById(
    query: GetVoucherBookQuery,
  ): Promise<VoucherBook | null> {
    const cacheKey = `voucher_book:${query.id}:${query.includePages}`

    // Try to get from cache if available
    if (this.cacheService) {
      const cached = await this.cacheService.get<VoucherBook>(cacheKey)

      if (cached) {
        logger.debug(`Returning cached voucher book ${query.id}`)

        return cached
      }
    }

    try {
      const include = this.buildIncludeClause(query.includePages)

      const voucherBook = await this.prisma.voucherBook.findFirst({
        where: {
          id: query.id,
          deletedAt: null,
        },
        include,
      })

      if (!voucherBook) {
        return null
      }

      // Convert to domain entity using mapper
      const domainVoucherBook = VoucherBookDocumentMapper.mapDocumentToDomain(
        voucherBook as VoucherBookDocument,
      )

      // Cache the result if caching is available
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, domainVoucherBook, 600) // Cache for 10 minutes
      }

      return domainVoucherBook
    } catch (error) {
      logger.error(`Error in getVoucherBookById for ID ${query.id}:`, error)

      throw ErrorFactory.databaseError(
        'get_voucher_book_by_id',
        `Failed to retrieve voucher book ${query.id}`,
        error,
        {
          source: 'PrismaPDFReadRepository.getVoucherBookById',
          severity: ErrorSeverity.ERROR,
          metadata: { voucherBookId: query.id },
        },
      )
    }
  }
}
