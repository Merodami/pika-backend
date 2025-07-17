import { Message } from '../entities/Message.js'

export interface MessageWriteRepositoryPort {
  create(message: Message): Promise<Message>
  update(message: Message): Promise<Message>
  findById(conversationId: string, messageId: string): Promise<Message | null>
  findByConversation(
    conversationId: string,
    options?: {
      limit?: number
      before?: string
      after?: string
    },
  ): Promise<Message[]>
  markAsDelivered(conversationId: string, messageId: string): Promise<void>
  markAsRead(conversationId: string, messageId: string): Promise<void>
  markMultipleAsRead(
    conversationId: string,
    messageIds: string[],
  ): Promise<void>
}
