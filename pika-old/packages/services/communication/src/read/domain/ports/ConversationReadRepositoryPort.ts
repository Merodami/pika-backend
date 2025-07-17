import { Conversation } from '@communication-read/domain/entities/Conversation.js'

export interface ConversationReadRepositoryPort {
  findById(conversationId: string): Promise<Conversation | null>
  findByParticipant(
    userId: string,
    options?: {
      includeArchived?: boolean
      includeBlocked?: boolean
      limit?: number
      offset?: number
    },
  ): Promise<{
    conversations: Conversation[]
    total: number
  }>
  findByParticipants(participantIds: string[]): Promise<Conversation | null>
  search(
    userId: string,
    searchTerm: string,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<{
    conversations: Conversation[]
    total: number
  }>
  getConversationStats(userId: string): Promise<{
    total: number
    unread: number
    archived: number
    blocked: number
  }>
}
