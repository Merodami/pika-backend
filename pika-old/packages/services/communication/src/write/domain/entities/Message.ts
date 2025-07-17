import {
  EnhancedMessageMetadata,
  MessageStatus,
  MessageType,
} from '@communication-shared/types/index.js'
import { ErrorFactory } from '@pika/shared'
import { v4 as uuidv4 } from 'uuid'

interface MessageData {
  id: string
  conversationId: string
  senderId: string
  senderType: 'CUSTOMER' | 'PROVIDER'
  type: MessageType
  content: string
  metadata: EnhancedMessageMetadata | null
  status: {
    sent: Date
    delivered?: Date
    read?: Date
  }
  replyTo: {
    messageId: string
    content: string
    senderId: string
  } | null
  editHistory: Array<{
    content: string
    editedAt: Date
  }>
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Message {
  private constructor(private readonly data: MessageData) {
    this.validateInvariants()
  }

  private validateInvariants(): void {
    // Validate content based on type
    if (this.data.type === MessageType.TEXT && !this.data.content.trim()) {
      throw ErrorFactory.validationError(
        { content: ['Text message content cannot be empty'] },
        { source: 'Message.validateInvariants' },
      )
    }

    if (this.data.type === MessageType.IMAGE && !this.data.metadata?.fileUrl) {
      throw ErrorFactory.validationError(
        { metadata: ['Image message must have a file URL in metadata'] },
        { source: 'Message.validateInvariants' },
      )
    }

    if (this.data.type === MessageType.FILE && !this.data.metadata?.fileUrl) {
      throw ErrorFactory.validationError(
        { metadata: ['File message must have a file URL in metadata'] },
        { source: 'Message.validateInvariants' },
      )
    }

    // Validate reply-to data
    if (this.data.replyTo) {
      if (!this.data.replyTo.content || !this.data.replyTo.senderId) {
        throw ErrorFactory.validationError(
          {
            replyTo: ['Reply message must include original content and sender'],
          },
          { source: 'Message.validateInvariants' },
        )
      }
    }
  }

  static create(params: {
    conversationId: string
    senderId: string
    senderType: 'CUSTOMER' | 'PROVIDER'
    type: MessageType
    content: string
    metadata?: EnhancedMessageMetadata
    replyToId?: string
    replyToContent?: string
    replyToSenderId?: string
  }): Message {
    const now = new Date()
    const id = uuidv4()

    let replyTo = null

    if (params.replyToId) {
      replyTo = {
        messageId: params.replyToId,
        content: params.replyToContent || '',
        senderId: params.replyToSenderId || '',
      }
    }

    return new Message({
      id,
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderType: params.senderType,
      type: params.type,
      content: params.content,
      metadata: params.metadata || null,
      status: { sent: now },
      replyTo,
      editHistory: [],
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(data: MessageData): Message {
    return new Message(data)
  }

  // Getters
  get id(): string {
    return this.data.id
  }

  get conversationId(): string {
    return this.data.conversationId
  }

  get senderId(): string {
    return this.data.senderId
  }

  get senderType(): 'CUSTOMER' | 'PROVIDER' {
    return this.data.senderType
  }

  get type(): MessageType {
    return this.data.type
  }

  get content(): string {
    return this.data.content
  }

  get metadata(): EnhancedMessageMetadata | null {
    return this.data.metadata
  }

  get status(): { sent: Date; delivered?: Date; read?: Date } {
    return { ...this.data.status }
  }

  get replyTo(): {
    messageId: string
    content: string
    senderId: string
  } | null {
    return this.data.replyTo ? { ...this.data.replyTo } : null
  }

  get editHistory(): Array<{ content: string; editedAt: Date }> {
    return [...this.data.editHistory]
  }

  get deletedAt(): Date | null {
    return this.data.deletedAt
  }

  get createdAt(): Date {
    return this.data.createdAt
  }

  get updatedAt(): Date {
    return this.data.updatedAt
  }

  // Business methods
  markAsDelivered(): Message {
    if (this.data.status.delivered) {
      return this // Already delivered
    }

    return new Message({
      ...this.data,
      status: {
        ...this.data.status,
        delivered: new Date(),
      },
      updatedAt: new Date(),
    })
  }

  markAsRead(): Message {
    if (this.data.status.read) {
      return this // Already read
    }

    const now = new Date()

    return new Message({
      ...this.data,
      status: {
        ...this.data.status,
        delivered: this.data.status.delivered || now,
        read: now,
      },
      updatedAt: now,
    })
  }

  edit(newContent: string, editorId: string): Message {
    if (this.data.senderId !== editorId) {
      throw ErrorFactory.validationError(
        { senderId: ['Only the sender can edit their message'] },
        { source: 'Message.edit' },
      )
    }

    if (this.data.deletedAt) {
      throw ErrorFactory.validationError(
        { deletedAt: ['Cannot edit a deleted message'] },
        { source: 'Message.edit' },
      )
    }

    if (this.data.type !== MessageType.TEXT) {
      throw ErrorFactory.validationError(
        { type: ['Only text messages can be edited'] },
        { source: 'Message.edit' },
      )
    }

    if (!newContent.trim()) {
      throw ErrorFactory.validationError(
        { content: ['Message content cannot be empty'] },
        { source: 'Message.edit' },
      )
    }

    const now = new Date()

    return new Message({
      ...this.data,
      content: newContent,
      editHistory: [
        ...this.data.editHistory,
        {
          content: this.data.content,
          editedAt: now,
        },
      ],
      updatedAt: now,
    })
  }

  delete(deleterId: string): Message {
    if (this.data.senderId !== deleterId) {
      throw ErrorFactory.validationError(
        { senderId: ['Only the sender can delete their message'] },
        { source: 'Message.delete' },
      )
    }

    if (this.data.deletedAt) {
      return this // Already deleted
    }

    return new Message({
      ...this.data,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Query methods
  isEdited(): boolean {
    return this.data.editHistory.length > 0
  }

  isDeleted(): boolean {
    return this.data.deletedAt !== null
  }

  getCurrentStatus(): MessageStatus {
    if (this.data.status.read) {
      return MessageStatus.READ
    }
    if (this.data.status.delivered) {
      return MessageStatus.DELIVERED
    }

    return MessageStatus.SENT
  }

  // Persistence helper
  toFirebaseData(): Record<string, any> {
    return {
      conversationId: this.data.conversationId,
      senderId: this.data.senderId,
      senderType: this.data.senderType,
      type: this.data.type,
      content: this.data.content,
      metadata: this.data.metadata || null,
      status: {
        sent: this.data.status.sent,
        delivered: this.data.status.delivered || null,
        read: this.data.status.read || null,
      },
      replyTo: this.data.replyTo || null,
      editHistory:
        this.data.editHistory.length > 0 ? this.data.editHistory : null,
      deletedAt: this.data.deletedAt || null,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
    }
  }

  toObject(): MessageData {
    return {
      ...this.data,
      status: { ...this.data.status },
      replyTo: this.data.replyTo ? { ...this.data.replyTo } : null,
      editHistory: [...this.data.editHistory],
    }
  }
}
