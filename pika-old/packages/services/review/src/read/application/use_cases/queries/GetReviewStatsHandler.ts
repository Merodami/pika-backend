import { ErrorFactory, logger } from '@pika/shared'
import { ReviewStatsDTO } from '@review-read/domain/dtos/ReviewDTO.js'
import { ReviewReadRepositoryPort } from '@review-read/domain/port/review/ReviewReadRepositoryPort.js'

/**
 * Query object for retrieving review statistics
 */
export interface GetReviewStatsQuery {
  providerId: string
  correlationId?: string
}

/**
 * Handler for retrieving review statistics for a provider
 * Implements the use case for fetching aggregated review data
 */
export class GetReviewStatsHandler {
  constructor(private readonly repository: ReviewReadRepositoryPort) {}

  /**
   * Execute the use case to retrieve review statistics
   * @param query Contains the provider ID
   * @returns Review statistics including average rating and distribution
   */
  async execute(query: GetReviewStatsQuery): Promise<ReviewStatsDTO> {
    try {
      logger.debug(`Fetching review stats for provider: ${query.providerId}`)

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!uuidRegex.test(query.providerId)) {
        throw ErrorFactory.validationError(
          { providerId: ['Invalid provider ID format'] },
          {
            source: 'GetReviewStatsHandler.execute',
            metadata: { providerId: query.providerId },
          },
        )
      }

      const stats = await this.repository.getReviewStats(query.providerId)

      logger.info(`Retrieved review stats for provider ${query.providerId}`, {
        totalReviews: stats.totalReviews,
        averageRating: stats.averageRating,
      })

      return stats
    } catch (error) {
      logger.error(
        `Error in GetReviewStatsHandler for provider ${query.providerId}:`,
        error,
      )
      throw error
    }
  }
}
