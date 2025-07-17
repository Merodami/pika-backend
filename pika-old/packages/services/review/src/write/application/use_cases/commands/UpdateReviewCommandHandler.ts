import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type ReviewUpdateDTO } from '@review-write/domain/dtos/ReviewDTO.js'
import { Review } from '@review-write/domain/entities/Review.js'
import { type ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'

/**
 * Command handler for updating existing reviews
 * Delegates to repository for business logic
 */
export class UpdateReviewCommandHandler {
  constructor(private readonly repository: ReviewWriteRepositoryPort) {}

  /**
   * Executes the update review command
   * Validates and updates an existing review
   */
  async execute(
    id: string,
    dto: ReviewUpdateDTO,
    context: UserContext,
  ): Promise<Review> {
    // Check if user has permission to update reviews
    if (context.role !== UserRole.CUSTOMER) {
      throw new NotAuthorizedError('Only customers can update their reviews', {
        source: 'UpdateReviewCommandHandler.execute',
        metadata: { role: context.role },
      })
    }

    try {
      // Pass user context info in the update data for authorization check
      const updateData = {
        ...dto,
        _requestingUserId: context.userId, // Repository will verify ownership
      }

      return await this.repository.updateReview(id, updateData)
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

      throw ErrorFactory.fromError(error, 'Failed to update review', {
        source: 'UpdateReviewCommandHandler.execute',
        suggestion:
          'Check that the review exists and you have permission to update it',
        metadata: {
          reviewId: id,
          userId: context.userId,
        },
      })
    }
  }
}
