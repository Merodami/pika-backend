import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { ProviderController } from '@provider-read/api/controllers/provider/index.js'
import {
  GetAllProvidersHandler,
  GetProviderByIdHandler,
  GetProviderByUserIdHandler,
} from '@provider-read/application/use_cases/queries/index.js'
import { ProviderReadRepositoryPort } from '@provider-read/domain/port/provider/ProviderReadRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for provider read endpoints
 *
 * @param providerRepository - Repository for provider data access
 * @returns Fastify plugin for provider routes
 */
export function createProviderReadRouter(
  providerRepository: ProviderReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllProvidersHandler = new GetAllProvidersHandler(
      providerRepository,
    )
    const getProviderByIdHandler = new GetProviderByIdHandler(
      providerRepository,
    )
    const getProviderByUserIdHandler = new GetProviderByUserIdHandler(
      providerRepository,
    )

    // Initialize controller with the handlers
    const providerController = new ProviderController(
      getAllProvidersHandler,
      getProviderByIdHandler,
      getProviderByUserIdHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all providers with filtering and pagination
    fastify.get<{
      Querystring: schemas.ProviderSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.ProviderSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.ProviderSearchQuery
        }>,
        reply,
      ) => {
        const result = await providerController.getAllProviders(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving provider by user ID from headers
    fastify.get(
      '/user',
      {
        schema: {
          response: {
            200: schemas.ProviderProfileSchema,
          },
        },
      },
      async (request: FastifyRequest, reply) => {
        const result = await providerController.getProviderByUserId(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific provider by ID
    fastify.get<{
      Params: schemas.ProviderId
      Querystring: schemas.ProviderGetQuery
    }>(
      '/:provider_id',
      {
        schema: {
          params: schemas.ProviderIdSchema,
          querystring: schemas.ProviderGetQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.ProviderId
          Querystring: schemas.ProviderGetQuery
        }>,
        reply,
      ) => {
        const result = await providerController.getProviderById(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )
  }
}
