import { Conversation } from '@communication-read/domain/entities/Conversation.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { ErrorFactory, FirebaseAdminClient, logger } from '@pika/shared'
import { Firestore } from 'firebase-admin/firestore'

export class FirebaseConversationReadRepository
  implements ConversationReadRepositoryPort
{
  private readonly db: Firestore
  private readonly conversationsCollection = 'conversations'

  constructor() {
    this.db = FirebaseAdminClient.getInstance().firestore
  }

  async findById(conversationId: string): Promise<Conversation | null> {
    try {
      logger.debug('Finding conversation by ID in Firebase (read)', {
        conversationId,
      })

      const doc = await this.db
        .collection(this.conversationsCollection)
        .doc(conversationId)
        .get()

      if (!doc.exists) {
        logger.debug('Conversation not found in Firebase (read)', {
          conversationId,
        })

        return null
      }

      const conversation = this.fromFirebaseData(doc.data()!)

      logger.debug('Conversation found in Firebase (read)', { conversationId })

      return conversation
    } catch (error) {
      logger.error('Failed to find conversation by ID in Firebase (read)', {
        error: error.message,
        conversationId,
      })

      throw ErrorFactory.databaseError(
        'conversation_read_find_by_id',
        'Failed to find conversation by ID',
        error,
        {
          source: 'FirebaseConversationReadRepository.findById',
          metadata: { conversationId },
        },
      )
    }
  }

  async findByParticipant(
    userId: string,
    options?: {
      includeArchived?: boolean
      includeBlocked?: boolean
      limit?: number
      offset?: number
    },
  ): Promise<{
    conversations: Conversation[]
    total: number
  }> {
    try {
      logger.debug('Finding conversations by user ID in Firebase (read)', {
        userId,
        options,
      })

      let query = this.db
        .collection('user_conversations')
        .doc(userId)
        .collection('conversations')
        .orderBy('updatedAt', 'desc')

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.offset(options.offset)
      }

      const snapshot = await query.get()
      const conversations: Conversation[] = []

      // Get total count first
      const totalSnapshot = await this.db
        .collection('user_conversations')
        .doc(userId)
        .collection('conversations')
        .get()

      let total = 0

      for (const doc of snapshot.docs) {
        const conversationId = doc.data().conversationId
        const conversation = await this.findById(conversationId)

        if (conversation) {
          // Simple filtering - if user is in mutedBy, consider it archived
          if (
            !options?.includeArchived &&
            conversation.mutedBy.includes(userId)
          ) {
            continue
          }

          conversations.push(conversation)
        }
      }

      // Count total based on filtering
      for (const doc of totalSnapshot.docs) {
        const conversationId = doc.data().conversationId
        const conversation = await this.findById(conversationId)

        if (conversation) {
          if (
            !options?.includeArchived &&
            conversation.mutedBy.includes(userId)
          ) {
            continue
          }
          total++
        }
      }

      logger.debug('Found conversations by participant in Firebase (read)', {
        userId,
        count: conversations.length,
        total,
      })

      return { conversations, total }
    } catch (error) {
      logger.error(
        'Failed to find conversations by user ID in Firebase (read)',
        {
          error: error.message,
          userId,
        },
      )

      throw ErrorFactory.databaseError(
        'conversation_read_find_by_user',
        'Failed to find conversations by user ID',
        error,
        {
          source: 'FirebaseConversationReadRepository.findByParticipant',
          metadata: { userId },
        },
      )
    }
  }

  async search(
    userId: string,
    searchTerm: string,
    options?: {
      limit?: number
      offset?: number
    },
  ): Promise<{
    conversations: Conversation[]
    total: number
  }> {
    try {
      logger.debug('Searching conversations in Firebase (read)', {
        userId,
        searchTerm,
        options,
      })

      // Simple search implementation - in production you'd use a search service
      const { conversations } = await this.findByParticipant(userId, {
        includeArchived: true,
        limit: 100, // Get more to filter
      })

      const filtered = conversations.filter(
        (conv) =>
          conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.lastMessage?.content
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )

      const total = filtered.length
      const start = options?.offset || 0
      const end = start + (options?.limit || 20)
      const paged = filtered.slice(start, end)

      return { conversations: paged, total }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_search',
        'Failed to search conversations',
        error,
        {
          source: 'FirebaseConversationReadRepository.search',
          metadata: { userId, searchTerm },
        },
      )
    }
  }

  async getConversationStats(userId: string): Promise<{
    total: number
    unread: number
    archived: number
    blocked: number
  }> {
    try {
      logger.debug('Getting conversation stats in Firebase (read)', { userId })

      const { conversations } = await this.findByParticipant(userId, {
        includeArchived: true,
        includeBlocked: true,
      })

      const stats = {
        total: conversations.length,
        unread: 0,
        archived: 0,
        blocked: 0,
      }

      for (const conv of conversations) {
        if (conv.mutedBy.includes(userId)) {
          stats.archived++
        }
        // Add logic for unread and blocked when implemented
      }

      return stats
    } catch (error) {
      throw ErrorFactory.databaseError(
        'conversation_stats',
        'Failed to get conversation stats',
        error,
        {
          source: 'FirebaseConversationReadRepository.getConversationStats',
          metadata: { userId },
        },
      )
    }
  }

  async findByParticipants(
    participantIds: string[],
  ): Promise<Conversation | null> {
    try {
      logger.debug('Finding conversation by participants in Firebase (read)', {
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

          logger.debug(
            'Found conversation by participants in Firebase (read)',
            {
              conversationId: conversation.id,
            },
          )

          return conversation
        }
      }

      logger.debug('No conversation found by participants in Firebase (read)', {
        participantIds,
      })

      return null
    } catch (error) {
      logger.error(
        'Failed to find conversation by participants in Firebase (read)',
        {
          error: error.message,
          participantIds,
        },
      )

      throw ErrorFactory.databaseError(
        'conversation_read_find_by_participants',
        'Failed to find conversation by participants',
        error,
        {
          source: 'FirebaseConversationReadRepository.findByParticipants',
          metadata: { participantIds },
        },
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
