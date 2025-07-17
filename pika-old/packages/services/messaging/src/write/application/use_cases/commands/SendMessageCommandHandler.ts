import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { v4 as uuidv4 } from 'uuid'

import { MessageType, SendMessageDto } from '../../../../shared/types.js'
import { Message } from '../../../domain/entities/Message.js'
import { ConversationRepositoryPort } from '../../../domain/ports/ConversationRepositoryPort.js'
import { MessageRepositoryPort } from '../../../domain/ports/MessageRepositoryPort.js'
import { NotificationServicePort } from '../../../domain/ports/NotificationServicePort.js'

export class SendMessageCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
    private readonly notificationService: NotificationServicePort,
  ) {}

  async execute(
    dto: SendMessageDto & { senderType: 'CUSTOMER' | 'PROVIDER' },
  ): Promise<{ messageId: string }> {
    // Validate conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(
      dto.conversationId,
    )

    if (!conversation) {
      throw ErrorFactory.resourceNotFound('Conversation', dto.conversationId, {
        source: 'SendMessageCommandHandler.execute',
        suggestion:
          'Check that the conversation ID exists and is in the correct format',
      })
    }

    if (!conversation.isParticipant(dto.senderId)) {
      throw new NotAuthorizedError(
        'You are not a participant in this conversation',
        {
          source: 'SendMessageCommandHandler.execute',
          metadata: {
            senderId: dto.senderId,
            conversationId: dto.conversationId,
          },
        },
      )
    }

    if (conversation.isBlocked(dto.senderId)) {
      throw ErrorFactory.businessRuleViolation(
        'CONVERSATION_BLOCKED',
        'This conversation is blocked',
        {
          source: 'SendMessageCommandHandler.execute',
          metadata: {
            senderId: dto.senderId,
            conversationId: dto.conversationId,
          },
        },
      )
    }

    // If replying to a message, fetch the original message
    let replyToContent: string | undefined
    let replyToSenderId: string | undefined

    if (dto.replyToId) {
      const originalMessage = await this.messageRepository.findById(
        dto.replyToId,
      )

      if (
        originalMessage &&
        originalMessage.conversationId === dto.conversationId
      ) {
        replyToContent = originalMessage.content
        replyToSenderId = originalMessage.senderId
      }
    }

    // Create message
    const message = Message.create({
      id: uuidv4(),
      conversationId: dto.conversationId,
      senderId: dto.senderId,
      senderType: dto.senderType,
      type: dto.type,
      content: dto.content,
      metadata: dto.metadata,
      replyToId: dto.replyToId,
      replyToContent,
      replyToSenderId,
    })

    // Save message
    await this.messageRepository.create(message)

    // Update conversation's last message
    conversation.updateLastMessage({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      type: message.type,
    })

    await this.conversationRepository.update(conversation)

    // Send notification to other participants
    const recipientId = conversation.getOtherParticipant(dto.senderId)

    if (recipientId) {
      const participant = conversation.participants.get(recipientId)

      // Only send notification if not muted
      if (!participant?.isMuted) {
        await this.notificationService.notifyNewMessage({
          recipientId,
          senderId: dto.senderId,
          conversationId: dto.conversationId,
          messageId: message.id,
          content: this.truncateContent(message.content, message.type),
        })
      }
    }

    return { messageId: message.id }
  }

  private truncateContent(content: string, type: MessageType): string {
    if (type === MessageType.IMAGE) {
      return '📷 Image'
    }

    if (type === MessageType.FILE) {
      return '📎 File'
    }

    if (content.length > 100) {
      return content.substring(0, 97) + '...'
    }

    return content
  }
}
