import { FirebaseAdminClient } from '@pika/shared'

import { ConversationParticipant } from '../../../shared/types.js'
import { Conversation } from '../../domain/entities/Conversation.js'
import { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort.js'

export class FirebaseConversationRepository
  implements ConversationRepositoryPort
{
  private readonly db = FirebaseAdminClient.getInstance().firestore
  private readonly conversationsCollection = 'conversations'

  async create(conversation: Conversation): Promise<void> {
    const conversationRef = this.db
      .collection(this.conversationsCollection)
      .doc(conversation.id)

    await conversationRef.set(conversation.toFirebaseData())

    // Also update each user's conversation list
    const batch = this.db.batch()

    for (const [userId] of conversation.participants) {
      const userConvRef = this.db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .doc(conversation.id)

      batch.set(userConvRef, {
        conversationId: conversation.id,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        unread: false,
      })
    }

    await batch.commit()
  }

  async update(conversation: Conversation): Promise<void> {
    const conversationRef = this.db
      .collection(this.conversationsCollection)
      .doc(conversation.id)

    await conversationRef.update(conversation.toFirebaseData())

    // Update user conversation lists if there's a new message
    if (conversation.lastMessage) {
      const batch = this.db.batch()

      for (const [userId, participant] of conversation.participants) {
        const userConvRef = this.db
          .collection('users')
          .doc(userId)
          .collection('conversations')
          .doc(conversation.id)

        batch.update(userConvRef, {
          lastMessage: conversation.lastMessage,
          updatedAt: conversation.updatedAt,
          unread: participant.unreadCount > 0,
        })
      }

      await batch.commit()
    }
  }

  async findById(id: string): Promise<Conversation | null> {
    const doc = await this.db
      .collection(this.conversationsCollection)
      .doc(id)
      .get()

    if (!doc.exists) {
      return null
    }

    return this.fromFirebaseData(id, doc.data()!)
  }

  async findByParticipants(
    participant1Id: string,
    participant2Id: string,
  ): Promise<Conversation | null> {
    // Query for conversations where both participants exist
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

  async delete(id: string): Promise<void> {
    const conversationRef = this.db
      .collection(this.conversationsCollection)
      .doc(id)
    const conversation = await this.findById(id)

    if (!conversation) {
      return
    }

    // Delete from users' conversation lists
    const batch = this.db.batch()

    for (const [userId] of conversation.participants) {
      const userConvRef = this.db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .doc(id)

      batch.delete(userConvRef)
    }

    // Delete all messages in the conversation
    const messagesSnapshot = await conversationRef.collection('messages').get()

    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete the conversation itself
    batch.delete(conversationRef)

    await batch.commit()
  }

  private fromFirebaseData(id: string, data: any): Conversation {
    const participants = new Map<string, ConversationParticipant>()

    for (const [userId, participantData] of Object.entries(
      data.participants as Record<string, any>,
    )) {
      participants.set(userId, {
        userId: participantData.userId,
        userType: participantData.userType,
        joinedAt: participantData.joinedAt?.toDate() || new Date(),
        lastReadAt: participantData.lastReadAt?.toDate(),
        lastReadMessageId: participantData.lastReadMessageId,
        isArchived: participantData.isArchived || false,
        isBlocked: participantData.isBlocked || false,
        isMuted: participantData.isMuted || false,
        unreadCount: participantData.unreadCount || 0,
      })
    }

    const conversation = Object.create(Conversation.prototype)

    Object.assign(conversation, {
      id,
      participants,
      lastMessage: data.lastMessage
        ? {
            ...data.lastMessage,
            sentAt: data.lastMessage.sentAt?.toDate() || new Date(),
          }
        : null,
      context: data.context || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    })

    return conversation
  }
}
