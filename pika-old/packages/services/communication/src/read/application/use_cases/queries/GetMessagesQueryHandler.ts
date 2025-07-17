import { Message } from '@communication-read/domain/entities/Message.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { MessageReadRepositoryPort } from '@communication-read/domain/ports/MessageReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { get, set } from 'lodash-es'

export const GetMessagesQuerySchema = Type.Object({
  conversationId: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
  before: Type.Optional(Type.String()),
  after: Type.Optional(Type.String()),
  includeDeleted: Type.Optional(Type.Boolean({ default: false })),
})

export type GetMessagesQuery = typeof GetMessagesQuerySchema.static

export interface GetMessagesResult {
  messages: Message[]
  hasMore: boolean
  cursor?: string
  unreadCount: number
}

export class GetMessagesQueryHandler {
  constructor(
    private readonly messageRepository: MessageReadRepositoryPort,
    private readonly conversationRepository: ConversationReadRepositoryPort,
  ) {}

  async execute(query: GetMessagesQuery): Promise<GetMessagesResult> {
    logger.info('Getting messages', {
      conversationId: query.conversationId,
      userId: query.userId,
    })

    if (!Value.Check(GetMessagesQuerySchema, query)) {
      const errors = [...Value.Errors(GetMessagesQuerySchema, query)]
      const validationErrors: Record<string, string[]> = {}

      for (const error of errors) {
        const field = error.path.replace('/', '')

        if (!get(validationErrors, field)) {
          set(validationErrors, field, [])
        }
        get(validationErrors, field).push(error.message)
      }

      throw ErrorFactory.validationError(validationErrors, {
        source: 'GetMessagesQueryHandler.execute',
      })
    }

    try {
      // Verify user can access this conversation
      const conversation = await this.conversationRepository.findById(
        query.conversationId,
      )

      if (!conversation) {
        throw ErrorFactory.resourceNotFound(
          'Conversation',
          query.conversationId,
          {
            source: 'GetMessagesQueryHandler.execute',
          },
        )
      }

      if (!conversation.isParticipant(query.userId)) {
        throw ErrorFactory.unauthorized(
          'You are not a participant in this conversation',
          {
            source: 'GetMessagesQueryHandler.execute',
            metadata: {
              userId: query.userId,
              conversationId: query.conversationId,
            },
          },
        )
      }

      // Get messages
      const { messages, hasMore, cursor } =
        await this.messageRepository.findByConversation(query.conversationId, {
          limit: query.limit,
          before: query.before,
          after: query.after,
          includeDeleted: query.includeDeleted,
        })

      // Get unread count
      const unreadCount = await this.messageRepository.getUnreadCount(
        query.conversationId,
        query.userId,
      )

      return {
        messages,
        hasMore,
        cursor,
        unreadCount,
      }
    } catch (error) {
      logger.error('Failed to get messages', error as Error, {
        conversationId: query.conversationId,
        userId: query.userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to retrieve messages', {
        source: 'GetMessagesQueryHandler.execute',
      })
    }
  }
}
