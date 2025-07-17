import {
  ConversationContext,
  ConversationParticipant,
  MessageType,
} from '../../../shared/types.js'

/**
 * Conversation DTOs for read operations
 */

export interface ConversationDTO {
  id: string
  participants: ConversationParticipant[]
  lastMessage?: {
    id: string
    content: string
    senderId: string
    sentAt: Date
    type: MessageType
  }
  context?: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  }
  createdAt: Date
  updatedAt: Date
}

export interface GetConversationsQueryDTO {
  userId: string
  limit?: number
  offset?: number
  includeArchived?: boolean
}

export interface GetConversationsResponseDTO {
  conversations: ConversationDTO[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
