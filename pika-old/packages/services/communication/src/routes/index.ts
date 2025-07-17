// Import routers
import { createConversationReadRouter } from '@communication-read/api/routes/ConversationRouter.js'
import { createMessageReadRouter } from '@communication-read/api/routes/MessageRouter.js'
import { createNotificationReadRouter } from '@communication-read/api/routes/NotificationRouter.js'
// Import repositories
import { FirebaseConversationReadRepository } from '@communication-read/infrastructure/persistence/firebase/repositories/FirebaseConversationReadRepository.js'
import { FirebaseMessageReadRepository } from '@communication-read/infrastructure/persistence/firebase/repositories/FirebaseMessageReadRepository.js'
import { FirebaseNotificationReadRepository } from '@communication-read/infrastructure/persistence/firebase/repositories/FirebaseNotificationReadRepository.js'
import { createConversationWriteRouter } from '@communication-write/api/routes/ConversationRouter.js'
import { createMessageWriteRouter } from '@communication-write/api/routes/MessageRouter.js'
import { createNotificationWriteRouter } from '@communication-write/api/routes/NotificationRouter.js'
import { NotificationBatcher } from '@communication-write/domain/services/NotificationBatcher.js'
// Import services
import { NotificationOrchestrator } from '@communication-write/domain/services/NotificationOrchestrator.js'
import { FirebaseConversationWriteRepository } from '@communication-write/infrastructure/persistence/firebase/repositories/FirebaseConversationWriteRepository.js'
import { FirebaseMessageWriteRepository } from '@communication-write/infrastructure/persistence/firebase/repositories/FirebaseMessageWriteRepository.js'
import { FirebaseNotificationWriteRepository } from '@communication-write/infrastructure/persistence/firebase/repositories/FirebaseNotificationWriteRepository.js'
import { logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createCommunicationRoutes(): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize repositories
    const conversationReadRepository = new FirebaseConversationReadRepository()
    const messageReadRepository = new FirebaseMessageReadRepository()
    const notificationReadRepository = new FirebaseNotificationReadRepository()

    const conversationWriteRepository =
      new FirebaseConversationWriteRepository()
    const messageWriteRepository = new FirebaseMessageWriteRepository()
    const notificationWriteRepository =
      new FirebaseNotificationWriteRepository()

    // Initialize domain services
    // Simple push queue stub for now
    const pushQueue = {
      enqueue: async (payload: any) => {
        logger.debug('Push notification queued', payload)
      },
    }

    const notificationBatcher = new NotificationBatcher(pushQueue)

    // Simple user service stub for now
    const userService = {
      getUserProfile: async (userId: string) => ({
        id: userId,
        name: 'User',
        type: 'CUSTOMER' as const,
      }),
    }

    const notificationOrchestrator = new NotificationOrchestrator(
      notificationWriteRepository,
      notificationBatcher,
      userService,
    )

    // Register read routes
    await fastify.register(
      createConversationReadRouter(conversationReadRepository),
      { prefix: '/conversations' },
    )

    await fastify.register(
      createMessageReadRouter(
        messageReadRepository,
        conversationReadRepository,
      ),
      { prefix: '/conversations' },
    )

    await fastify.register(
      createNotificationReadRouter(notificationReadRepository),
      { prefix: '/notifications' },
    )

    // Register write routes
    await fastify.register(
      createConversationWriteRouter(conversationWriteRepository),
      { prefix: '/conversations' },
    )

    await fastify.register(
      createMessageWriteRouter(
        messageWriteRepository,
        conversationWriteRepository,
        notificationOrchestrator,
      ),
      { prefix: '/conversations' },
    )

    await fastify.register(
      createNotificationWriteRouter(notificationWriteRepository),
      { prefix: '/notifications' },
    )
  }
}
