import { logger } from '@pika/shared'

import { startProviderService } from './app.js'

// Export the unified service startup function
export { startProviderService }

// Bootstrap the Provider service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startProviderService()
    .then(() => {
      logger.info('Provider Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Provider Service:', error)
      process.exit(1)
    })
}
