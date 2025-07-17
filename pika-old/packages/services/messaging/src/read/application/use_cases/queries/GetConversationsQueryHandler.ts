import { PaginationMetadata } from '@pika/types-core'

import {
  ConversationMetadata,
  GetConversationsQuery,
} from '../../../../shared/types.js'
import { ConversationReadRepositoryPort } from '../../../domain/ports/ConversationReadRepositoryPort.js'

export class GetConversationsQueryHandler {
  constructor(
    private readonly conversationRepository: ConversationReadRepositoryPort,
  ) {}

  async execute(query: GetConversationsQuery): Promise<{
    conversations: ConversationMetadata[]
    pagination: PaginationMetadata
  }> {
    const page = query.page || 1
    const limit = query.limit || 20
    const offset = (page - 1) * limit

    const result = await this.conversationRepository.findByUser(
      query.userId,
      limit,
      offset,
      query.includeArchived,
    )

    const totalPages = Math.ceil(result.total / limit)

    return {
      conversations: result.conversations,
      pagination: {
        total: result.total,
        page,
        limit,
        pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    }
  }
}
