import { requireServiceAuth } from '@pika/http'
import { logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { UserReadRepositoryPort } from '../../domain/port/user/UserReadRepositoryPort.js'

/**
 * Internal API routes for service-to-service communication
 * These routes are protected by service authentication middleware
 * Following industry standard patterns for microservice communication
 */
export function createInternalRouter(
  userRepository: UserReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Apply service authentication to all internal routes
    // This follows the existing pattern in the codebase
    fastify.addHook('preHandler', requireServiceAuth())

    // Internal endpoint to get provider (retailer) by user ID
    // Used by other services to lookup provider information
    fastify.get<{
      Params: { user_id: string }
    }>(
      '/users/:user_id/provider',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              user_id: { type: 'string', format: 'uuid' },
            },
            required: ['user_id'],
          },
        },
      },
      async (
        request: FastifyRequest<{
          Params: { user_id: string }
        }>,
        reply,
      ) => {
        try {
          const { user_id } = request.params

          logger.debug('Internal service request for provider lookup', {
            userId: user_id,
            serviceName: (request as any).serviceAuth?.serviceName,
            serviceId: (request as any).serviceAuth?.serviceId,
          })

          const user = await userRepository.getUserById({
            id: user_id,
            includeProviderProfile: true,
          })

          if (user?.isProvider()) {
            // For now, return a 404 since we don't have provider data in the user entity
            // This endpoint should likely be moved to the provider service
            reply.code(404).send({
              error: 'Provider endpoint not implemented',
              message:
                'Provider profile lookup should be done through provider service',
            })
          } else {
            reply.code(404).send({
              error: 'Provider not found',
              message: 'User does not have a service provider profile',
            })
          }
        } catch (error) {
          logger.error('Error in internal provider lookup:', error)

          reply.code(404).send({
            error: 'Provider not found',
            message: 'User does not have a service provider profile',
          })
        }
      },
    )

    // Health check endpoint for internal monitoring
    fastify.get('/health', async (request, reply) => {
      reply.code(200).send({
        status: 'healthy',
        service: 'user-internal',
        timestamp: new Date().toISOString(),
      })
    })
  }
}
