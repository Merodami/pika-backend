import { ConversationMetadata } from '../../../shared/types.js'

export interface ConversationReadRepositoryPort {
  findById(id: string): Promise<ConversationMetadata | null>
  findByUser(
    userId: string,
    limit?: number,
    offset?: number,
    includeArchived?: boolean,
  ): Promise<{
    conversations: ConversationMetadata[]
    total: number
  }>
  findByParticipants(
    participant1Id: string,
    participant2Id: string,
  ): Promise<ConversationMetadata | null>
}
