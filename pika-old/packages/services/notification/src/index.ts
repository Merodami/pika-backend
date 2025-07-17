import { logger } from '@pika/shared'

import { startNotificationService } from './app.js'

// Export the unified service startup function
export { startNotificationService }

// Bootstrap the Notification service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startNotificationService()
    .then(() => {
      logger.info('Notification Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Notification Service:', error)
      process.exit(1)
    })
}
