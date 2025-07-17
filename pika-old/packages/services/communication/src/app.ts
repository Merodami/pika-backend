import { createCommunicationRoutes } from '@communication/routes/index.js'
import { COMMUNICATION_SERVER_PORT } from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { logger } from '@pika/shared'
import { FastifyInstance } from 'fastify'

export async function startCommunicationService(): Promise<FastifyInstance> {
  const app = await createFastifyServer({
    serviceName: 'communication',
    port: COMMUNICATION_SERVER_PORT,
    healthChecks: [],
  })

  // Register routes
  await app.register(createCommunicationRoutes())

  // Start the server
  try {
    await app.listen({
      port: COMMUNICATION_SERVER_PORT,
      host: '0.0.0.0',
    })

    logger.info(
      `Communication service listening on 0.0.0.0:${COMMUNICATION_SERVER_PORT}`,
    )
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  return app
}

// Start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startCommunicationService().catch((error) => {
    logger.error('Failed to start communication service:', error)
    process.exit(1)
  })
}
