import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ErrorFactory, ErrorSeverity } from '@pika/shared'
import { adaptReviewSearchQuery } from '@review-read/application/adapters/sortingAdapter.js'
import {
  GetAllReviewsHandler,
  GetReviewByIdHandler,
  GetReviewStatsHandler,
} from '@review-read/application/use_cases/queries/index.js'
import { ReviewDomainAdapter } from '@review-read/infrastructure/mappers/ReviewDomainAdapter.js'
import type { FastifyRequest } from 'fastify'

/**
 * Controller handling HTTP requests for review read operations
 * Implements proper caching for performance
 */
export class ReviewController {
  constructor(
    private readonly getAllReviewsHandler: GetAllReviewsHandler,
    private readonly getReviewByIdHandler: GetReviewByIdHandler,
    private readonly getReviewStatsHandler: GetReviewStatsHandler,
  ) {
    this.getAllReviews = this.getAllReviews.bind(this)
    this.getReviewById = this.getReviewById.bind(this)
    this.getReviewsByProvider = this.getReviewsByProvider.bind(this)
    this.getReviewsByCustomer = this.getReviewsByCustomer.bind(this)
    this.getProviderStats = this.getProviderStats.bind(this)
  }

  /**
   * GET /reviews
   * Get all reviews with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'reviews',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllReviews(
    request: FastifyRequest<{
      Querystring: schemas.ReviewSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.ReviewSearchQuery

      // Use the adapter to convert API query to domain model format
      const searchParams = adaptReviewSearchQuery(query)

      const result = await this.getAllReviewsHandler.execute(searchParams)

      // Convert domain models to API DTOs
      const dtoResult = {
        data: result.data.map((review) => ReviewDomainAdapter.toDTO(review)),
        pagination: result.pagination,
      }

      return dtoResult
    } catch (error) {
      // Transform the error using proper error system
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'ReviewController.getAllReviews',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_reviews',
          'Failed to fetch reviews from database',
          error,
          {
            correlationId: request.id,
            source: 'ReviewController.getAllReviews',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /reviews/providers/:providerId
   * Get reviews for a specific provider
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'reviews:provider',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getReviewsByProvider(
    request: FastifyRequest<{
      Params: { providerId: string }
      Querystring: schemas.ReviewSearchQuery
    }>,
  ) {
    try {
      const { providerId } = request.params
      const query = request.query as schemas.ReviewSearchQuery

      // Merge provider ID into search params
      const searchParams = {
        ...adaptReviewSearchQuery(query),
        providerId,
      }

      const result = await this.getAllReviewsHandler.execute(searchParams)

      // Convert domain models to API DTOs
      const dtoResult = {
        data: result.data.map((review) => ReviewDomainAdapter.toDTO(review)),
        pagination: result.pagination,
      }

      return dtoResult
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_reviews_by_provider',
          `Failed to fetch reviews for provider ${request.params.providerId}`,
          error,
          {
            correlationId: request.id,
            source: 'ReviewController.getReviewsByProvider',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /reviews/customers/:customerId
   * Get reviews by a specific customer
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'reviews:customer',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getReviewsByCustomer(
    request: FastifyRequest<{
      Params: { customerId: string }
      Querystring: schemas.ReviewSearchQuery
    }>,
  ) {
    try {
      const { customerId } = request.params
      const query = request.query as schemas.ReviewSearchQuery

      // Merge customer ID into search params
      const searchParams = {
        ...adaptReviewSearchQuery(query),
        customerId,
      }

      const result = await this.getAllReviewsHandler.execute(searchParams)

      // Convert domain models to API DTOs
      const dtoResult = {
        data: result.data.map((review) => ReviewDomainAdapter.toDTO(review)),
        pagination: result.pagination,
      }

      return dtoResult
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_reviews_by_customer',
          `Failed to fetch reviews for customer ${request.params.customerId}`,
          error,
          {
            correlationId: request.id,
            source: 'ReviewController.getReviewsByCustomer',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /reviews/:id
   * Get a specific review by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'reviews',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getReviewById(
    request: FastifyRequest<{
      Params: { id: string }
      Querystring: {
        include_relations?: boolean
      }
    }>,
  ) {
    try {
      const { id } = request.params
      const { include_relations } = request.query

      const review = await this.getReviewByIdHandler.execute({
        id,
        includeRelations:
          include_relations === undefined
            ? undefined
            : Boolean(include_relations),
      })

      if (!review) {
        throw ErrorFactory.resourceNotFound('Review', id, {
          correlationId: request.id,
          source: 'ReviewController.getReviewById',
          suggestion:
            'Check that the review ID exists and is in the correct format',
        })
      }

      // Convert domain model to API DTO
      return ReviewDomainAdapter.toDTO(review)
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_review_by_id',
          `Failed to fetch review ${request.params.id}`,
          error,
          {
            correlationId: request.id,
            source: 'ReviewController.getReviewById',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /reviews/providers/:providerId/stats
   * Get review statistics for a provider
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL * 2, // Cache stats longer
    prefix: 'reviews:stats',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProviderStats(
    request: FastifyRequest<{
      Params: { providerId: string }
    }>,
  ) {
    try {
      const { providerId } = request.params

      const stats = await this.getReviewStatsHandler.execute({
        providerId,
      })

      // Convert camelCase to snake_case for API response
      return {
        total_reviews: stats.totalReviews,
        average_rating: stats.averageRating,
        rating_distribution: stats.ratingDistribution,
        reviews_with_text: stats.reviewsWithText,
        response_rate: stats.responseRate,
      }
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_provider_stats',
          `Failed to fetch statistics for provider ${request.params.providerId}`,
          error,
          {
            correlationId: request.id,
            source: 'ReviewController.getProviderStats',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }
}
