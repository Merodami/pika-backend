export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum ConversationContext {
  VOUCHER_REDEMPTION = 'VOUCHER_REDEMPTION',
  VOUCHER_INQUIRY = 'VOUCHER_INQUIRY',
  PROVIDER_INQUIRY = 'PROVIDER_INQUIRY',
  GENERAL = 'GENERAL',
}

export interface ConversationParticipant {
  userId: string
  userType: 'CUSTOMER' | 'PROVIDER'
  joinedAt: Date
  lastReadAt?: Date
  lastReadMessageId?: string
  isArchived: boolean
  isBlocked: boolean
  isMuted: boolean
  unreadCount: number
}

export interface ConversationMetadata {
  id: string
  participants: Record<string, ConversationParticipant>
  lastMessage?: {
    id: string
    content: string
    senderId: string
    sentAt: Date
    type: MessageType
  }
  context?: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  }
  createdAt: Date
  updatedAt: Date
}

export interface MessageData {
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

export interface CreateConversationDto {
  participantIds: string[]
  context?: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  }
}

export interface SendMessageDto {
  conversationId: string
  senderId: string
  type: MessageType
  content: string
  metadata?: Record<string, any>
  replyToId?: string
}

export interface UpdateMessageStatusDto {
  messageIds: string[]
  status: MessageStatus
  userId: string
}

export interface GetMessagesQuery {
  conversationId: string
  limit?: number
  before?: Date
  after?: Date
}

export interface GetConversationsQuery {
  userId: string
  page?: number
  limit?: number
  includeArchived?: boolean
}
