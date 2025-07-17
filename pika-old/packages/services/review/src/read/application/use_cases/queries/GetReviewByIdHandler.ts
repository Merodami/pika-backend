import { ErrorFactory, logger } from '@pika/shared'
import { GetReviewQuery } from '@review-read/application/use_cases/queries/GetReviewQuery.js'
import { Review } from '@review-read/domain/entities/Review.js'
import { ReviewReadRepositoryPort } from '@review-read/domain/port/review/ReviewReadRepositoryPort.js'

/**
 * Handler for retrieving a single review by ID
 * Implements the use case for fetching review details
 */
export class GetReviewByIdHandler {
  constructor(private readonly repository: ReviewReadRepositoryPort) {}

  /**
   * Execute the use case to retrieve a review by ID
   * @param query Contains the review ID and optional flags
   * @returns The review or null if not found
   */
  async execute(query: GetReviewQuery): Promise<Review | null> {
    try {
      logger.debug(`Fetching review with ID: ${query.id}`)

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!uuidRegex.test(query.id)) {
        throw ErrorFactory.validationError(
          { id: ['Invalid review ID format'] },
          {
            source: 'GetReviewByIdHandler.execute',
            metadata: { id: query.id },
          },
        )
      }

      const review = await this.repository.getReviewById(query)

      if (!review) {
        logger.warn(`Review not found with ID: ${query.id}`)

        return null
      }

      logger.info(`Retrieved review ${query.id}`)

      return review
    } catch (error) {
      logger.error(`Error in GetReviewByIdHandler for ID ${query.id}:`, error)
      throw error
    }
  }
}
