import { FirebaseAdminClient } from '@pika/shared'
import { get } from 'lodash-es'

import { MessageData, MessageType } from '../../../shared/types.js'
import { MessageReadRepositoryPort } from '../../domain/ports/MessageReadRepositoryPort.js'

export class FirebaseMessageReadRepository
  implements MessageReadRepositoryPort
{
  private readonly db = FirebaseAdminClient.getInstance().firestore
  private readonly conversationsCollection = 'conversations'

  async findById(id: string): Promise<MessageData | null> {
    // This is inefficient - in practice, you'd store conversationId with message lookups
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
    after?: Date,
  ): Promise<MessageData[]> {
    // Use ascending order for proper pagination
    let query = this.db
      .collection(this.conversationsCollection)
      .doc(conversationId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(limit)

    if (before) {
      query = query.where('createdAt', '<', before)
    }

    if (after) {
      query = query.where('createdAt', '>', after)
    }

    const snapshot = await query.get()

    return snapshot.docs
      .map((doc) => this.fromFirebaseData(doc.id, doc.data()))
      .filter((msg) => !msg.deletedAt) // Filter out deleted messages
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    const conversationDoc = await this.db
      .collection(this.conversationsCollection)
      .doc(conversationId)
      .get()

    if (!conversationDoc.exists) {
      return 0
    }

    const participant = get(conversationDoc.data()?.participants, userId)

    return participant?.unreadCount || 0
  }

  async search(
    userId: string,
    query: string,
    limit: number = 20,
  ): Promise<MessageData[]> {
    // Get user's conversations first
    const userConversations = await this.db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .get()

    const messages: MessageData[] = []
    const searchQuery = query.toLowerCase()

    // Search messages in each conversation
    for (const convDoc of userConversations.docs) {
      const conversationId = convDoc.data().conversationId

      // This is a simple text search - in production, you'd use a search service
      const messagesSnapshot = await this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .collection('messages')
        .where('type', '==', MessageType.TEXT)
        .get()

      for (const messageDoc of messagesSnapshot.docs) {
        const messageData = this.fromFirebaseData(
          messageDoc.id,
          messageDoc.data(),
        )

        if (
          !messageData.deletedAt &&
          messageData.content.toLowerCase().includes(searchQuery)
        ) {
          messages.push(messageData)

          if (messages.length >= limit) {
            return messages
          }
        }
      }
    }

    return messages
  }

  private fromFirebaseData(id: string, data: any): MessageData {
    return {
      id,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderType: data.senderType,
      type: data.type as MessageType,
      content: data.content,
      metadata: data.metadata || undefined,
      status: {
        sent: data.status.sent?.toDate() || new Date(),
        delivered: data.status.delivered?.toDate(),
        read: data.status.read?.toDate(),
      },
      replyTo: data.replyTo || undefined,
      editHistory: data.editHistory || undefined,
      deletedAt: data.deletedAt?.toDate() || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  }
}
