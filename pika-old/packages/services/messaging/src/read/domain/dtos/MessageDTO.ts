import { MessageType } from '../../../shared/types.js'

/**
 * Message DTOs for read operations
 */

export interface MessageDTO {
  id: string
  conversationId: string
  senderId: string
  senderType: 'CUSTOMER' | 'PROVIDER'
  type: MessageType
  content: string
  metadata?: {
    fileName?: string
    fileSize?: number
    fileUrl?: string
    thumbnailUrl?: string
    mimeType?: string
  }
  status: {
    sent: Date
    delivered?: Date
    read?: Date
  }
  replyTo?: {
    messageId: string
    content: string
    senderId: string
  }
  editHistory?: Array<{
    content: string
    editedAt: Date
  }>
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface GetMessagesQueryDTO {
  conversationId: string
  limit?: number
  before?: Date
  after?: Date
}

export interface GetMessagesResponseDTO {
  messages: MessageDTO[]
  pagination: {
    limit: number
    hasMore: boolean
  }
}
