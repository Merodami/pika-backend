import { logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { ReviewSearchQuery } from '@review-read/application/use_cases/queries/ReviewSearchQuery.js'
import { Review } from '@review-read/domain/entities/Review.js'
import { ReviewReadRepositoryPort } from '@review-read/domain/port/review/ReviewReadRepositoryPort.js'

/**
 * Handler for retrieving all reviews with search, filter and pagination
 * Implements the use case for listing reviews
 */
export class GetAllReviewsHandler {
  constructor(private readonly repository: ReviewReadRepositoryPort) {}

  /**
   * Execute the use case to retrieve all reviews
   * @param query Search and pagination parameters
   * @returns Paginated list of reviews
   */
  async execute(query: ReviewSearchQuery): Promise<PaginatedResult<Review>> {
    try {
      logger.debug('Fetching reviews with query:', query)

      // Validate query parameters
      if (query.minRating && (query.minRating < 1 || query.minRating > 5)) {
        throw new Error('minRating must be between 1 and 5')
      }
      if (query.maxRating && (query.maxRating < 1 || query.maxRating > 5)) {
        throw new Error('maxRating must be between 1 and 5')
      }
      if (
        query.minRating &&
        query.maxRating &&
        query.minRating > query.maxRating
      ) {
        throw new Error('minRating cannot be greater than maxRating')
      }

      // If specific provider or customer is requested, use optimized methods
      if (query.providerId && !query.customerId) {
        return await this.repository.getReviewsByProvider(
          query.providerId,
          query,
        )
      }

      if (query.customerId && !query.providerId) {
        return await this.repository.getReviewsByCustomer(
          query.customerId,
          query,
        )
      }

      // Otherwise, use general search
      const result = await this.repository.getAllReviews(query)

      logger.info(`Retrieved ${result.data.length} reviews`, {
        total: result.pagination.total,
        page: result.pagination.page,
      })

      return result
    } catch (error) {
      logger.error('Error in GetAllReviewsHandler:', error)
      throw error
    }
  }
}
