import { Conversation } from '@communication-write/domain/entities/Conversation.js'
import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { ErrorFactory, FirebaseAdminClient, logger } from '@pika/shared'
import { FieldValue, Firestore } from 'firebase-admin/firestore'

export class FirebaseConversationWriteRepository
  implements ConversationWriteRepositoryPort
{
  private readonly db: Firestore
  private readonly conversationsCollection = 'conversations'

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
  }

  async create(conversation: Conversation): Promise<Conversation> {
    try {
      logger.debug('Creating conversation in Firebase', {
        conversationId: conversation.id,
        participantCount: conversation.participantIds.length,
      })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversation.id)

      const conversationData = {
        id: conversation.id,
        participantIds: conversation.participantIds,
        type: conversation.type,
        title: conversation.title,
        metadata: conversation.metadata,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        mutedBy: conversation.mutedBy,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }

      logger.debug('Conversation data to be saved:', conversationData)

      await conversationRef.set(conversationData)

      logger.debug('Conversation created successfully in Firebase', {
        conversationId: conversation.id,
      })

      return conversation
    } catch (error) {
      logger.error('Failed to create conversation in Firebase', {
        error: error.message,
        stack: error.stack,
        conversationId: conversation.id,
      })

      throw ErrorFactory.databaseError(
        'conversation_create',
        'Failed to create conversation',
        error,
        {
          source: 'FirebaseConversationWriteRepository.create',
          metadata: { conversationId: conversation.id },
        },
      )
    }
  }

  async update(conversation: Conversation): Promise<Conversation> {
    try {
      logger.debug('Updating conversation in Firebase', {
        conversationId: conversation.id,
      })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversation.id)

      const updateData = {
        participantIds: conversation.participantIds,
        type: conversation.type,
        title: conversation.title,
        metadata: conversation.metadata,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        mutedBy: conversation.mutedBy,
        updatedAt: conversation.updatedAt,
      }

      await conversationRef.update(updateData)

      logger.debug('Conversation updated successfully in Firebase', {
        conversationId: conversation.id,
      })

      return conversation
    } catch (error) {
      logger.error('Failed to update conversation in Firebase', {
        error: error.message,
        conversationId: conversation.id,
      })

      throw ErrorFactory.databaseError(
        'conversation_update',
        'Failed to update conversation',
        error,
        {
          source: 'FirebaseConversationWriteRepository.update',
          metadata: { conversationId: conversation.id },
        },
      )
    }
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    try {
      logger.debug('Finding conversation by ID in Firebase', { conversationId })

      const doc = await this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .get()

      if (!doc.exists) {
        logger.debug('Conversation not found in Firebase', { conversationId })

        return null
      }

      const conversation = this.fromFirebaseData(doc.data()!)

      logger.debug('Conversation found in Firebase', { conversationId })

      return conversation
    } catch (error) {
      logger.error('Failed to find conversation by ID in Firebase', {
        error: error.message,
        conversationId,
      })

      throw ErrorFactory.databaseError(
        'conversation_find_by_id',
        'Failed to find conversation by ID',
        error,
        {
          source: 'FirebaseConversationWriteRepository.findById',
          metadata: { conversationId },
        },
      )
    }
  }

  async findByParticipant(
    userId: string,
    options?: {
      includeArchived?: boolean
      limit?: number
      offset?: number
    },
  ): Promise<Conversation[]> {
    try {
      logger.debug('Finding conversations by participant in Firebase', {
        userId,
        options,
      })

      let query = this.db
        .collection(this.conversationsCollection)
        .where('participantIds', 'array-contains', userId)
        .orderBy('updatedAt', 'desc')

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.offset(options.offset)
      }

      const snapshot = await query.get()
      const conversations: Conversation[] = []

      for (const doc of snapshot.docs) {
        const conversation = this.fromFirebaseData(doc.data())

        // Filter muted conversations if needed (archived filtering removed for simplicity)
        if (
          !options?.includeArchived &&
          conversation.mutedBy.includes(userId)
        ) {
          continue
        }

        conversations.push(conversation)
      }

      logger.debug('Found conversations by participant in Firebase', {
        userId,
        count: conversations.length,
      })

      return conversations
    } catch (error) {
      logger.error('Failed to find conversations by participant in Firebase', {
        error: error.message,
        userId,
      })

      throw ErrorFactory.databaseError(
        'conversation_find_by_participant',
        'Failed to find conversations by participant',
        error,
        {
          source: 'FirebaseConversationWriteRepository.findByParticipant',
          metadata: { userId },
        },
      )
    }
  }

  async findByParticipants(
    participantIds: string[],
  ): Promise<Conversation | null> {
    try {
      logger.debug('Finding conversation by participants in Firebase', {
        participantIds,
      })

      // Simple query for conversations containing all participants
      const snapshot = await this.db
        .collection(this.conversationsCollection)
        .where('participantIds', 'array-contains-any', participantIds)
        .limit(10) // Limit to prevent large queries
        .get()

      // Filter for exact match (all participants must be present)
      for (const doc of snapshot.docs) {
        const data = doc.data()
        const conversationParticipants = data.participantIds || []

        // Check if all participants match exactly
        if (
          participantIds.length === conversationParticipants.length &&
          participantIds.every((id) => conversationParticipants.includes(id))
        ) {
          const conversation = this.fromFirebaseData(data)

          logger.debug('Found conversation by participants in Firebase', {
            conversationId: conversation.id,
          })

          return conversation
        }
      }

      logger.debug('No conversation found by participants in Firebase', {
        participantIds,
      })

      return null
    } catch (error) {
      logger.error('Failed to find conversation by participants in Firebase', {
        error: error.message,
        participantIds,
      })

      throw ErrorFactory.databaseError(
        'conversation_find_by_participants',
        'Failed to find conversation by participants',
        error,
        {
          source: 'FirebaseConversationWriteRepository.findByParticipants',
          metadata: { participantIds },
        },
      )
    }
  }

  async archive(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Archiving conversation for user', {
        conversationId,
        userId,
      })

      // For simplicity, we'll mark the conversation as archived by adding the user to an archivedBy array
      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        archivedBy: FieldValue.arrayUnion(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_archive',
        'Failed to archive conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.archive' },
      )
    }
  }

  async unarchive(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Unarchiving conversation for user', {
        conversationId,
        userId,
      })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        archivedBy: FieldValue.arrayRemove(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_unarchive',
        'Failed to unarchive conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.unarchive' },
      )
    }
  }

  async block(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Blocking conversation for user', { conversationId, userId })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        blockedBy: FieldValue.arrayUnion(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_block',
        'Failed to block conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.block' },
      )
    }
  }

  async unblock(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Unblocking conversation for user', {
        conversationId,
        userId,
      })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        blockedBy: FieldValue.arrayRemove(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_unblock',
        'Failed to unblock conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.unblock' },
      )
    }
  }

  async mute(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Muting conversation for user', { conversationId, userId })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        mutedBy: FieldValue.arrayUnion(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_mute',
        'Failed to mute conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.mute' },
      )
    }
  }

  async unmute(conversationId: string, userId: string): Promise<void> {
    try {
      logger.debug('Unmuting conversation for user', { conversationId, userId })

      const conversationRef = this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)

      await conversationRef.update({
        mutedBy: FieldValue.arrayRemove(userId),
        updatedAt: new Date(),
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_unmute',
        'Failed to unmute conversation',
        error,
        { source: 'FirebaseConversationWriteRepository.unmute' },
      )
    }
  }

  private fromFirebaseData(data: any): Conversation {
    return Conversation.reconstitute({
      id: data.id,
      participantIds: data.participantIds || [],
      type: data.type,
      title: data.title,
      metadata: data.metadata || null,
      lastMessage: data.lastMessage || null,
      lastMessageAt: data.lastMessageAt?.toDate() || null,
      mutedBy: data.mutedBy || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    })
  }
}
