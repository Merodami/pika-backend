import { Message } from '../entities/Message.js'

export interface MessageRepositoryPort {
  create(message: Message): Promise<void>
  update(message: Message): Promise<void>
  findById(id: string): Promise<Message | null>
  findByConversation(
    conversationId: string,
    limit?: number,
    before?: Date,
  ): Promise<Message[]>
  markAsDelivered(messageIds: string[], userId: string): Promise<void>
  markAsRead(messageIds: string[], userId: string): Promise<void>
  delete(id: string): Promise<void>
}
