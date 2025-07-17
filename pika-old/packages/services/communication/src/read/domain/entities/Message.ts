import {
  EnhancedMessageMetadata,
  MessageStatus,
  MessageType,
} from '@communication-shared/types/index.js'

export interface MessageRead {
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
  constructor(private readonly data: MessageRead) {}

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

  getDisplayContent(): string {
    if (this.isDeleted()) {
      return 'This message was deleted'
    }

    switch (this.data.type) {
      case MessageType.IMAGE:
        return '📷 Image'
      case MessageType.FILE:
        return `📎 ${this.data.metadata?.fileName || 'File'}`
      case MessageType.SYSTEM:
        return this.data.content
      default:
        return this.data.content
    }
  }

  toObject(): MessageRead {
    return {
      ...this.data,
      status: { ...this.data.status },
      replyTo: this.data.replyTo ? { ...this.data.replyTo } : null,
      editHistory: [...this.data.editHistory],
    }
  }

  static fromFirebaseData(id: string, data: any): Message {
    return new Message({
      id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderType: data.senderType,
      type: data.type,
      content: data.content,
      metadata: data.metadata || null,
      status: {
        sent: data.status.sent.toDate(),
        delivered: data.status.delivered?.toDate(),
        read: data.status.read?.toDate(),
      },
      replyTo: data.replyTo || null,
      editHistory: data.editHistory || [],
      deletedAt: data.deletedAt?.toDate() || null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    })
  }
}
