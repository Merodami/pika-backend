import { keyManager } from '@pika/crypto'
import { AUTH_SERVICE_PORT, IS_EMBEDDED } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  logger,
  UserServiceClient,
} from '@pika/shared'

import { createAuthServer } from './server.js'

export async function startService(): Promise<void> {
  let cacheService: ICacheService | undefined
  let userServiceClient: UserServiceClient | undefined
  let communicationClient: CommunicationServiceClient | undefined
  let businessServiceClient: BusinessServiceClient | undefined

  try {
    // Initialize KeyManager first (required for JWT operations)
    // In embedded mode (Vercel), KeyManager is initialized by deployment adapter
    if (!IS_EMBEDDED) {
      if (!keyManager.isInitialized()) {
        await keyManager.initialize()
        logger.info('KeyManager initialized successfully')
      }
    } else {
      logger.info(
        'Running in embedded mode, KeyManager should be initialized by deployment adapter',
      )
    }

    // Initialize dependencies
    cacheService = await initializeCache()

    // Initialize service clients
    userServiceClient = new UserServiceClient()
    communicationClient = new CommunicationServiceClient()
    businessServiceClient = new BusinessServiceClient()

    const app = await createAuthServer({
      port: AUTH_SERVICE_PORT,
      cacheService,
      userServiceClient,
      communicationClient,
      businessServiceClient,
    })

    // Start the server
    await startServer(app, AUTH_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Auth service...')
        await cacheService?.disconnect()
        logger.info('Auth service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Auth service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start auth service', error)

    // Cleanup on startup failure
    await cacheService?.disconnect()

    throw error
  }
}
