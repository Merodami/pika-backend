import { Conversation } from '@communication-read/domain/entities/Conversation.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'
import { get, set } from 'lodash-es'

export const GetConversationsQuerySchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  includeArchived: Type.Optional(Type.Boolean({ default: false })),
  includeBlocked: Type.Optional(Type.Boolean({ default: false })),
})

export type GetConversationsQuery = typeof GetConversationsQuerySchema.static

export interface GetConversationsResult {
  conversations: Conversation[]
  total: number
  stats: {
    total: number
    unread: number
    archived: number
    blocked: number
  }
}

export class GetConversationsQueryHandler {
  constructor(
    private readonly conversationRepository: ConversationReadRepositoryPort,
  ) {}

  async execute(query: GetConversationsQuery): Promise<GetConversationsResult> {
    logger.info('Getting conversations', { userId: query.userId })

    if (!Value.Check(GetConversationsQuerySchema, query)) {
      const errors = [...Value.Errors(GetConversationsQuerySchema, query)]
      const validationErrors: Record<string, string[]> = {}

      for (const error of errors) {
        const field = error.path.replace('/', '')

        if (!get(validationErrors, field)) {
          set(validationErrors, field, [])
        }
        get(validationErrors, field).push(error.message)
      }

      throw ErrorFactory.validationError(validationErrors, {
        source: 'GetConversationsQueryHandler.execute',
      })
    }

    try {
      // Get conversations
      const { conversations, total } =
        await this.conversationRepository.findByParticipant(query.userId, {
          includeArchived: query.includeArchived,
          includeBlocked: query.includeBlocked,
          limit: query.limit,
          offset: query.offset,
        })

      // Get conversation stats
      const stats = await this.conversationRepository.getConversationStats(
        query.userId,
      )

      return {
        conversations,
        total,
        stats,
      }
    } catch (error) {
      logger.error('Failed to get conversations', error as Error, {
        userId: query.userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to retrieve conversations', {
        source: 'GetConversationsQueryHandler.execute',
      })
    }
  }
}
