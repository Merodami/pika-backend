import { MessageType } from '../../../shared/types.js'

/**
 * Message DTOs for write operations
 */

export type SendMessageDTO = {
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
  replyToId?: string
}

export type MarkMessagesReadDTO = {
  conversationId: string
  messageIds: string[]
  userId: string
}

export type MessageResponseDTO = {
  messageId: string
}

export type MarkMessagesReadResponseDTO = {
  success: boolean
}
