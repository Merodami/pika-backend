import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { MessageWriteRepositoryPort } from '@communication-write/domain/ports/MessageWriteRepositoryPort.js'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

export interface MarkMessagesReadCommand {
  conversationId: string
  userId: string
  messageIds: string[]
}

export class MarkMessagesReadCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationWriteRepositoryPort,
    private readonly messageRepository: MessageWriteRepositoryPort,
  ) {}

  async execute(command: MarkMessagesReadCommand): Promise<void> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    )

    if (!conversation) {
      throw ErrorFactory.resourceNotFound(
        'Conversation',
        command.conversationId,
        {
          source: 'MarkMessagesReadCommandHandler.execute',
        },
      )
    }

    if (!conversation.isParticipant(command.userId)) {
      throw new NotAuthorizedError(
        'You are not a participant in this conversation',
        {
          source: 'MarkMessagesReadCommandHandler.execute',
          metadata: {
            userId: command.userId,
            conversationId: command.conversationId,
          },
        },
      )
    }

    // Mark messages as read
    if (command.messageIds.length === 1) {
      await this.messageRepository.markAsRead(
        command.conversationId,
        command.messageIds[0],
      )
    } else if (command.messageIds.length > 1) {
      await this.messageRepository.markMultipleAsRead(
        command.conversationId,
        command.messageIds,
      )
    }

    // Update conversation read status
    const updatedConversation = conversation.markAsRead()

    await this.conversationRepository.update(updatedConversation)
  }
}
