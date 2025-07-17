import { ConversationType } from '@communication-shared/types/index.js'
import { ErrorFactory } from '@pika/shared'
import { v4 as uuidv4 } from 'uuid'

interface ConversationMetadata {
  providerId?: string
  customerId?: string
  voucherId?: string
  [key: string]: any
}

interface LastMessage {
  messageId: string
  content: string
  senderId: string
}

interface ConversationData {
  id: string
  participantIds: string[]
  type: ConversationType
  title?: string
  metadata: ConversationMetadata | null
  lastMessage: LastMessage | null
  lastMessageAt: Date | null
  mutedBy: string[]
  createdAt: Date
  updatedAt: Date
}

export class Conversation {
  private constructor(private readonly data: ConversationData) {
    this.validateInvariants()
  }

  private validateInvariants(): void {
    if (this.data.participantIds.length === 0) {
      throw ErrorFactory.validationError(
        { participantIds: ['Conversation must have at least one participant'] },
        { source: 'Conversation.validateInvariants' },
      )
    }

    if (this.data.type === ConversationType.CUSTOMER_PROVIDER) {
      if (this.data.participantIds.length !== 2) {
        throw ErrorFactory.validationError(
          {
            participantIds: [
              'Customer-Provider conversation must have exactly 2 participants',
            ],
          },
          { source: 'Conversation.validateInvariants' },
        )
      }
    }

    // Remove duplicates
    const uniqueParticipants = [...new Set(this.data.participantIds)]

    if (uniqueParticipants.length !== this.data.participantIds.length) {
      this.data.participantIds = uniqueParticipants
    }
  }

  static create(params: {
    participantIds: string[]
    type: ConversationType
    title?: string
    metadata?: ConversationMetadata
  }): Conversation {
    const now = new Date()
    const id = uuidv4()

    return new Conversation({
      id,
      participantIds: [...params.participantIds],
      type: params.type,
      title: params.title,
      metadata: params.metadata || null,
      lastMessage: null,
      lastMessageAt: null,
      mutedBy: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(data: {
    id: string
    participantIds: string[]
    type: ConversationType
    title?: string
    metadata: ConversationMetadata | null
    lastMessage: LastMessage | null
    lastMessageAt: Date | null
    mutedBy: string[]
    createdAt: Date
    updatedAt: Date
  }): Conversation {
    return new Conversation(data)
  }

  // Getters
  get id(): string {
    return this.data.id
  }

  get participantIds(): string[] {
    return [...this.data.participantIds]
  }

  get type(): ConversationType {
    return this.data.type
  }

  get title(): string | undefined {
    return this.data.title
  }

  get metadata(): ConversationMetadata | null {
    return this.data.metadata ? { ...this.data.metadata } : null
  }

  get lastMessage(): LastMessage | null {
    return this.data.lastMessage ? { ...this.data.lastMessage } : null
  }

  get lastMessageAt(): Date | null {
    return this.data.lastMessageAt
  }

  get mutedBy(): string[] {
    return [...this.data.mutedBy]
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get updatedAt(): Date {
    return this.data.updatedAt
  }

  // Business methods
  updateLastMessage(
    messageId: string,
    content: string,
    senderId: string,
  ): Conversation {
    const now = new Date()

    return new Conversation({
      ...this.data,
      lastMessage: {
        messageId,
        content,
        senderId,
      },
      lastMessageAt: now,
      updatedAt: now,
    })
  }

  addParticipant(userId: string): Conversation {
    if (this.data.type !== ConversationType.GROUP) {
      throw ErrorFactory.validationError(
        { type: ['Can only add participants to group conversations'] },
        { source: 'Conversation.addParticipant' },
      )
    }

    if (this.data.participantIds.includes(userId)) {
      return this // Already a participant
    }

    return new Conversation({
      ...this.data,
      participantIds: [...this.data.participantIds, userId],
      updatedAt: new Date(),
    })
  }

  removeParticipant(userId: string): Conversation {
    if (this.data.type !== ConversationType.GROUP) {
      throw ErrorFactory.validationError(
        { type: ['Can only remove participants from group conversations'] },
        { source: 'Conversation.removeParticipant' },
      )
    }

    if (!this.data.participantIds.includes(userId)) {
      return this // Not a participant
    }

    if (this.data.participantIds.length === 1) {
      throw ErrorFactory.validationError(
        {
          participantIds: ['Cannot remove last participant from conversation'],
        },
        { source: 'Conversation.removeParticipant' },
      )
    }

    return new Conversation({
      ...this.data,
      participantIds: this.data.participantIds.filter((id) => id !== userId),
      updatedAt: new Date(),
    })
  }

  muteForUser(userId: string): Conversation {
    if (this.data.mutedBy.includes(userId)) {
      return this // Already muted
    }

    return new Conversation({
      ...this.data,
      mutedBy: [...this.data.mutedBy, userId],
      updatedAt: new Date(),
    })
  }

  unmuteForUser(userId: string): Conversation {
    if (!this.data.mutedBy.includes(userId)) {
      return this // Not muted
    }

    return new Conversation({
      ...this.data,
      mutedBy: this.data.mutedBy.filter((id) => id !== userId),
      updatedAt: new Date(),
    })
  }

  // Query methods
  isParticipant(userId: string): boolean {
    return this.data.participantIds.includes(userId)
  }

  isMutedForUser(userId: string): boolean {
    return this.data.mutedBy.includes(userId)
  }

  isBlocked(): boolean {
    // For now, conversations are not blocked at the conversation level
    // Blocking is handled at the user level in Firebase
    return false
  }

  markAsRead(): Conversation {
    // This method is used for updating conversation read status
    // The actual participant data is handled in Firebase user_conversations collection
    // For the write entity, we just update the timestamp
    return new Conversation({
      ...this.data,
      updatedAt: new Date(),
    })
  }

  getOtherParticipantId(userId: string): string {
    if (!this.isParticipant(userId)) {
      throw ErrorFactory.validationError(
        { userId: ['User is not a participant in this conversation'] },
        { source: 'Conversation.getOtherParticipantId' },
      )
    }

    if (this.data.type === ConversationType.GROUP) {
      throw ErrorFactory.validationError(
        { type: ['Cannot get other participant in group conversation'] },
        { source: 'Conversation.getOtherParticipantId' },
      )
    }

    return this.data.participantIds.find((id) => id !== userId)!
  }
}
