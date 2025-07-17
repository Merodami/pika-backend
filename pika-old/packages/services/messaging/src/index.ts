import { logger } from '@pika/shared'

import { startMessagingService } from './app.js'

// Export the unified service startup function
export { startMessagingService }

// Bootstrap the Messaging service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startMessagingService()
    .then(() => {
      logger.info('Messaging Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Messaging Service:', error)
      process.exit(1)
    })
}
