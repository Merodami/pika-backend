import { Message } from '@communication-read/domain/entities/Message.js'

export interface MessageReadRepositoryPort {
  findById(conversationId: string, messageId: string): Promise<Message | null>
  findByConversation(
    conversationId: string,
    options?: {
      limit?: number
      before?: string
      after?: string
      includeDeleted?: boolean
    },
  ): Promise<{
    messages: Message[]
    hasMore: boolean
    cursor?: string
  }>
  search(
    conversationId: string,
    searchTerm: string,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<{
    messages: Message[]
    total: number
  }>
  getMessageCount(conversationId: string): Promise<number>
  getUnreadCount(conversationId: string, userId: string): Promise<number>
}
