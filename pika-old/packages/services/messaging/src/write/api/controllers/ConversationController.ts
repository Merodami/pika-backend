import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { FastifyRequest } from 'fastify'

import { ConversationContext } from '../../../shared/types.js'
import { CreateConversationCommandHandler } from '../../application/use_cases/commands/CreateConversationCommandHandler.js'
import {
  CreateConversationDTO,
  CreateConversationResponseDTO,
} from '../../domain/dtos/index.js'

/**
 * Controller for Conversation write operations
 * Handles business logic only - HTTP concerns handled by routes
 */
export class ConversationController {
  constructor(
    private readonly createConversationHandler: CreateConversationCommandHandler,
  ) {}

  /**
   * Create a new conversation
   * Returns data only - no HTTP handling
   */
  async create(
    request: FastifyRequest<{ Body: schemas.CreateConversationRequest }>,
  ): Promise<CreateConversationResponseDTO> {
    // Extract user context from request
    const context = RequestContext.fromHeaders(request)
    const userId = context.userId

    try {
      // Validate request body
      if (
        !request.body.participantIds ||
        request.body.participantIds.length === 0
      ) {
        throw ErrorFactory.validationError(
          { participantIds: ['At least one participant is required'] },
          {
            correlationId: request.id,
            source: 'ConversationController.create',
            suggestion: 'Provide at least one participant ID',
          },
        )
      }

      // Validate participant count
      if (request.body.participantIds.length > 10) {
        throw ErrorFactory.validationError(
          {
            participantIds: [
              'Maximum 10 participants allowed per conversation',
            ],
          },
          {
            correlationId: request.id,
            source: 'ConversationController.create',
            suggestion: 'Reduce the number of participants to 10 or less',
          },
        )
      }

      // Convert API schema to domain DTO
      const createConversationDTO: CreateConversationDTO = {
        participantIds: request.body.participantIds,
        context: request.body.context
          ? {
              type: request.body.context.type as ConversationContext,
              id: request.body.context.id,
              metadata: request.body.context.metadata,
            }
          : undefined,
      }

      const result = await this.createConversationHandler.execute({
        ...createConversationDTO,
        userId,
      })

      const response: CreateConversationResponseDTO = {
        conversationId: result.conversationId,
      }

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating conversation:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: context.userId,
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'UnauthorizedError') {
        throw error // Pass through unauthorized errors
      }

      if (error.name === 'ResourceConflictError') {
        throw error // Pass through conflict errors (e.g., duplicate conversation)
      }

      // Handle user not found errors
      if (
        error.message?.includes('User not found') ||
        error.message?.includes('Participant not found')
      ) {
        throw ErrorFactory.resourceNotFound(
          'User',
          'One or more participants',
          {
            correlationId: request.id,
            source: 'ConversationController.create',
            suggestion: 'Ensure all participant IDs exist',
            metadata: {
              participantIds: request.body.participantIds,
            },
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
          'Failed to create conversation in real-time database',
          error,
          {
            correlationId: request.id,
            source: 'ConversationController.create',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to create conversation', {
        source: 'ConversationController.create',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: context.userId,
          requestBody: {
            participantCount: request.body.participantIds?.length,
            hasContext: !!request.body.context,
          },
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }
}
