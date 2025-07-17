import { MessageType } from '@communication-shared/types/index.js'
import { Message } from '@communication-write/domain/entities/Message.js'
import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { MessageWriteRepositoryPort } from '@communication-write/domain/ports/MessageWriteRepositoryPort.js'
import { NotificationOrchestrator } from '@communication-write/domain/services/NotificationOrchestrator.js'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

export interface SendMessageCommand {
  conversationId: string
  senderId: string
  senderType: 'CUSTOMER' | 'PROVIDER'
  type: MessageType
  content: string
  metadata?: any
  replyToId?: string
}

export class SendMessageCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationWriteRepositoryPort,
    private readonly messageRepository: MessageWriteRepositoryPort,
    private readonly notificationOrchestrator: NotificationOrchestrator,
  ) {}

  async execute(command: SendMessageCommand): Promise<{ messageId: string }> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    )

    if (!conversation) {
      throw ErrorFactory.resourceNotFound(
        'Conversation',
        command.conversationId,
        {
          source: 'SendMessageCommandHandler.execute',
          suggestion:
            'Check that the conversation ID exists and is in the correct format',
        },
      )
    }

    if (!conversation.isParticipant(command.senderId)) {
      throw new NotAuthorizedError(
        'You are not a participant in this conversation',
        {
          source: 'SendMessageCommandHandler.execute',
          metadata: {
            senderId: command.senderId,
            conversationId: command.conversationId,
          },
        },
      )
    }

    if (conversation.isBlocked()) {
      throw ErrorFactory.businessRuleViolation(
        'CONVERSATION_BLOCKED',
        'This conversation is blocked',
        {
          source: 'SendMessageCommandHandler.execute',
          metadata: {
            senderId: command.senderId,
            conversationId: command.conversationId,
          },
        },
      )
    }

    // If replying to a message, fetch the original message
    let replyToContent: string | undefined
    let replyToSenderId: string | undefined

    if (command.replyToId) {
      const originalMessage = await this.messageRepository.findById(
        command.conversationId,
        command.replyToId,
      )

      if (originalMessage) {
        replyToContent = originalMessage.content
        replyToSenderId = originalMessage.senderId
      }
    }

    // Create message
    const message = Message.create({
      conversationId: command.conversationId,
      senderId: command.senderId,
      senderType: command.senderType,
      type: command.type,
      content: command.content,
      metadata: command.metadata,
      replyToId: command.replyToId,
      replyToContent,
      replyToSenderId,
    })

    // Save message
    await this.messageRepository.create(message)

    // Update conversation's last message
    const updatedConversation = conversation.updateLastMessage(
      message.id,
      message.content,
      message.senderId,
    )

    await this.conversationRepository.update(updatedConversation)

    // Send notification to other participants
    await this.notificationOrchestrator.handleMessageSent(
      message,
      updatedConversation,
    )

    return { messageId: message.id }
  }
}
