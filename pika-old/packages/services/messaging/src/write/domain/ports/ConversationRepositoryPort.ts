import { Conversation } from '../entities/Conversation.js'

export interface ConversationRepositoryPort {
  create(conversation: Conversation): Promise<void>
  update(conversation: Conversation): Promise<void>
  findById(id: string): Promise<Conversation | null>
  findByParticipants(
    participant1Id: string,
    participant2Id: string,
  ): Promise<Conversation | null>
  delete(id: string): Promise<void>
}
