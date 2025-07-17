// Import the necessary dependencies
import { NOTIFICATION_SERVER_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { FirebaseAdminClient, logger } from '@pika/shared'

// Import the server creation function
import { createNotificationServer } from './server.js'

/**
 * Initialize the Firebase connection
 */
export async function initializeFirebase() {
  try {
    const firebase = FirebaseAdminClient.getInstance()

    // Test the connection
    await firebase.firestore.collection('_health').doc('check').get()
    logger.info('Successfully connected to Firebase')

    return firebase
  } catch (error) {
    logger.error('Failed to connect to Firebase:', error)
    throw error
  }
}

/**
 * Initialize and start the unified Notification service
 * This combines both read and write capabilities
 */
export async function startNotificationService(options?: {
  repositories?: {
    read?: any
    write?: any
  }
}) {
  // Connect to services
  const firebase = await initializeFirebase()

  logger.info(
    `Unified Notification service starting on port: ${NOTIFICATION_SERVER_PORT}`,
  )

  // Create Fastify server using the extracted function
  const app = await createNotificationServer({
    firebase,
    repositories: options?.repositories,
  })

  // Start the server
  await startServer(app, NOTIFICATION_SERVER_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified Notification service...')

      // Firebase cleanup is handled by the singleton

      logger.info('Notification service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error(
        'Unhandled Promise Rejection in Notification service:',
        reason,
      )
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startNotificationService()
    .then(() => {
      logger.info('Unified Notification Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Notification Service:', error)
      process.exit(1)
    })
}

// Export for use in index.ts
export async function createApp() {
  const firebase = await initializeFirebase()

  return createNotificationServer({ firebase })
}
