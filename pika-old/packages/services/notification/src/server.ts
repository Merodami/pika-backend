// Load environment variables first
import '@pika/environment'

// Import the routers from both read and write services
import { createNotificationReadRouter } from '@notification-read/api/routes/NotificationRouter.js'
// Import the repositories from both read and write services
import { FirebaseNotificationReadRepository } from '@notification-read/infrastructure/index.js'
import { createNotificationWriteRouter } from '@notification-write/api/routes/NotificationRouter.js'
import { FirebaseNotificationAdapter } from '@notification-write/infrastructure/index.js'
import {
  NODE_ENV,
  NOTIFICATION_SERVER_PORT,
  NOTIFICATION_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { FirebaseAdminClient, logger } from '@pika/shared'

/**
 * Create and configure the Fastify server for the Notification service
 * This is separate from the server startup to make testing easier
 */
export async function createNotificationServer({
  firebase,
  repositories = {},
}: {
  firebase?: FirebaseAdminClient
  repositories?: {
    read?: FirebaseNotificationReadRepository
    write?: FirebaseNotificationAdapter
  }
} = {}) {
  logger.info(
    `Configuring Unified Notification service for port: ${NOTIFICATION_SERVER_PORT}`,
  )

  // Initialize Firebase (or use provided instance)
  const firebaseClient = firebase || FirebaseAdminClient.getInstance()

  // Create repositories (or use provided ones)
  const notificationReadRepository =
    repositories.read ||
    new FirebaseNotificationReadRepository(firebaseClient.firestore)
  const notificationWriteAdapter =
    repositories.write ||
    new FirebaseNotificationAdapter(
      firebaseClient.firestore,
      firebaseClient.messaging,
    )

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: NOTIFICATION_SERVICE_NAME,
    port: NOTIFICATION_SERVER_PORT,
    // Enable @fastify/accepts for content negotiation via Accept-Language header
    languageOptions: true,
    healthChecks: [
      {
        name: 'firebase',
        check: async () => {
          try {
            // Simple check to ensure Firestore is accessible
            await firebaseClient.firestore
              .collection('_health')
              .doc('check')
              .get()

            return true
          } catch {
            return false
          }
        },
        details: { type: 'Firebase' },
      },
    ],
  })

  // Error handling is set up by the HTTP package via fastifyErrorMiddleware
  // No need to override it here

  // Register both read and write routers with the same prefix
  // The same endpoint path will have different methods registered from each router
  app.register(createNotificationReadRouter(notificationReadRepository), {
    prefix: '/notifications',
  })

  app.register(createNotificationWriteRouter(notificationWriteAdapter), {
    prefix: '/notifications',
  })

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${NOTIFICATION_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
