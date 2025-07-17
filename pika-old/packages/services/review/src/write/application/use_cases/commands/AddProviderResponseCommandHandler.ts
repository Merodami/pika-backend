import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type ReviewResponseDTO } from '@review-write/domain/dtos/ReviewDTO.js'
import { Review } from '@review-write/domain/entities/Review.js'
import { type ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'

/**
 * Command handler for adding provider responses to reviews
 * Delegates to repository for business logic
 */
export class AddProviderResponseCommandHandler {
  constructor(private readonly repository: ReviewWriteRepositoryPort) {}

  /**
   * Executes the add provider response command
   * Adds a provider's response to an existing review
   */
  async execute(
    id: string,
    dto: ReviewResponseDTO,
    context: UserContext,
  ): Promise<Review> {
    // Check if user has permission to respond to reviews
    if (context.role !== UserRole.PROVIDER) {
      throw new NotAuthorizedError('Only providers can respond to reviews', {
        source: 'AddProviderResponseCommandHandler.execute',
        metadata: { role: context.role },
      })
    }

    try {
      // Pass provider ID from context for authorization check
      const responseData = {
        ...dto,
        _providerId: context.userId, // Repository will verify this provider owns the reviewed business
      }

      return await this.repository.addProviderResponse(id, responseData)
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

      throw ErrorFactory.fromError(error, 'Failed to add provider response', {
        source: 'AddProviderResponseCommandHandler.execute',
        suggestion:
          'Check that the review exists and you have permission to respond',
        metadata: {
          reviewId: id,
          providerId: context.userId,
        },
      })
    }
  }
}
