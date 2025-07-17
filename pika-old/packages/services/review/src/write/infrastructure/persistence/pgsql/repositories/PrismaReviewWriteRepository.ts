import { BaseError, ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import {
  type ReviewCreateDTO,
  type ReviewResponseDTO,
  type ReviewUpdateDTO,
} from '@review-write/domain/dtos/ReviewDTO.js'
import { Review } from '@review-write/domain/entities/Review.js'
import { ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'

import {
  ReviewDocumentMapper,
  type ReviewWriteDocument,
} from '../mappers/ReviewDocumentMapper.js'

/**
 * Prisma implementation of the ReviewWriteRepository interface
 * Handles write operations for reviews including creation, updates, deletion, and provider responses
 */
export class PrismaReviewWriteRepository implements ReviewWriteRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new review
   */
  async createReview(dto: ReviewCreateDTO): Promise<Review> {
    try {
      const { customerId, providerId, rating, review } = dto

      if (!customerId) {
        throw ErrorFactory.validationError(
          { customerId: ['Customer ID is required'] },
          {
            source: 'PrismaReviewWriteRepository.createReview',
          },
        )
      }

      // Check if customer has already reviewed this provider
      const existingReview = await this.hasCustomerReviewedProvider(
        customerId,
        providerId,
      )

      if (existingReview) {
        throw ErrorFactory.resourceConflict(
          'Review',
          'Customer has already reviewed this provider',
          {
            source: 'PrismaReviewWriteRepository.createReview',
            metadata: { customerId, providerId },
          },
        )
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw ErrorFactory.validationError(
          { rating: ['Rating must be between 1 and 5'] },
          {
            source: 'PrismaReviewWriteRepository.createReview',
            metadata: { rating },
          },
        )
      }

      // Create domain entity
      const reviewEntity = Review.create({
        providerId,
        customerId,
        rating,
        review: review || null,
        response: null,
        responseAt: null,
      })

      // Map to database format
      const createData =
        ReviewDocumentMapper.mapDomainToCreateData(reviewEntity)

      const reviewRecord = await this.prisma.review.create({
        data: {
          id: reviewEntity.id,
          ...createData,
        },
      })

      logger.info(`Review created successfully`, {
        reviewId: reviewRecord.id,
        providerId: reviewRecord.providerId,
        customerId: reviewRecord.customerId,
      })

      return ReviewDocumentMapper.mapDocumentToDomain(
        reviewRecord as ReviewWriteDocument,
      )
    } catch (error: any) {
      // Debug logging
      logger.debug('Caught error in createReview:', {
        errorName: error.name,
        errorConstructor: error.constructor?.name,
        isBaseError: error instanceof BaseError,
        errorCode: error.code,
        errorMessage: error.message,
      })

      // Re-throw known application errors
      if (error instanceof BaseError) {
        throw error
      }

      logger.error('Error creating review:', error)
      throw ErrorFactory.databaseError(
        'review',
        'Failed to create review',
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewWriteRepository.createReview',
        },
      )
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(id: string, dto: ReviewUpdateDTO): Promise<Review> {
    const customerId = dto._requestingUserId

    if (!customerId) {
      throw ErrorFactory.validationError(
        { customerId: ['Customer ID is required for authorization'] },
        {
          source: 'PrismaReviewWriteRepository.updateReview',
        },
      )
    }

    try {
      // Check if review exists and belongs to the customer
      const existingReview = await this.getReviewById(id)

      if (!existingReview) {
        throw ErrorFactory.resourceNotFound('Review', id, {
          source: 'PrismaReviewWriteRepository.updateReview',
        })
      }

      if (existingReview.customerId !== customerId) {
        throw ErrorFactory.forbidden(
          'Only the review author can update their review',
          {
            source: 'PrismaReviewWriteRepository.updateReview',
          },
        )
      }

      if (existingReview.isDeleted()) {
        throw ErrorFactory.validationError(
          { review: ['Cannot update a deleted review'] },
          {
            source: 'PrismaReviewWriteRepository.updateReview',
          },
        )
      }

      // Update domain entity
      let updatedReview = existingReview

      // Update review text if provided
      if (dto.review !== undefined) {
        updatedReview = updatedReview.update(dto.review)
      }

      // If rating is being changed, we need to recreate the entity with new rating
      if (dto.rating && dto.rating !== existingReview.rating) {
        // Validate rating
        if (dto.rating < 1 || dto.rating > 5) {
          throw ErrorFactory.validationError(
            { rating: ['Rating must be between 1 and 5'] },
            {
              source: 'PrismaReviewWriteRepository.updateReview',
              metadata: { rating: dto.rating },
            },
          )
        }

        // Recreate entity with new rating
        updatedReview = Review.reconstitute({
          ...updatedReview.toObject(),
          rating: dto.rating,
          updatedAt: new Date(),
        })
      }

      // Map to update data
      const updateData =
        ReviewDocumentMapper.mapDomainToUpdateData(updatedReview)

      const review = await this.prisma.review.update({
        where: { id },
        data: updateData,
      })

      logger.info(`Review updated successfully`, { reviewId: id })

      return ReviewDocumentMapper.mapDocumentToDomain(
        review as ReviewWriteDocument,
      )
    } catch (error) {
      // Re-throw known application errors
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

      logger.error(`Error updating review ${id}:`, error)
      throw ErrorFactory.databaseError(
        'review',
        `Failed to update review ${id}`,
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewWriteRepository.updateReview',
        },
      )
    }
  }

  /**
   * Delete a review (soft delete)
   */
  async deleteReview(
    id: string,
    dto: { _requestingUserId: string },
  ): Promise<void> {
    const customerId = dto._requestingUserId

    if (!customerId) {
      throw ErrorFactory.validationError(
        { customerId: ['Customer ID is required for authorization'] },
        {
          source: 'PrismaReviewWriteRepository.deleteReview',
        },
      )
    }

    try {
      // Check if review exists and belongs to the customer
      const existingReview = await this.getReviewById(id)

      if (!existingReview) {
        throw ErrorFactory.resourceNotFound('Review', id, {
          source: 'PrismaReviewWriteRepository.deleteReview',
        })
      }

      if (existingReview.customerId !== customerId) {
        throw ErrorFactory.forbidden(
          'Only the review author can delete their review',
          {
            source: 'PrismaReviewWriteRepository.deleteReview',
          },
        )
      }

      if (existingReview.isDeleted()) {
        logger.warn(`Review ${id} is already deleted`)

        return
      }

      // Soft delete using domain method
      const deletedReview = existingReview.delete()

      // Map to update data
      const updateData =
        ReviewDocumentMapper.mapDomainToUpdateData(deletedReview)

      await this.prisma.review.update({
        where: { id },
        data: updateData,
      })

      logger.info(`Review deleted successfully`, { reviewId: id })
    } catch (error) {
      // Re-throw known application errors
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

      logger.error(`Error deleting review ${id}:`, error)
      throw ErrorFactory.databaseError(
        'review',
        `Failed to delete review ${id}`,
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewWriteRepository.deleteReview',
        },
      )
    }
  }

  /**
   * Add a provider response to a review
   */
  async addProviderResponse(
    reviewId: string,
    dto: ReviewResponseDTO,
  ): Promise<Review> {
    const providerId = dto._providerId

    if (!providerId) {
      throw ErrorFactory.validationError(
        { providerId: ['Provider ID is required for authorization'] },
        {
          source: 'PrismaReviewWriteRepository.addProviderResponse',
        },
      )
    }

    try {
      // Check if review exists
      const existingReview = await this.getReviewById(reviewId)

      if (!existingReview) {
        throw ErrorFactory.resourceNotFound('Review', reviewId, {
          source: 'PrismaReviewWriteRepository.addProviderResponse',
        })
      }

      // Check if review belongs to the provider
      if (existingReview.providerId !== providerId) {
        throw ErrorFactory.forbidden(
          'Only the reviewed provider can respond to this review',
          {
            source: 'PrismaReviewWriteRepository.addProviderResponse',
          },
        )
      }

      if (existingReview.isDeleted()) {
        throw ErrorFactory.validationError(
          { review: ['Cannot respond to a deleted review'] },
          {
            source: 'PrismaReviewWriteRepository.addProviderResponse',
          },
        )
      }

      // Check if provider has already responded
      if (existingReview.hasProviderResponse()) {
        throw ErrorFactory.resourceConflict(
          'Review',
          'Provider has already responded to this review',
          {
            source: 'PrismaReviewWriteRepository.addProviderResponse',
          },
        )
      }

      // Add provider response using domain method
      const updatedReview = existingReview.addProviderResponse(dto.response)

      // Map to update data
      const updateData =
        ReviewDocumentMapper.mapDomainToUpdateData(updatedReview)

      const review = await this.prisma.review.update({
        where: { id: reviewId },
        data: updateData,
      })

      logger.info(`Provider response added successfully`, {
        reviewId,
        providerId,
      })

      return ReviewDocumentMapper.mapDocumentToDomain(
        review as ReviewWriteDocument,
      )
    } catch (error) {
      // Re-throw known application errors
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

      logger.error(
        `Error adding provider response to review ${reviewId}:`,
        error,
      )
      throw ErrorFactory.databaseError(
        'review',
        `Failed to add provider response to review ${reviewId}`,
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewWriteRepository.addProviderResponse',
        },
      )
    }
  }

  /**
   * Check if a customer has already reviewed a specific provider
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
          source: 'PrismaReviewWriteRepository.hasCustomerReviewedProvider',
        },
      )
    }
  }

  /**
   * Get a review by ID (for authorization checks)
   */
  async getReviewById(id: string): Promise<Review | null> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
      })

      return review
        ? ReviewDocumentMapper.mapDocumentToDomain(
            review as ReviewWriteDocument,
          )
        : null
    } catch (error) {
      logger.error(`Error fetching review ${id}:`, error)
      throw ErrorFactory.databaseError(
        'review',
        `Failed to fetch review ${id}`,
        error,
        {
          severity: ErrorSeverity.ERROR,
          source: 'PrismaReviewWriteRepository.getReviewById',
        },
      )
    }
  }
}
