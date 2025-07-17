import {
  ConversationContext,
  ConversationParticipant,
  MessageType,
} from '@communication-shared/types/index.js'

export interface ConversationRead {
  id: string
  participantIds: string[]
  participants: Map<string, ConversationParticipant>
  type: string
  title: string | null
  lastMessage: {
    id: string
    content: string
    senderId: string
    sentAt: Date
    type: MessageType
  } | null
  lastMessageAt: Date | null
  mutedBy: string[]
  context: {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  } | null
  metadata: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export class Conversation {
  constructor(private readonly data: ConversationRead) {}

  get id(): string {
    return this.data.id
  }

  get participantIds(): string[] {
    return [...this.data.participantIds]
  }

  get participants(): Map<string, ConversationParticipant> {
    return new Map(this.data.participants)
  }

  get type(): string {
    return this.data.type
  }

  get title(): string | null {
    return this.data.title
  }

  get lastMessageAt(): Date | null {
    return this.data.lastMessageAt
  }

  get mutedBy(): string[] {
    return [...this.data.mutedBy]
  }

  get metadata(): Record<string, any> | null {
    return this.data.metadata ? { ...this.data.metadata } : null
  }

  get lastMessage(): {
    id: string
    content: string
    senderId: string
    sentAt: Date
    type: MessageType
  } | null {
    return this.data.lastMessage ? { ...this.data.lastMessage } : null
  }

  get context(): {
    type: ConversationContext
    id: string
    metadata?: Record<string, any>
  } | null {
    return this.data.context ? { ...this.data.context } : null
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get updatedAt(): Date {
    return this.data.updatedAt
  }

  // Query methods
  isParticipant(userId: string): boolean {
    return this.data.participants.has(userId)
  }

  getParticipant(userId: string): ConversationParticipant | null {
    const participant = this.data.participants.get(userId)

    return participant ? { ...participant } : null
  }

  getOtherParticipant(userId: string): string | null {
    if (!this.isParticipant(userId)) {
      return null
    }

    for (const [participantId] of this.data.participants) {
      if (participantId !== userId) {
        return participantId
      }
    }

    return null
  }

  getUnreadCount(userId: string): number {
    const participant = this.data.participants.get(userId)

    return participant?.unreadCount || 0
  }

  isArchived(userId: string): boolean {
    const participant = this.data.participants.get(userId)

    return participant?.isArchived || false
  }

  isBlocked(userId: string): boolean {
    const participant = this.data.participants.get(userId)

    if (!participant) {
      return false
    }

    // Check if either participant has blocked the other
    for (const [, p] of this.data.participants) {
      if (p.isBlocked) {
        return true
      }
    }

    return false
  }

  isMuted(userId: string): boolean {
    const participant = this.data.participants.get(userId)

    return participant?.isMuted || false
  }

  markAsRead(userId: string, messageId: string): void {
    const participant = this.data.participants.get(userId)

    if (participant) {
      participant.lastReadMessageId = messageId
      participant.lastReadAt = new Date()
      participant.unreadCount = 0
    }
  }

  getLastMessagePreview(): string {
    if (!this.data.lastMessage) {
      return 'No messages yet'
    }

    switch (this.data.lastMessage.type) {
      case MessageType.IMAGE:
        return '📷 Image'
      case MessageType.FILE:
        return '📎 File'
      case MessageType.SYSTEM:
        return this.data.lastMessage.content
      default:
        return this.data.lastMessage.content.length > 100
          ? this.data.lastMessage.content.substring(0, 97) + '...'
          : this.data.lastMessage.content
    }
  }

  toObject(): ConversationRead {
    return {
      ...this.data,
      participantIds: [...this.data.participantIds],
      participants: new Map(this.data.participants),
      mutedBy: [...this.data.mutedBy],
      lastMessage: this.data.lastMessage ? { ...this.data.lastMessage } : null,
      context: this.data.context ? { ...this.data.context } : null,
      metadata: this.data.metadata ? { ...this.data.metadata } : null,
    }
  }

  static reconstitute(data: {
    id: string
    participantIds: string[]
    type: string
    title: string | null
    metadata: Record<string, any> | null
    lastMessage: any | null
    lastMessageAt: Date | null
    mutedBy: string[]
    createdAt: Date
    updatedAt: Date
  }): Conversation {
    return new Conversation({
      ...data,
      participants: new Map(), // Will be populated by repository
      context: null, // Will be set if available
    })
  }

  static fromFirebaseData(id: string, data: any): Conversation {
    const participants = new Map<string, ConversationParticipant>()

    if (data.participants) {
      for (const [userId, participantData] of Object.entries(
        data.participants,
      )) {
        const participant = participantData as any

        participants.set(userId, {
          ...participant,
          joinedAt: participant.joinedAt?.toDate(),
          lastReadAt: participant.lastReadAt?.toDate(),
        })
      }
    }

    return new Conversation({
      id,
      participantIds: data.participantIds || [],
      participants,
      type: data.type || 'CUSTOMER_PROVIDER',
      title: data.title || null,
      lastMessage: data.lastMessage
        ? {
            ...data.lastMessage,
            sentAt: data.lastMessage.sentAt.toDate(),
          }
        : null,
      lastMessageAt: data.lastMessageAt?.toDate() || null,
      mutedBy: data.mutedBy || [],
      context: data.context || null,
      metadata: data.metadata || null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    })
  }
}
