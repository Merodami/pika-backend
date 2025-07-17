import { logger } from '@pika/shared'

import { startAdminService } from './app.js'

// Export the unified service startup function
export { startAdminService }

// Bootstrap the Admin service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startAdminService()
    .then(() => {
      logger.info('Admin Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Admin Service:', error)
      process.exit(1)
    })
}
