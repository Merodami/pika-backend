import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'
import type { GetReviewQuery } from '@review-read/application/use_cases/queries/GetReviewQuery.js'
import type { ReviewSearchQuery } from '@review-read/application/use_cases/queries/ReviewSearchQuery.js'
import { ReviewStatsDTO } from '@review-read/domain/dtos/ReviewDTO.js'
import { Review } from '@review-read/domain/entities/Review.js'
import { ReviewReadRepositoryPort } from '@review-read/domain/port/review/ReviewReadRepositoryPort.js'

import {
  type ReviewDocument,
  ReviewDocumentMapper,
} from '../mappers/ReviewDocumentMapper.js'

/**
 * Prisma implementation of the ReviewReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaReviewReadRepository implements ReviewReadRepositoryPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: ReviewSearchQuery): Prisma.ReviewWhereInput {
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null, // Exclude soft-deleted reviews
    }

    // Filter by provider ID
    if (params.providerId) {
      where.providerId = params.providerId
    }

    // Filter by customer ID
    if (params.customerId) {
      where.customerId = params.customerId
    }

    // Filter by rating
    if (params.rating) {
      where.rating = params.rating
    }

    // Filter by rating range
    if (params.minRating || params.maxRating) {
      where.rating = {}
      if (params.minRating) {
        where.rating.gte = params.minRating
      }
      if (params.maxRating) {
        where.rating.lte = params.maxRating
      }
    }

    // Filter by reviews with responses
    if (params.hasResponse !== undefined) {
      where.response = params.hasResponse ? { not: null } : null
    }

    // Filter by date range
    if (params.fromDate || params.toDate) {
      where.createdAt = {}
      if (params.fromDate) {
        where.createdAt.gte = new Date(params.fromDate)
      }
      if (params.toDate) {
        where.createdAt.lte = new Date(params.toDate)
      }
    }

    return where
  }

  /**
   * Builds a Prisma include clause for relations
   */
  private buildIncludeClause(
    includeRelations?: boolean,
  ): Prisma.ReviewInclude | undefined {
    if (!includeRelations) {
      return undefined
    }

    return {
      provider: {
        select: {
          id: true,
          businessName: true,
        },
      },
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    }
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   */
  private buildOrderByClause(
    params: ReviewSearchQuery,
  ): Prisma.ReviewOrderByWithRelationInput {
    const { sortBy, sortOrder } = params

    // Default to createdAt descending (newest first)
    const sortField = sortBy || 'createdAt'
    const direction = sortOrder || 'desc'

    return { [sortField]: direction }
  }

  /**
   * Retrieves all reviews with filtering, pagination and sorting
   */
  async getAllReviews(
    params: ReviewSearchQuery,
  ): Promise<PaginatedResult<Review>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const include = this.buildIncludeClause(params.includeRelations)
      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction for consistency
      const [total, reviews] = await this.prisma.$transaction([
        this.prisma.review.count({ where }),
        this.prisma.review.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities
      const data = reviews.map((document) =>
        ReviewDocumentMapper.mapDocumentToDomain(document as ReviewDocument),
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
      logger.error('Error fetching reviews:', error)
      throw ErrorFactory.databaseError(
        'review',
        'Failed to fetch reviews',
        error,
        {
          correlationId: params.correlationId,
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewReadRepository.getAllReviews',
        },
      )
    }
  }

  /**
   * Retrieves a single review by its unique identifier
   */
  async getReviewById(query: GetReviewQuery): Promise<Review | null> {
    try {
      const review = await this.prisma.review.findFirst({
        where: {
          id: query.id,
          deletedAt: null,
        },
        include: this.buildIncludeClause(query.includeRelations),
      })

      return review
        ? ReviewDocumentMapper.mapDocumentToDomain(review as ReviewDocument)
        : null
    } catch (error) {
      logger.error(`Error fetching review ${query.id}:`, error)
      throw ErrorFactory.databaseError(
        'review',
        `Failed to fetch review ${query.id}`,
        error,
        {
          correlationId: query.correlationId,
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewReadRepository.getReviewById',
        },
      )
    }
  }

  /**
   * Retrieves all reviews for a specific provider
   */
  async getReviewsByProvider(
    providerId: string,
    query: ReviewSearchQuery,
  ): Promise<PaginatedResult<Review>> {
    return this.getAllReviews({ ...query, providerId })
  }

  /**
   * Retrieves all reviews by a specific customer
   */
  async getReviewsByCustomer(
    customerId: string,
    query: ReviewSearchQuery,
  ): Promise<PaginatedResult<Review>> {
    return this.getAllReviews({ ...query, customerId })
  }

  /**
   * Get aggregated review statistics for a provider
   */
  async getReviewStats(providerId: string): Promise<ReviewStatsDTO> {
    try {
      // Get total count and average rating
      const stats = await this.prisma.review.aggregate({
        where: {
          providerId,
          deletedAt: null,
        },
        _count: true,
        _avg: {
          rating: true,
        },
      })

      // Get rating distribution
      const ratingDistribution = await this.prisma.review.groupBy({
        by: ['rating'],
        where: {
          providerId,
          deletedAt: null,
        },
        _count: true,
      })

      // Build distribution object
      const distribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }

      ratingDistribution.forEach((item) => {
        distribution[item.rating as 1 | 2 | 3 | 4 | 5] = item._count
      })

      // Calculate additional stats
      const reviewsWithText = await this.prisma.review.count({
        where: {
          providerId,
          review: { not: null },
          deletedAt: null,
        },
      })

      const reviewsWithResponse = await this.prisma.review.count({
        where: {
          providerId,
          response: { not: null },
          deletedAt: null,
        },
      })

      const responseRate =
        stats._count > 0 ? reviewsWithResponse / stats._count : 0

      return {
        providerId,
        totalReviews: stats._count,
        averageRating: stats._avg.rating || 0,
        ratingDistribution: distribution,
        reviewsWithText,
        responseRate,
      }
    } catch (error) {
      logger.error(
        `Error fetching review stats for provider ${providerId}:`,
        error,
      )
      throw ErrorFactory.databaseError(
        'review',
        `Failed to fetch review stats for provider ${providerId}`,
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewReadRepository.getReviewStats',
        },
      )
    }
  }

  /**
   * Check if a customer has already reviewed a provider
   */
  async hasCustomerReviewedProvider(
    customerId: string,
    providerId: string,
  ): Promise<boolean> {
    try {
      const count = await this.prisma.review.count({
        where: {
          customerId,
          providerId,
          deletedAt: null,
        },
      })

      return count > 0
    } catch (error) {
      logger.error('Error checking existing review:', error)
      throw ErrorFactory.databaseError(
        'review',
        'Failed to check existing review',
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewReadRepository.hasCustomerReviewedProvider',
        },
      )
    }
  }
}
