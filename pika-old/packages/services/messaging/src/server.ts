// Load environment variables first
import '@pika/environment'

// Import routes
import {
  MESSAGING_SERVER_PORT,
  MESSAGING_SERVICE_NAME,
  NODE_ENV,
  NOTIFICATION_API_URL,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FirebaseAdminClient, logger } from '@pika/shared'

import { createConversationReadRouter } from './read/api/routes/ConversationRouter.js'
import { createMessageReadRouter } from './read/api/routes/MessageRouter.js'
// Import repositories
import { FirebaseConversationReadRepository } from './read/infrastructure/firebase/FirebaseConversationReadRepository.js'
import { FirebaseMessageReadRepository } from './read/infrastructure/firebase/FirebaseMessageReadRepository.js'
import { createConversationWriteRouter } from './write/api/routes/ConversationRouter.js'
import { createMessageWriteRouter } from './write/api/routes/MessageRouter.js'
import { FirebaseConversationRepository } from './write/infrastructure/firebase/FirebaseConversationRepository.js'
import { FirebaseMessageRepository } from './write/infrastructure/firebase/FirebaseMessageRepository.js'
import { NotificationClient } from './write/infrastructure/notifications/NotificationClient.js'

/**
 * Create and configure the Fastify server for the Messaging service
 */
export async function createMessagingServer({
  cacheService,
  repositories = {},
}: {
  cacheService: ICacheService
  repositories?: {
    conversationWrite?: FirebaseConversationRepository
    messageWrite?: FirebaseMessageRepository
    conversationRead?: FirebaseConversationReadRepository
    messageRead?: FirebaseMessageReadRepository
    notificationAdapter?: NotificationClient
  }
}) {
  logger.info(
    `Configuring Unified Messaging service for port: ${MESSAGING_SERVER_PORT}`,
  )

  // Create repositories (or use provided ones)
  const conversationReadRepository =
    repositories.conversationRead || new FirebaseConversationReadRepository()
  const messageReadRepository =
    repositories.messageRead || new FirebaseMessageReadRepository()
  const conversationWriteRepository =
    repositories.conversationWrite || new FirebaseConversationRepository()
  const messageWriteRepository =
    repositories.messageWrite || new FirebaseMessageRepository()
  const notificationAdapter =
    repositories.notificationAdapter ||
    new NotificationClient(NOTIFICATION_API_URL)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: MESSAGING_SERVICE_NAME,
    port: MESSAGING_SERVER_PORT,
    cacheService,
    healthChecks: [
      {
        name: 'firebase',
        check: async () => {
          try {
            const admin = FirebaseAdminClient.getInstance()
            const db = admin.firestore

            await db.collection('_health').limit(1).get()

            return true
          } catch {
            return false
          }
        },
      },
    ],
  })

  // Error handling is set up by the HTTP package via fastifyErrorMiddleware
  // No need to override it here

  // Register both read and write routers with the same prefix
  app.register(createConversationReadRouter(conversationReadRepository), {
    prefix: '/conversations',
  })

  app.register(
    createMessageReadRouter(conversationReadRepository, messageReadRepository),
    {
      prefix: '/conversations',
    },
  )

  app.register(createConversationWriteRouter(conversationWriteRepository), {
    prefix: '/conversations',
  })

  app.register(
    createMessageWriteRouter(
      conversationWriteRepository,
      messageWriteRepository,
      notificationAdapter,
    ),
    { prefix: '/conversations' },
  )

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    if (NODE_ENV === 'development') {
      logger.debug(
        `${MESSAGING_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }
    done()
  })

  return app
}
