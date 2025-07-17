import { set } from 'lodash-es'

import {
  ConversationContext,
  ConversationParticipant,
  MessageType,
} from '../../../shared/types.js'

export class Conversation {
  private constructor(
    public readonly id: string,
    public readonly participants: Map<string, ConversationParticipant>,
    public lastMessage: {
      id: string
      content: string
      senderId: string
      sentAt: Date
      type: MessageType
    } | null,
    public readonly context: {
      type: ConversationContext
      id: string
      metadata?: Record<string, any>
    } | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    participantIds: string[]
    context?: {
      type: ConversationContext
      id: string
      metadata?: Record<string, any>
    }
  }): Conversation {
    if (params.participantIds.length < 2) {
      throw new Error('A conversation must have at least 2 participants')
    }

    if (params.participantIds.length > 2) {
      throw new Error('Group conversations are not supported yet')
    }

    const uniqueParticipants = new Set(params.participantIds)

    if (uniqueParticipants.size !== params.participantIds.length) {
      throw new Error('Duplicate participants are not allowed')
    }

    const participants = new Map<string, ConversationParticipant>()
    const now = new Date()

    for (const userId of params.participantIds) {
      participants.set(userId, {
        userId,
        userType: 'CUSTOMER', // This should be determined from user service
        joinedAt: now,
        isArchived: false,
        isBlocked: false,
        isMuted: false,
        unreadCount: 0,
      })
    }

    return new Conversation(
      params.id,
      participants,
      null,
      params.context || null,
      now,
      now,
    )
  }

  isParticipant(userId: string): boolean {
    return this.participants.has(userId)
  }

  getOtherParticipant(userId: string): string | null {
    if (!this.isParticipant(userId)) {
      return null
    }

    for (const [participantId] of this.participants) {
      if (participantId !== userId) {
        return participantId
      }
    }

    return null
  }

  isBlocked(userId: string): boolean {
    const participant = this.participants.get(userId)

    if (!participant) {
      return false
    }

    // Check if either participant has blocked the other
    for (const [, p] of this.participants) {
      if (p.isBlocked) {
        return true
      }
    }

    return false
  }

  updateLastMessage(message: {
    id: string
    content: string
    senderId: string
    type: MessageType
  }): void {
    this.lastMessage = {
      ...message,
      sentAt: new Date(),
    }
    this.updatedAt = new Date()

    // Increment unread count for other participants
    for (const [userId, participant] of this.participants) {
      if (userId !== message.senderId) {
        participant.unreadCount++
      }
    }
  }

  markAsRead(userId: string, messageId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.lastReadAt = new Date()
    participant.lastReadMessageId = messageId
    participant.unreadCount = 0
    this.updatedAt = new Date()
  }

  archive(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isArchived = true
    this.updatedAt = new Date()
  }

  unarchive(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isArchived = false
    this.updatedAt = new Date()
  }

  block(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isBlocked = true
    this.updatedAt = new Date()
  }

  unblock(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isBlocked = false
    this.updatedAt = new Date()
  }

  mute(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isMuted = true
    this.updatedAt = new Date()
  }

  unmute(userId: string): void {
    const participant = this.participants.get(userId)

    if (!participant) {
      throw new Error('User is not a participant in this conversation')
    }

    participant.isMuted = false
    this.updatedAt = new Date()
  }

  toFirebaseData(): Record<string, any> {
    const participants: Record<string, any> = {}

    for (const [userId, participant] of this.participants) {
      set(participants, userId, {
        userId: participant.userId,
        userType: participant.userType,
        joinedAt: participant.joinedAt,
        lastReadAt: participant.lastReadAt || null,
        lastReadMessageId: participant.lastReadMessageId || null,
        isArchived: participant.isArchived,
        isBlocked: participant.isBlocked,
        isMuted: participant.isMuted,
        unreadCount: participant.unreadCount,
      })
    }

    const data: Record<string, any> = {
      participants,
      lastMessage: this.lastMessage || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }

    // Only include context if it exists and has all required fields
    if (this.context) {
      data.context = {
        type: this.context.type,
        id: this.context.id,
      }
      // Only add metadata if it exists
      if (this.context.metadata) {
        data.context.metadata = this.context.metadata
      }
    }

    return data
  }
}
