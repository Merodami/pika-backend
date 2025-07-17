import { RequestContext } from '@pika/http'
import { ReviewDomain, ReviewMapper } from '@pika/sdk'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { AddProviderResponseCommandHandler } from '@review-write/application/use_cases/commands/AddProviderResponseCommandHandler.js'
import { CreateReviewCommandHandler } from '@review-write/application/use_cases/commands/CreateReviewCommandHandler.js'
import { DeleteReviewCommandHandler } from '@review-write/application/use_cases/commands/DeleteReviewCommandHandler.js'
import { UpdateReviewCommandHandler } from '@review-write/application/use_cases/commands/UpdateReviewCommandHandler.js'
import { type ReviewCreateDTO } from '@review-write/domain/dtos/ReviewDTO.js'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Review write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class ReviewController {
  constructor(
    private readonly createHandler: CreateReviewCommandHandler,
    private readonly updateHandler: UpdateReviewCommandHandler,
    private readonly deleteHandler: DeleteReviewCommandHandler,
    private readonly addProviderResponseHandler: AddProviderResponseCommandHandler,
  ) {}

  /**
   * Create a new review
   * POST /reviews
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as ReviewCreateDTO

      const review = await this.createHandler.execute(dto, context)

      // Map domain entity to DTO format using SDK mapper
      const reviewDomain = review.toObject() as ReviewDomain
      const responseDTO = ReviewMapper.toDTO(reviewDomain)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating review:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Pass through specific error types
      if (
        error.name === 'ConflictError' ||
        error.code === 'CONFLICT' ||
        error.code === 'RESOURCE_CONFLICT'
      ) {
        throw error
      }

      if (error.name === 'ValidationError') {
        throw error
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to create review', {
        source: 'ReviewController.create',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Update an existing review
   * PUT /reviews/{id}
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as Partial<ReviewCreateDTO>

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'ReviewController.update',
            suggestion: 'Provide at least one field to update',
          },
        )
      }

      // Execute the command and return the result
      const review = await this.updateHandler.execute(id, dto, context)

      // Map domain entity to DTO format using SDK mapper
      const reviewDomain = review.toObject() as ReviewDomain
      const responseDTO = ReviewMapper.toDTO(reviewDomain)

      // Send response in the API schema format (snake_case)
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating review:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Review', request.params.id, {
          source: 'ReviewController.update',
          httpStatus: 404,
          suggestion: 'Check that the review ID exists',
        })
      }

      if (
        error.name === 'ForbiddenError' ||
        error.code === 'FORBIDDEN' ||
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        throw error // Pass through forbidden errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update review', {
        source: 'ReviewController.update',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          reviewId: request.params.id,
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Delete an existing review (soft delete)
   * DELETE /reviews/{id}
   */
  async delete(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      // Execute the command
      await this.deleteHandler.execute(id, context)

      // Return success with no content
      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting review:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Review', request.params.id, {
          source: 'ReviewController.delete',
          httpStatus: 404,
          suggestion: 'Check that the review ID exists',
        })
      }

      if (
        error.name === 'ForbiddenError' ||
        error.code === 'FORBIDDEN' ||
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        throw error // Pass through forbidden errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to delete review', {
        source: 'ReviewController.delete',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { reviewId: request.params.id },
        suggestion: 'Check if you have permission to delete this review',
      })
    }
  }

  /**
   * Add provider response to a review
   * POST /reviews/{id}/response
   */
  async addProviderResponse(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as { response: string }

      // Validate response is provided
      if (!dto.response || dto.response.trim().length === 0) {
        throw ErrorFactory.validationError(
          { response: ['Response text is required'] },
          {
            source: 'ReviewController.addProviderResponse',
            suggestion: 'Provide a response message',
          },
        )
      }

      // Execute the command
      const review = await this.addProviderResponseHandler.execute(
        id,
        dto,
        context,
      )

      // Map domain entity to DTO format using SDK mapper
      const reviewDomain = review.toObject() as ReviewDomain
      const responseDTO = ReviewMapper.toDTO(reviewDomain)

      // Send response
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error adding provider response:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Review', request.params.id, {
          source: 'ReviewController.addProviderResponse',
          httpStatus: 404,
          suggestion: 'Check that the review ID exists',
        })
      }

      if (
        error.name === 'ForbiddenError' ||
        error.code === 'FORBIDDEN' ||
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        throw error // Pass through forbidden errors
      }

      if (
        error.name === 'ConflictError' ||
        error.code === 'CONFLICT' ||
        error.code === 'RESOURCE_CONFLICT'
      ) {
        throw error // Pass through conflict errors
      }

      if (error.name === 'BusinessRuleViolationError') {
        throw ErrorFactory.businessRuleViolation(
          'Provider has already responded to this review',
          'Each review can only have one provider response',
          {
            source: 'ReviewController.addProviderResponse',
            correlationId: request.id,
          },
        )
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to add provider response', {
        source: 'ReviewController.addProviderResponse',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { reviewId: request.params.id },
        suggestion: 'Check if you have permission to respond to this review',
      })
    }
  }
}
