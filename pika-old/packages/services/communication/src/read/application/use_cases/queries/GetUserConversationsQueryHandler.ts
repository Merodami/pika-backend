import { Conversation } from '@communication-read/domain/entities/Conversation.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

export interface GetUserConversationsQuery {
  userId: string
  page: number
  limit: number
  includeArchived: boolean
}

export interface GetUserConversationsResult {
  conversations: Conversation[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export class GetUserConversationsQueryHandler {
  constructor(
    private readonly conversationRepository: ConversationReadRepositoryPort,
  ) {}

  async execute(
    query: GetUserConversationsQuery,
  ): Promise<GetUserConversationsResult> {
    try {
      logger.debug('Getting user conversations', {
        userId: query.userId,
        page: query.page,
        limit: query.limit,
        includeArchived: query.includeArchived,
      })

      const result = await this.conversationRepository.findByParticipant(
        query.userId,
        {
          includeArchived: query.includeArchived,
          limit: query.limit,
          offset: (query.page - 1) * query.limit,
        },
      )

      const { conversations, total } = result

      const pages = Math.ceil(total / query.limit)

      return {
        conversations,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages,
          has_next: query.page < pages,
          has_prev: query.page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to get user conversations', {
        error: error.message,
        userId: query.userId,
      })

      throw ErrorFactory.databaseError(
        'conversation_get_user',
        'Failed to get user conversations',
        error,
        {
          correlationId: `conversation-user-${query.userId}`,
          source: 'GetUserConversationsQueryHandler.execute',
        },
      )
    }
  }
}
