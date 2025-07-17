import {
  ConversationContext,
  ConversationType,
} from '@communication-shared/types/index.js'
import { Conversation } from '@communication-write/domain/entities/Conversation.js'
import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { ErrorFactory } from '@pika/shared'

export interface CreateConversationCommand {
  participantIds: string[]
  participantTypes?: Record<string, 'CUSTOMER' | 'PROVIDER'>
  context?: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  }
}

export class CreateConversationCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationWriteRepositoryPort,
  ) {}

  async execute(
    command: CreateConversationCommand,
  ): Promise<{ conversationId: string }> {
    // Check if conversation already exists between these participants
    const existingConversation =
      await this.conversationRepository.findByParticipants(
        command.participantIds,
      )

    if (existingConversation) {
      return { conversationId: existingConversation.id }
    }

    // Validate participants
    if (command.participantIds.length < 2) {
      throw ErrorFactory.validationError(
        {
          participantIds: ['A conversation must have at least 2 participants'],
        },
        { source: 'CreateConversationCommandHandler.execute' },
      )
    }

    if (command.participantIds.length > 2) {
      throw ErrorFactory.validationError(
        { participantIds: ['Group conversations are not supported yet'] },
        { source: 'CreateConversationCommandHandler.execute' },
      )
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(command.participantIds)

    if (uniqueParticipants.size !== command.participantIds.length) {
      throw ErrorFactory.validationError(
        { participantIds: ['Duplicate participants are not allowed'] },
        { source: 'CreateConversationCommandHandler.execute' },
      )
    }

    // Create conversation
    const conversation = Conversation.create({
      participantIds: command.participantIds,
      type: ConversationType.CUSTOMER_PROVIDER, // Default type for now
      metadata: command.context,
    })

    // Save conversation
    await this.conversationRepository.create(conversation)

    return { conversationId: conversation.id }
  }
}
