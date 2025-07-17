import { FirebaseAdminClient } from '@pika/shared'

import { MessageType } from '../../../shared/types.js'
import { Message } from '../../domain/entities/Message.js'
import { MessageRepositoryPort } from '../../domain/ports/MessageRepositoryPort.js'

export class FirebaseMessageRepository implements MessageRepositoryPort {
  private readonly db = FirebaseAdminClient.getInstance().firestore
  private readonly conversationsCollection = 'conversations'

  async create(message: Message): Promise<void> {
    const messageRef = this.db
      .collection(this.conversationsCollection)
      .doc(message.conversationId)
      .collection('messages')
      .doc(message.id)

    await messageRef.set(message.toFirebaseData())
  }

  async update(message: Message): Promise<void> {
    const messageRef = this.db
      .collection(this.conversationsCollection)
      .doc(message.conversationId)
      .collection('messages')
      .doc(message.id)

    await messageRef.update(message.toFirebaseData())
  }

  async findById(id: string): Promise<Message | null> {
    // Need to search across all conversations
    // In practice, you'd want to store conversationId with the message ID
    // or use a separate messages collection
    const conversationsSnapshot = await this.db
      .collection(this.conversationsCollection)
      .get()

    for (const convDoc of conversationsSnapshot.docs) {
      const messageDoc = await convDoc.ref.collection('messages').doc(id).get()

      if (messageDoc.exists) {
        return this.fromFirebaseData(id, messageDoc.data()!)
      }
    }

    return null
  }

  async findByConversation(
    conversationId: string,
    limit: number = 50,
    before?: Date,
  ): Promise<Message[]> {
    let query = this.db
      .collection(this.conversationsCollection)
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    if (before) {
      query = query.where('createdAt', '<', before)
    }

    const snapshot = await query.get()

    return snapshot.docs
      .map((doc) => this.fromFirebaseData(doc.id, doc.data()))
      .reverse() // Return in chronological order
  }

  async markAsDelivered(messageIds: string[], userId: string): Promise<void> {
    const batch = this.db.batch()
    const now = new Date()

    for (const messageId of messageIds) {
      // This is inefficient - in practice, you'd pass conversationId
      const message = await this.findById(messageId)

      if (message && message.senderId !== userId && !message.status.delivered) {
        const messageRef = this.db
          .collection(this.conversationsCollection)
          .doc(message.conversationId)
          .collection('messages')
          .doc(messageId)

        batch.update(messageRef, {
          'status.delivered': now,
          updatedAt: now,
        })
      }
    }

    await batch.commit()
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    const batch = this.db.batch()
    const now = new Date()

    for (const messageId of messageIds) {
      // This is inefficient - in practice, you'd pass conversationId
      const message = await this.findById(messageId)

      if (message && message.senderId !== userId && !message.status.read) {
        const messageRef = this.db
          .collection(this.conversationsCollection)
          .doc(message.conversationId)
          .collection('messages')
          .doc(messageId)

        batch.update(messageRef, {
          'status.delivered': message.status.delivered || now,
          'status.read': now,
          updatedAt: now,
        })
      }
    }

    await batch.commit()
  }

  async delete(id: string): Promise<void> {
    // Find the message first to get conversationId
    const message = await this.findById(id)

    if (!message) {
      return
    }

    const messageRef = this.db
      .collection(this.conversationsCollection)
      .doc(message.conversationId)
      .collection('messages')
      .doc(id)

    await messageRef.update({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  private fromFirebaseData(id: string, data: any): Message {
    const message = Object.create(Message.prototype)

    Object.assign(message, {
      id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderType: data.senderType,
      type: data.type as MessageType,
      content: data.content,
      metadata: data.metadata || null,
      status: {
        sent: data.status.sent?.toDate() || new Date(),
        delivered: data.status.delivered?.toDate(),
        read: data.status.read?.toDate(),
      },
      replyTo: data.replyTo || null,
      editHistory: data.editHistory || [],
      deletedAt: data.deletedAt?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    })

    return message
  }
}
