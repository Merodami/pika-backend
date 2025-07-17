import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type ReviewCreateDTO } from '@review-write/domain/dtos/ReviewDTO.js'
import { Review } from '@review-write/domain/entities/Review.js'
import { type ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'

/**
 * Command handler for creating new reviews
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateReviewCommandHandler {
  constructor(private readonly repository: ReviewWriteRepositoryPort) {}

  /**
   * Executes the create review command
   * Validates input, applies business rules, and persists the new review
   */
  async execute(dto: ReviewCreateDTO, context: UserContext): Promise<Review> {
    // Check if user has permission to create reviews
    if (context.role !== UserRole.CUSTOMER) {
      throw new NotAuthorizedError('Only customers can create reviews', {
        source: 'CreateReviewCommandHandler.execute',
        metadata: { role: context.role },
      })
    }

    try {
      // Set the customer ID from context
      const reviewData = {
        ...dto,
        customerId: context.userId,
      }

      return await this.repository.createReview(reviewData)
    } catch (error: any) {
      // Re-throw known application errors without wrapping
      if (
        error.code === 'RESOURCE_CONFLICT' ||
        error.code === 'NOT_AUTHORIZED' ||
        error.code === 'VALIDATION_ERROR' ||
        error.code === 'RESOURCE_NOT_FOUND' ||
        error.name === 'ApplicationError' ||
        error.name === 'NotAuthorizedError' ||
        error.name === 'ValidationError' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to create review', {
        source: 'CreateReviewCommandHandler.execute',
        suggestion: 'Check review data and try again',
        metadata: {
          providerId: dto.providerId,
          rating: dto.rating,
          userId: context.userId,
        },
      })
    }
  }
}
