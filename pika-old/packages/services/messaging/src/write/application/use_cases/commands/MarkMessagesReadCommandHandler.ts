import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

import { ConversationRepositoryPort } from '../../../domain/ports/ConversationRepositoryPort.js'
import { MessageRepositoryPort } from '../../../domain/ports/MessageRepositoryPort.js'

export class MarkMessagesReadCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
  ) {}

  async execute(params: {
    conversationId: string
    messageIds: string[]
    userId: string
  }): Promise<void> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(
      params.conversationId,
    )

    if (!conversation) {
      throw ErrorFactory.resourceNotFound(
        'Conversation',
        params.conversationId,
        {
          source: 'MarkMessagesReadCommandHandler.execute',
          suggestion:
            'Check that the conversation ID exists and is in the correct format',
        },
      )
    }

    if (!conversation.isParticipant(params.userId)) {
      throw new NotAuthorizedError(
        'You are not a participant in this conversation',
        {
          source: 'MarkMessagesReadCommandHandler.execute',
          metadata: {
            userId: params.userId,
            conversationId: params.conversationId,
          },
        },
      )
    }

    // Mark messages as read
    await this.messageRepository.markAsRead(params.messageIds, params.userId)

    // Update conversation participant's read status
    const lastMessageId = params.messageIds[params.messageIds.length - 1]

    conversation.markAsRead(params.userId, lastMessageId)

    await this.conversationRepository.update(conversation)
  }
}
