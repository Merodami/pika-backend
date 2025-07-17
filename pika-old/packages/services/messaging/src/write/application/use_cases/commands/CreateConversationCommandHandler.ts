import { NotAuthorizedError } from '@pika/shared'
import { v4 as uuidv4 } from 'uuid'

import { CreateConversationDto } from '../../../../shared/types.js'
import { Conversation } from '../../../domain/entities/Conversation.js'
import { ConversationRepositoryPort } from '../../../domain/ports/ConversationRepositoryPort.js'

export class CreateConversationCommandHandler {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
  ) {}

  async execute(
    dto: CreateConversationDto & { userId: string },
  ): Promise<{ conversationId: string }> {
    // Validate that the user is one of the participants
    if (!dto.participantIds.includes(dto.userId)) {
      throw new NotAuthorizedError(
        'You must be a participant in the conversation',
        {
          source: 'CreateConversationCommandHandler.execute',
          metadata: { userId: dto.userId, participantIds: dto.participantIds },
        },
      )
    }

    // Check if conversation already exists between these participants
    if (dto.participantIds.length === 2) {
      const existingConversation =
        await this.conversationRepository.findByParticipants(
          dto.participantIds[0],
          dto.participantIds[1],
        )

      if (existingConversation) {
        return { conversationId: existingConversation.id }
      }
    }

    // Create new conversation
    const conversation = Conversation.create({
      id: uuidv4(),
      participantIds: dto.participantIds,
      context: dto.context,
    })

    await this.conversationRepository.create(conversation)

    return { conversationId: conversation.id }
  }
}
