import fastifyMultipart from '@fastify/multipart'
import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { FileStoragePort, logger } from '@pika/shared'
import { ProviderController } from '@provider-write/api/controllers/provider/ProviderController.js'
import { CreateProviderCommandHandler } from '@provider-write/application/use_cases/commands/CreateProviderCommandHandler.js'
import { DeleteProviderCommandHandler } from '@provider-write/application/use_cases/commands/DeleteProviderCommandHandler.js'
import { UpdateProviderCommandHandler } from '@provider-write/application/use_cases/commands/UpdateProviderCommandHandler.js'
import { ProviderWriteRepositoryPort } from '@provider-write/domain/port/provider/ProviderWriteRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for provider write endpoints
 *
 * @param providerRepository - Repository for provider write operations
 * @param fileStorage - Storage service for handling file uploads
 * @returns Fastify plugin for provider write routes
 */
export function createProviderWriteRouter(
  providerRepository: ProviderWriteRepositoryPort,
  fileStorage: FileStoragePort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Check if multipart is already registered to avoid duplicate registration
    if (!fastify.hasContentTypeParser('multipart/form-data')) {
      // Register multipart plugin for file uploads
      fastify.register(fastifyMultipart, {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 1, // Maximum one file per request
          fields: 10, // Maximum fields in the request
        },
      })

      logger.info('Registered multipart handler for file uploads')
    } else {
      logger.info('Multipart handler already registered')
    }

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize use case handlers
    const createHandler = new CreateProviderCommandHandler(providerRepository)
    const updateHandler = new UpdateProviderCommandHandler(providerRepository)
    const deleteHandler = new DeleteProviderCommandHandler(providerRepository)

    // Initialize controller with the handlers and file storage
    const providerController = new ProviderController(
      createHandler,
      updateHandler,
      deleteHandler,
      fileStorage,
    )

    // Route for creating a provider
    fastify.post<{
      Body: schemas.ProviderProfileCreate
    }>(
      '/',
      {
        schema: {
          body: schemas.ProviderProfileCreateSchema,
        },
      },
      async (request, reply) => {
        await providerController.createProvider(request, reply)
      },
    )

    // Route for updating a provider
    fastify.patch<{
      Params: { provider_id: string }
      Body: schemas.ProviderProfileUpdate
    }>(
      '/:provider_id',
      {
        schema: {
          params: schemas.ProviderIdSchema,
          body: schemas.ProviderProfileUpdateSchema,
        },
      },
      async (request, reply) => {
        await providerController.updateProvider(request, reply)
      },
    )

    // Route for deleting a provider
    fastify.delete<{
      Params: { provider_id: string }
    }>(
      '/:provider_id',
      {
        schema: {
          params: schemas.ProviderIdSchema,
        },
      },
      async (request, reply) => {
        await providerController.deleteProvider(request, reply)
      },
    )
  }
}
