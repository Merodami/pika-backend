import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

import { GetMessagesQuery, MessageData } from '../../../../shared/types.js'
import { ConversationReadRepositoryPort } from '../../../domain/ports/ConversationReadRepositoryPort.js'
import { MessageReadRepositoryPort } from '../../../domain/ports/MessageReadRepositoryPort.js'

export class GetMessagesQueryHandler {
  constructor(
    private readonly conversationRepository: ConversationReadRepositoryPort,
    private readonly messageRepository: MessageReadRepositoryPort,
  ) {}

  async execute(query: GetMessagesQuery & { userId: string }): Promise<{
    messages: MessageData[]
    pagination: {
      limit: number
      hasMore: boolean
    }
  }> {
    // Verify user has access to conversation
    const conversation = await this.conversationRepository.findById(
      query.conversationId,
    )

    if (!conversation) {
      throw ErrorFactory.resourceNotFound(
        'Conversation',
        query.conversationId,
        {
          source: 'GetMessagesQueryHandler.execute',
          suggestion:
            'Check that the conversation ID exists and is in the correct format',
        },
      )
    }

    if (!conversation.participants[query.userId]) {
      throw new NotAuthorizedError(
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

    const limit = query.limit || 50

    const messages = await this.messageRepository.findByConversation(
      query.conversationId,
      limit + 1, // Fetch one extra to check if there are more
      query.before,
      query.after,
    )

    const hasMore = messages.length > limit

    if (hasMore) {
      messages.pop() // Remove the extra message
    }

    return {
      messages,
      pagination: {
        limit,
        hasMore,
      },
    }
  }
}
