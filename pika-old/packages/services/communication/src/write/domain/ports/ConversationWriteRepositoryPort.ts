import { Conversation } from '../entities/Conversation.js'

export interface ConversationWriteRepositoryPort {
  create(conversation: Conversation): Promise<Conversation>
  update(conversation: Conversation): Promise<Conversation>
  findById(conversationId: string): Promise<Conversation | null>
  findByParticipant(
    userId: string,
    options?: {
      includeArchived?: boolean
      limit?: number
      offset?: number
    },
  ): Promise<Conversation[]>
  findByParticipants(participantIds: string[]): Promise<Conversation | null>
  archive(conversationId: string, userId: string): Promise<void>
  unarchive(conversationId: string, userId: string): Promise<void>
  block(conversationId: string, userId: string): Promise<void>
  unblock(conversationId: string, userId: string): Promise<void>
  mute(conversationId: string, userId: string): Promise<void>
  unmute(conversationId: string, userId: string): Promise<void>
}
