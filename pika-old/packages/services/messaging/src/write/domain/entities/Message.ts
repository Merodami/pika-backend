import { MessageStatus, MessageType } from '../../../shared/types.js'

export class Message {
  private constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly senderType: 'CUSTOMER' | 'PROVIDER',
    public readonly type: MessageType,
    public content: string,
    public readonly metadata: Record<string, any> | null,
    public status: {
      sent: Date
      delivered?: Date
      read?: Date
    },
    public readonly replyTo: {
      messageId: string
      content: string
      senderId: string
    } | null,
    public editHistory: Array<{
      content: string
      editedAt: Date
    }>,
    public deletedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(params: {
    id: string
    conversationId: string
    senderId: string
    senderType: 'CUSTOMER' | 'PROVIDER'
    type: MessageType
    content: string
    metadata?: Record<string, any>
    replyToId?: string
    replyToContent?: string
    replyToSenderId?: string
  }): Message {
    // Validate content based on type
    if (params.type === MessageType.TEXT && !params.content.trim()) {
      throw new Error('Text message content cannot be empty')
    }

    if (params.type === MessageType.IMAGE && !params.metadata?.fileUrl) {
      throw new Error('Image message must have a file URL in metadata')
    }

    if (params.type === MessageType.FILE && !params.metadata?.fileUrl) {
      throw new Error('File message must have a file URL in metadata')
    }

    // Validate reply-to data
    let replyTo = null

    if (params.replyToId) {
      if (!params.replyToContent || !params.replyToSenderId) {
        throw new Error(
          'Reply message must include original content and sender',
        )
      }
      replyTo = {
        messageId: params.replyToId,
        content: params.replyToContent,
        senderId: params.replyToSenderId,
      }
    }

    const now = new Date()

    return new Message(
      params.id,
      params.conversationId,
      params.senderId,
      params.senderType,
      params.type,
      params.content,
      params.metadata || null,
      { sent: now },
      replyTo,
      [],
      null,
      now,
      now,
    )
  }

  markAsDelivered(): void {
    if (this.status.delivered) {
      return // Already delivered
    }

    this.status.delivered = new Date()
    this.updatedAt = new Date()
  }

  markAsRead(): void {
    if (this.status.read) {
      return // Already read
    }

    // Mark as delivered if not already
    if (!this.status.delivered) {
      this.status.delivered = new Date()
    }

    this.status.read = new Date()
    this.updatedAt = new Date()
  }

  edit(newContent: string, editorId: string): void {
    if (this.senderId !== editorId) {
      throw new Error('Only the sender can edit their message')
    }

    if (this.deletedAt) {
      throw new Error('Cannot edit a deleted message')
    }

    if (this.type !== MessageType.TEXT) {
      throw new Error('Only text messages can be edited')
    }

    if (!newContent.trim()) {
      throw new Error('Message content cannot be empty')
    }

    // Add current content to edit history
    this.editHistory.push({
      content: this.content,
      editedAt: new Date(),
    })

    this.content = newContent
    this.updatedAt = new Date()
  }

  delete(deleterId: string): void {
    if (this.senderId !== deleterId) {
      throw new Error('Only the sender can delete their message')
    }

    if (this.deletedAt) {
      return // Already deleted
    }

    this.deletedAt = new Date()
    this.updatedAt = new Date()
  }

  isEdited(): boolean {
    return this.editHistory.length > 0
  }

  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  getCurrentStatus(): MessageStatus {
    if (this.status.read) {
      return MessageStatus.READ
    }
    if (this.status.delivered) {
      return MessageStatus.DELIVERED
    }

    return MessageStatus.SENT
  }

  toFirebaseData(): Record<string, any> {
    return {
      conversationId: this.conversationId,
      senderId: this.senderId,
      senderType: this.senderType,
      type: this.type,
      content: this.content,
      metadata: this.metadata || null,
      status: {
        sent: this.status.sent,
        delivered: this.status.delivered || null,
        read: this.status.read || null,
      },
      replyTo: this.replyTo || null,
      editHistory: this.editHistory.length > 0 ? this.editHistory : null,
      deletedAt: this.deletedAt || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
