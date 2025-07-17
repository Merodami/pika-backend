import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'

/**
 * Command handler for deleting reviews
 * Delegates to repository for business logic
 */
export class DeleteReviewCommandHandler {
  constructor(private readonly repository: ReviewWriteRepositoryPort) {}

  /**
   * Executes the delete review command
   * Performs soft delete of a review
   */
  async execute(id: string, context: UserContext): Promise<void> {
    // Check if user has permission to delete reviews
    if (context.role !== UserRole.CUSTOMER) {
      throw new NotAuthorizedError('Only customers can delete their reviews', {
        source: 'DeleteReviewCommandHandler.execute',
        metadata: { role: context.role },
      })
    }

    try {
      // Pass user context for authorization check in repository
      const deleteData = {
        _requestingUserId: context.userId, // Repository will verify ownership
      }

      await this.repository.deleteReview(id, deleteData)
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

      throw ErrorFactory.fromError(error, 'Failed to delete review', {
        source: 'DeleteReviewCommandHandler.execute',
        suggestion:
          'Check that the review exists and you have permission to delete it',
        metadata: {
          reviewId: id,
          userId: context.userId,
        },
      })
    }
  }
}
