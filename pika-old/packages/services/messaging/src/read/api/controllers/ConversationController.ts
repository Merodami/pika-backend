import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { FastifyRequest } from 'fastify'

import {
  ConversationMetadata,
  ConversationParticipant,
} from '../../../shared/types.js'
import { GetConversationsQueryHandler } from '../../application/use_cases/queries/GetConversationsQueryHandler.js'
import { ConversationDTO } from '../../domain/dtos/ConversationDTO.js'

export class ConversationController {
  constructor(
    private readonly getConversationsHandler: GetConversationsQueryHandler,
  ) {}

  async getAll(
    request: FastifyRequest<{ Querystring: schemas.GetConversationsQuery }>,
  ): Promise<schemas.GetConversationsResponse> {
    // Extract user context from request
    const context = RequestContext.fromHeaders(request)
    const userId = context.userId

    try {
      // Query parameters are already validated by the schema
      const page = request.query.page
      const limit = request.query.limit
      const includeArchived = request.query.includeArchived

      const result = await this.getConversationsHandler.execute({
        userId,
        page,
        limit,
        includeArchived,
      })

      // Convert from ConversationMetadata to ConversationDTO
      const conversationsDTO = result.conversations.map((conv) =>
        this.toConversationDTO(conv),
      )

      // Convert to API format with proper date serialization
      const apiConversations = conversationsDTO.map((dto) => ({
        id: dto.id,
        participants: dto.participants.map((p) => ({
          userId: p.userId,
          userType: p.userType,
          joinedAt: p.joinedAt.toISOString(),
          lastReadAt: p.lastReadAt?.toISOString(),
          lastReadMessageId: p.lastReadMessageId,
          isArchived: p.isArchived,
          isBlocked: p.isBlocked,
          isMuted: p.isMuted,
          unreadCount: p.unreadCount,
        })),
        lastMessage: dto.lastMessage
          ? {
              id: dto.lastMessage.id,
              content: dto.lastMessage.content,
              senderId: dto.lastMessage.senderId,
              sentAt: dto.lastMessage.sentAt.toISOString(),
              type: dto.lastMessage.type,
            }
          : undefined,
        context: dto.context,
        createdAt: dto.createdAt.toISOString(),
        updatedAt: dto.updatedAt.toISOString(),
      }))

      return {
        conversations: apiConversations,
        pagination: result.pagination,
      }
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error fetching conversations:', {
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

      // Handle database errors
      if (error.name?.includes('Prisma') || error.name?.includes('Firebase')) {
        throw ErrorFactory.databaseError(
          'get_conversations',
          'Failed to fetch conversations',
          error,
          {
            correlationId: request.id,
            source: 'ConversationController.getAll',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to fetch conversations', {
        source: 'ConversationController.getAll',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: context?.userId,
          queryParams: request.query,
        },
        suggestion: 'Please try again later',
      })
    }
  }

  private toConversationDTO(metadata: ConversationMetadata): ConversationDTO {
    // Convert participants from Record<string, ConversationParticipant> to ConversationParticipant[]
    const participants: ConversationParticipant[] = Object.values(
      metadata.participants,
    )

    return {
      id: metadata.id,
      participants,
      lastMessage: metadata.lastMessage,
      context: metadata.context,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    }
  }
}
