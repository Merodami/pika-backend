import { Message } from '@communication-read/domain/entities/Message.js'
import { MessageReadRepositoryPort } from '@communication-read/domain/ports/MessageReadRepositoryPort.js'
import { MessageType } from '@communication-shared/types/index.js'
import { FirebaseAdminClient } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'
import { get } from 'lodash-es'

export class FirebaseMessageReadRepository
  implements MessageReadRepositoryPort
{
  private readonly db: Firestore
  private readonly messagesCollection = 'communication'
  private readonly conversationsCollection = 'conversations'

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
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

    const data = messageDoc.data()

    if (data?.conversationId !== conversationId) {
      return null
    }

    return Message.fromFirebaseData(messageId, data)
  }

  async findByConversation(
    conversationId: string,
    options?: {
      limit?: number
      before?: string
      after?: string
      includeDeleted?: boolean
    },
  ): Promise<{
    messages: Message[]
    hasMore: boolean
    cursor?: string
  }> {
    let query = this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')

    const limit = options?.limit || 50

    if (options?.before) {
      query = query.startAfter(options.before)
    }

    if (options?.after) {
      query = query.endBefore(options.after)
    }

    // Fetch one extra to check if there are more messages
    const snapshot = await query.limit(limit + 1).get()

    let messages = snapshot.docs.map((doc) =>
      Message.fromFirebaseData(doc.id, doc.data()),
    )

    // Filter out deleted messages unless explicitly requested
    if (!options?.includeDeleted) {
      messages = messages.filter((msg) => !msg.isDeleted())
    }

    const hasMore = snapshot.docs.length > limit

    if (hasMore) {
      messages = messages.slice(0, limit)
    }

    const cursor =
      messages.length > 0 ? messages[messages.length - 1].id : undefined

    return {
      messages,
      hasMore,
      cursor,
    }
  }

  async search(
    conversationId: string,
    searchTerm: string,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<{
    messages: Message[]
    total: number
  }> {
    // This is a simple text search - in production, you'd use a search service like Algolia
    const messagesSnapshot = await this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .where('conversationId', '==', conversationId)
      .where('type', '==', MessageType.TEXT)
      .get()

    const searchQuery = searchTerm.toLowerCase()
    const matchingMessages: Message[] = []

    for (const messageDoc of messagesSnapshot.docs) {
      const message = Message.fromFirebaseData(messageDoc.id, messageDoc.data())

      if (
        !message.isDeleted() &&
        message.content.toLowerCase().includes(searchQuery)
      ) {
        matchingMessages.push(message)
      }
    }

    // Sort by creation date (most recent first)
    matchingMessages.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )

    const total = matchingMessages.length
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    const paginatedMessages = matchingMessages.slice(offset, offset + limit)

    return {
      messages: paginatedMessages,
      total,
    }
  }

  async getMessageCount(conversationId: string): Promise<number> {
    const snapshot = await this.db
      .collection(this.messagesCollection)
      .doc('messages')
      .collection('data')
      .where('conversationId', '==', conversationId)
      .where('deletedAt', '==', null)
      .count()
      .get()

    return snapshot.data().count
  }

  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const conversationDoc = await this.db
      .collection(this.conversationsCollection)
      .doc(conversationId)
      .get()

    if (!conversationDoc.exists) {
      return 0
    }

    const data = conversationDoc.data()
    const participant = get(data, ['participants', userId])

    return participant?.unreadCount || 0
  }
}
