import { CampaignController } from '@campaign-write/api/controllers/campaign/CampaignController.js'
import { CreateCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/CreateCampaignCommandHandler.js'
import { DeleteCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/DeleteCampaignCommandHandler.js'
import { UpdateCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/UpdateCampaignCommandHandler.js'
import { CampaignWriteRepositoryPort } from '@campaign-write/domain/port/campaign/CampaignWriteRepositoryPort.js'
import fastifyMultipart from '@fastify/multipart'
import { schemas } from '@pika/api'
import { propertyTransformerHook, requirePermissions } from '@pika/http'
import { FileStoragePort, logger, ProviderServiceClient } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for campaign write endpoints
 * Implements proper authentication, authorization, and inter-service communication
 *
 * @param campaignRepository - Repository for campaign data access
 * @param fileStorage - File storage service for campaign assets
 * @param providerService - Provider service client for inter-service communication
 * @returns Fastify plugin for campaign write routes
 */
export function createCampaignWriteRouter(
  campaignRepository: CampaignWriteRepositoryPort,
  fileStorage: FileStoragePort,
  providerService: ProviderServiceClient,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Register multipart support for file uploads (campaign assets, images, etc.)
    if (!fastify.hasContentTypeParser('multipart/form-data')) {
      fastify.register(fastifyMultipart, {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit for campaign assets
          files: 1,
          fields: 10,
        },
      })
      logger.info('Registered multipart handler for campaign file uploads')
    } else {
      logger.info('Multipart handler already registered')
    }

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize command handlers with inter-service communication
    const createHandler = new CreateCampaignCommandHandler(
      campaignRepository,
      providerService, // Provider service for user-to-provider mapping
    )
    const updateHandler = new UpdateCampaignCommandHandler(
      campaignRepository,
      providerService, // Provider service for ownership validation
    )
    const deleteHandler = new DeleteCampaignCommandHandler(
      campaignRepository,
      providerService, // Provider service for ownership validation
    )

    // Initialize controller with the handlers and file storage
    const campaignController = new CampaignController(
      createHandler,
      updateHandler,
      deleteHandler,
      fileStorage,
    )

    /**
     * POST /campaigns
     * Create a new campaign
     *
     * Requires 'campaigns:write' permission (provider role)
     * Uses inter-service communication to resolve userId to providerId
     */
    fastify.post<{
      Body: schemas.CampaignCreate
    }>(
      '/',
      {
        preHandler: requirePermissions('campaigns:write'), // Only providers can create campaigns
        schema: {
          body: schemas.CampaignCreateSchema,
          response: {
            201: schemas.CampaignResponseSchema,
          },
        },
      },
      async (request, reply) => {
        await campaignController.create(request, reply)
      },
    )

    /**
     * PATCH /campaigns/{campaign_id}
     * Update an existing campaign
     *
     * Requires 'campaigns:write' permission (provider role)
     * Validates campaign ownership through inter-service communication
     */
    fastify.patch<{
      Params: { campaign_id: string }
      Body: schemas.CampaignUpdate
    }>(
      '/:campaign_id',
      {
        preHandler: requirePermissions('campaigns:write'), // Only providers can update campaigns
        schema: {
          params: schemas.CampaignIdSchema,
          body: schemas.CampaignUpdateSchema,
          response: {
            200: schemas.CampaignResponseSchema,
          },
        },
      },
      async (request, reply) => {
        await campaignController.update(request, reply)
      },
    )

    /**
     * DELETE /campaigns/{campaign_id}
     * Delete a campaign
     *
     * Requires 'campaigns:write' permission (provider role)
     * Validates campaign ownership and business rules through inter-service communication
     */
    fastify.delete<{
      Params: { campaign_id: string }
    }>(
      '/:campaign_id',
      {
        preHandler: requirePermissions('campaigns:write'), // Only providers can delete campaigns
        schema: {
          params: schemas.CampaignIdSchema,
          response: {
            204: {
              type: 'null',
            },
          },
        },
      },
      async (request, reply) => {
        await campaignController.delete(request, reply)
      },
    )

    // Log successful router registration
    logger.info(
      'Campaign write router registered with inter-service communication',
    )
  }
}
