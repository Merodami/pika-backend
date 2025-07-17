import { MessageData } from '../../../shared/types.js'

export interface MessageReadRepositoryPort {
  findById(id: string): Promise<MessageData | null>
  findByConversation(
    conversationId: string,
    limit?: number,
    before?: Date,
    after?: Date,
  ): Promise<MessageData[]>
  countUnread(conversationId: string, userId: string): Promise<number>
  search(userId: string, query: string, limit?: number): Promise<MessageData[]>
}
