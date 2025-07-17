import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { FastifyRequest } from 'fastify'

import { GetMessagesQueryHandler } from '../../application/use_cases/queries/GetMessagesQueryHandler.js'
import {
  GetMessagesQueryDTO,
  GetMessagesResponseDTO,
} from '../../domain/dtos/index.js'

/**
 * Controller for Message read operations
 * Handles HTTP requests, delegates to query handlers, and handles responses
 */
export class MessageController {
  constructor(private readonly getMessagesHandler: GetMessagesQueryHandler) {}

  /**
   * Get messages from a conversation
   * GET /conversations/{conversationId}/messages
   */
  async getByConversation(
    request: FastifyRequest<{
      Params: { conversationId: string }
      Querystring: schemas.GetMessagesQuery
    }>,
  ): Promise<GetMessagesResponseDTO> {
    // Extract user context from request
    const context = RequestContext.fromHeaders(request)
    const userId = context.userId

    try {
      // Validate conversation ID format
      if (
        !request.params.conversationId ||
        request.params.conversationId.trim() === ''
      ) {
        throw ErrorFactory.validationError(
          { conversationId: ['Conversation ID is required'] },
          {
            correlationId: request.id,
            source: 'MessageController.getByConversation',
            suggestion: 'Provide a valid conversation ID',
          },
        )
      }

      // Validate query parameters
      if (request.query.limit !== undefined) {
        const limit = Number(request.query.limit)

        if (isNaN(limit) || limit < 1 || limit > 100) {
          throw ErrorFactory.validationError(
            { limit: ['Limit must be a number between 1 and 100'] },
            {
              correlationId: request.id,
              source: 'MessageController.getByConversation',
              suggestion: 'Provide a valid limit parameter',
            },
          )
        }
      }

      // Validate date parameters
      if (request.query.before && isNaN(Date.parse(request.query.before))) {
        throw ErrorFactory.validationError(
          { before: ['Invalid date format for "before" parameter'] },
          {
            correlationId: request.id,
            source: 'MessageController.getByConversation',
            suggestion: 'Use ISO 8601 date format (e.g., 2024-01-01T00:00:00Z)',
          },
        )
      }

      if (request.query.after && isNaN(Date.parse(request.query.after))) {
        throw ErrorFactory.validationError(
          { after: ['Invalid date format for "after" parameter'] },
          {
            correlationId: request.id,
            source: 'MessageController.getByConversation',
            suggestion: 'Use ISO 8601 date format (e.g., 2024-01-01T00:00:00Z)',
          },
        )
      }

      // Convert API schema to domain DTO
      const queryDTO: GetMessagesQueryDTO = {
        conversationId: request.params.conversationId,
        limit: request.query.limit,
        before: request.query.before
          ? new Date(request.query.before)
          : undefined,
        after: request.query.after ? new Date(request.query.after) : undefined,
      }

      const result = await this.getMessagesHandler.execute({
        userId,
        ...queryDTO,
      })

      // Convert domain result to API response format
      const response: GetMessagesResponseDTO = result

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error getting messages:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: context.userId,
        conversationId: request.params.conversationId,
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'UnauthorizedError') {
        throw error // Pass through unauthorized errors
      }

      // Handle conversation not found
      if (
        error.message?.includes('Conversation not found') ||
        error.message?.includes('not a participant')
      ) {
        throw ErrorFactory.resourceNotFound(
          'Conversation',
          request.params.conversationId,
          {
            correlationId: request.id,
            source: 'MessageController.getByConversation',
            httpStatus: 404,
            suggestion:
              'Ensure the conversation exists and you have access to it',
          },
        )
      }

      // Handle Firebase-specific errors
      if (
        error.name?.includes('Firebase') ||
        error.code?.includes('firebase')
      ) {
        throw ErrorFactory.externalServiceError(
          'Firebase',
          'Failed to retrieve messages from real-time database',
          error,
          {
            correlationId: request.id,
            source: 'MessageController.getByConversation',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to retrieve messages', {
        source: 'MessageController.getByConversation',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: context?.userId,
          conversationId: request.params.conversationId,
          queryParams: request.query,
        },
        suggestion: 'Please try again later',
      })
    }
  }
}
