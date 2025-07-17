import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { FastifyRequest } from 'fastify'

import { MessageType } from '../../../shared/types.js'
import { MarkMessagesReadCommandHandler } from '../../application/use_cases/commands/MarkMessagesReadCommandHandler.js'
import { SendMessageCommandHandler } from '../../application/use_cases/commands/SendMessageCommandHandler.js'
import {
  MarkMessagesReadResponseDTO,
  MessageResponseDTO,
  SendMessageDTO,
} from '../../domain/dtos/index.js'

/**
 * Controller for Message write operations
 * Handles business logic only - HTTP concerns handled by routes
 */
export class MessageController {
  constructor(
    private readonly sendMessageHandler: SendMessageCommandHandler,
    private readonly markReadHandler: MarkMessagesReadCommandHandler,
  ) {}

  /**
   * Send a message
   * Returns data only - no HTTP handling
   */
  async send(
    request: FastifyRequest<{
      Params: { conversationId: string }
      Body: schemas.SendMessageRequest
    }>,
  ): Promise<MessageResponseDTO> {
    // Extract user context from request
    const context = RequestContext.fromHeaders(request)
    const userId = context.userId

    try {
      // Map user role to userType for messaging
      const userType =
        context.role === UserRole.PROVIDER ? 'PROVIDER' : 'CUSTOMER'

      // Validate conversation ID
      if (
        !request.params.conversationId ||
        request.params.conversationId.trim() === ''
      ) {
        throw ErrorFactory.validationError(
          { conversationId: ['Conversation ID is required'] },
          {
            correlationId: request.id,
            source: 'MessageController.send',
            suggestion: 'Provide a valid conversation ID',
          },
        )
      }

      // Validate message content
      if (!request.body.content || request.body.content.trim() === '') {
        throw ErrorFactory.validationError(
          { content: ['Message content cannot be empty'] },
          {
            correlationId: request.id,
            source: 'MessageController.send',
            suggestion: 'Provide message content',
          },
        )
      }

      // Validate message type if provided
      const validMessageTypes = Object.values(MessageType)

      if (
        request.body.type &&
        !validMessageTypes.includes(request.body.type as MessageType)
      ) {
        throw ErrorFactory.validationError(
          {
            type: [
              `Message type must be one of: ${validMessageTypes.join(', ')}`,
            ],
          },
          {
            correlationId: request.id,
            source: 'MessageController.send',
            suggestion: 'Use a valid message type',
          },
        )
      }

      // Convert API schema to domain DTO
      const sendMessageDTO: SendMessageDTO = {
        conversationId: request.params.conversationId,
        senderId: userId,
        senderType: userType,
        type: (request.body.type as MessageType) || MessageType.TEXT,
        content: request.body.content,
        metadata: request.body.metadata,
        replyToId: request.body.replyToId,
      }

      const result = await this.sendMessageHandler.execute(sendMessageDTO)

      const response: MessageResponseDTO = { messageId: result.messageId }

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error sending message:', {
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

      // Handle conversation not found or access denied
      if (
        error.message?.includes('Conversation not found') ||
        error.message?.includes('not a participant') ||
        error.message?.includes('access denied')
      ) {
        throw ErrorFactory.resourceNotFound(
          'Conversation',
          request.params.conversationId,
          {
            correlationId: request.id,
            source: 'MessageController.send',
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
          'Failed to send message to real-time database',
          error,
          {
            correlationId: request.id,
            source: 'MessageController.send',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to send message', {
        source: 'MessageController.send',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: context?.userId,
          conversationId: request.params.conversationId,
          messageType: request.body.type,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Mark messages as read
   * PATCH /conversations/{conversationId}/read
   */
  async markAsRead(
    request: FastifyRequest<{
      Params: { conversationId: string }
      Body: schemas.MarkMessagesReadRequest
    }>,
  ): Promise<MarkMessagesReadResponseDTO> {
    // Extract user context from request
    const context = RequestContext.fromHeaders(request)
    const userId = context.userId

    try {
      // Validate conversation ID
      if (
        !request.params.conversationId ||
        request.params.conversationId.trim() === ''
      ) {
        throw ErrorFactory.validationError(
          { conversationId: ['Conversation ID is required'] },
          {
            correlationId: request.id,
            source: 'MessageController.markAsRead',
            suggestion: 'Provide a valid conversation ID',
          },
        )
      }

      // Validate message IDs
      if (
        !request.body.messageIds ||
        !Array.isArray(request.body.messageIds) ||
        request.body.messageIds.length === 0
      ) {
        throw ErrorFactory.validationError(
          { messageIds: ['At least one message ID is required'] },
          {
            correlationId: request.id,
            source: 'MessageController.markAsRead',
            suggestion: 'Provide an array of message IDs to mark as read',
          },
        )
      }

      // Validate message ID count
      if (request.body.messageIds.length > 100) {
        throw ErrorFactory.validationError(
          {
            messageIds: [
              'Maximum 100 message IDs can be marked as read at once',
            ],
          },
          {
            correlationId: request.id,
            source: 'MessageController.markAsRead',
            suggestion: 'Reduce the number of message IDs to 100 or less',
          },
        )
      }

      // Convert API schema to domain DTO
      const markReadDTO = {
        conversationId: request.params.conversationId,
        messageIds: request.body.messageIds,
        userId,
      }

      await this.markReadHandler.execute(markReadDTO)

      const response: MarkMessagesReadResponseDTO = { success: true }

      return response
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error marking messages as read:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: context?.userId,
        conversationId: request.params.conversationId,
        messageCount: request.body.messageIds?.length,
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'UnauthorizedError') {
        throw error // Pass through unauthorized errors
      }

      // Handle conversation or messages not found
      if (
        error.message?.includes('Conversation not found') ||
        error.message?.includes('not a participant') ||
        error.message?.includes('Message not found')
      ) {
        throw ErrorFactory.resourceNotFound(
          'Resource',
          'conversation or messages',
          {
            correlationId: request.id,
            source: 'MessageController.markAsRead',
            httpStatus: 404,
            suggestion:
              'Ensure the conversation and messages exist and you have access',
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
          'Failed to update message read status in real-time database',
          error,
          {
            correlationId: request.id,
            source: 'MessageController.markAsRead',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to mark messages as read', {
        source: 'MessageController.markAsRead',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: context?.userId,
          conversationId: request.params.conversationId,
          messageCount: request.body.messageIds?.length,
        },
        suggestion: 'Please try again later',
      })
    }
  }
}
