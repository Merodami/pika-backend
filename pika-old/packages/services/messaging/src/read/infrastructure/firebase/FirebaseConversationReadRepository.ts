import { FirebaseAdminClient } from '@pika/shared'
import { get, set } from 'lodash-es'

import {
  ConversationMetadata,
  ConversationParticipant,
} from '../../../shared/types.js'
import { ConversationReadRepositoryPort } from '../../domain/ports/ConversationReadRepositoryPort.js'

export class FirebaseConversationReadRepository
  implements ConversationReadRepositoryPort
{
  private readonly db = FirebaseAdminClient.getInstance().firestore
  private readonly conversationsCollection = 'conversations'

  async findById(id: string): Promise<ConversationMetadata | null> {
    const doc = await this.db
      .collection(this.conversationsCollection)
      .doc(id)
      .get()

    if (!doc.exists) {
      return null
    }

    return this.fromFirebaseData(id, doc.data()!)
  }

  async findByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    includeArchived: boolean = false,
  ): Promise<{ conversations: ConversationMetadata[]; total: number }> {
    // Get user's conversation list
    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')

    // Count total
    const totalSnapshot = await query.get()
    const total = totalSnapshot.size

    // Apply pagination
    query = query.limit(limit).offset(offset)

    const snapshot = await query.get()

    // Fetch full conversation data
    const conversations: ConversationMetadata[] = []

    for (const doc of snapshot.docs) {
      const conversationId = doc.data().conversationId
      const conversation = await this.findById(conversationId)

      if (conversation) {
        const participant = get(conversation.participants, userId)

        // Filter archived if needed
        if (!includeArchived && participant?.isArchived) {
          continue
        }

        conversations.push(conversation)
      }
    }

    return { conversations, total }
  }

  async findByParticipants(
    participant1Id: string,
    participant2Id: string,
  ): Promise<ConversationMetadata | null> {
    const snapshot = await this.db
      .collection(this.conversationsCollection)
      .where(`participants.${participant1Id}.userId`, '==', participant1Id)
      .where(`participants.${participant2Id}.userId`, '==', participant2Id)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return null
    }

    const doc = snapshot.docs[0]

    return this.fromFirebaseData(doc.id, doc.data())
  }

  private fromFirebaseData(id: string, data: any): ConversationMetadata {
    const participants: Record<string, ConversationParticipant> = {}

    // Check if participants exists and is not empty
    if (data.participants && typeof data.participants === 'object') {
      for (const [userId, participantData] of Object.entries(
        data.participants as Record<string, any>,
      )) {
        const participant = {
          userId: participantData.userId,
          userType: participantData.userType,
          joinedAt: participantData.joinedAt?.toDate() || new Date(),
          lastReadAt: participantData.lastReadAt?.toDate() || null,
          lastReadMessageId: participantData.lastReadMessageId,
          isArchived: participantData.isArchived || false,
          isBlocked: participantData.isBlocked || false,
          isMuted: participantData.isMuted || false,
          unreadCount: participantData.unreadCount || 0,
        }

        set(participants, userId, participant)
      }
    }

    return {
      id,
      participants,
      lastMessage: data.lastMessage
        ? {
            ...data.lastMessage,
            sentAt: data.lastMessage.sentAt?.toDate() || new Date(),
          }
        : undefined,
      context: data.context || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  }
}
