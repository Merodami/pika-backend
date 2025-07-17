import { requireServiceAuth } from '@pika/http'
import { logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { GetProviderByUserIdHandler } from '../../application/use_cases/queries/index.js'
import { ProviderReadRepositoryPort } from '../../domain/port/provider/ProviderReadRepositoryPort.js'

/**
 * Internal API routes for service-to-service communication
 * These routes are protected by service authentication middleware
 * Following industry standard patterns for microservice communication
 */
export function createInternalRouter(
  providerRepository: ProviderReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Apply service authentication to all internal routes
    // This follows the existing pattern in the codebase
    fastify.addHook('preHandler', requireServiceAuth())

    // Internal endpoint to get provider by user ID
    // Used by other services (like service module) to lookup provider information
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
        const { user_id } = request.params

        try {
          logger.debug('Internal service request for provider lookup', {
            userId: user_id,
            serviceName: (request as any).serviceAuth?.serviceName,
            serviceId: (request as any).serviceAuth?.serviceId,
          })

          // Use existing handler to get provider by user ID
          const getProviderByUserIdHandler = new GetProviderByUserIdHandler(
            providerRepository,
          )

          const provider = await getProviderByUserIdHandler.execute(user_id)

          if (provider) {
            // Return the provider domain object as-is
            // The ProviderDomain type matches what the ProviderServiceClient expects
            const response = {
              id: provider.getId,
              userId: provider.getUserId,
              businessName: provider.getBusinessName,
              businessDescription: provider.getBusinessDescription,
              categoryId: provider.getCategoryId,
              verified: provider.getVerified,
              active: provider.getActive,
              avgRating: provider.getAvgRating,
              createdAt: provider.getCreatedAt,
              updatedAt: provider.getUpdatedAt,
            }

            reply.code(200).send(response)
          } else {
            reply.code(404).send({
              error: 'Provider not found',
              message: 'User does not have a service provider profile',
            })
          }
        } catch (error: any) {
          logger.error('Error in internal provider lookup:', {
            error: error.message,
            stack: error.stack,
            userId: user_id,
          })

          // If it's already a BaseError with proper status, use it
          if (error.statusCode) {
            reply.code(error.statusCode).send({
              error: error.message,
              code: error.code,
            })

            return
          }

          // Default to 500 for unexpected errors
          reply.code(500).send({
            error: 'Internal server error',
            message: 'Failed to retrieve provider information',
          })
        }
      },
    )

    // Health check endpoint for internal monitoring
    fastify.get('/health', async (request, reply) => {
      reply.code(200).send({
        status: 'healthy',
        service: 'provider-internal',
        timestamp: new Date().toISOString(),
      })
    })
  }
}
