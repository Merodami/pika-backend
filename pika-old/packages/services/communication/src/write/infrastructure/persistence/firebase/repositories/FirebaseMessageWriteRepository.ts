import { Message } from '@communication-write/domain/entities/Message.js'
import { MessageWriteRepositoryPort } from '@communication-write/domain/ports/MessageWriteRepositoryPort.js'
import { FirebaseAdminClient } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'

export class FirebaseMessageWriteRepository
  implements MessageWriteRepositoryPort
{
  private readonly db: Firestore
  private readonly messagesCollection = 'communication'

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
  }

  async create(message: Message): Promise<Message> {
    const messageRef = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .doc(message.id)

    await messageRef.set(message.toFirebaseData())

    return message
  }

  async update(message: Message): Promise<Message> {
    const messageRef = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .doc(message.id)

    await messageRef.update(message.toFirebaseData())

    return message
  }

  async findById(
    conversationId: string,
    messageId: string,
  ): Promise<Message | null> {
    const messageDoc = await this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .doc(messageId)
      .get()

    if (!messageDoc.exists) {
      return null
    }

    return this.fromFirebaseData(messageId, messageDoc.data()!)
  }

  async findByConversation(
    conversationId: string,
    options?: {
      limit?: number
      before?: string
      after?: string
    },
  ): Promise<Message[]> {
    let query = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.before) {
      query = query.startAfter(options.before)
    }

    if (options?.after) {
      query = query.endBefore(options.after)
    }

    const snapshot = await query.get()

    return snapshot.docs
      .map((doc) => this.fromFirebaseData(doc.id, doc.data()))
      .reverse() // Return in chronological order
  }

  async markAsDelivered(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const messageRef = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .doc(messageId)

    const now = new Date()

    await messageRef.update({
      'status.delivered': now,
      updatedAt: now,
    })
  }

  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    const messageRef = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .doc(messageId)

    const now = new Date()

    await messageRef.update({
      'status.delivered': now, // Ensure delivered is set
      'status.read': now,
      updatedAt: now,
    })
  }

  async markMultipleAsRead(
    conversationId: string,
    messageIds: string[],
  ): Promise<void> {
    const batch = this.db.batch()
    const now = new Date()

    for (const messageId of messageIds) {
      const messageRef = this.db
        .collection(this.messagesCollection)
        .doc('messages')
        .collection('data')
        .doc(messageId)

      batch.update(messageRef, {
        'status.delivered': now,
        'status.read': now,
        updatedAt: now,
      })
    }

    await batch.commit()
  }

  private fromFirebaseData(id: string, data: any): Message {
    const messageData = {
      id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderType: data.senderType,
      type: data.type,
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
    }

    return Message.reconstitute(messageData)
  }
}
