import { ConversationContext } from '../../../shared/types.js'

/**
 * Conversation DTOs for write operations
 */

export type CreateConversationDTO = {
  participantIds: string[]
  context?: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  }
}

export type CreateConversationResponseDTO = {
  conversationId: string
}
