import { CampaignController } from '@campaign-read/api/controllers/campaign/index.js'
import {
  GetAllCampaignsHandler,
  GetCampaignByIdHandler,
} from '@campaign-read/application/use_cases/queries/index.js'
import { CampaignReadRepositoryPort } from '@campaign-read/domain/port/campaign/CampaignReadRepositoryPort.js'
import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for campaign read endpoints
 *
 * @param campaignRepository - Repository for campaign data access
 * @returns Fastify plugin for campaign routes
 */
export function createCampaignReadRouter(
  campaignRepository: CampaignReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllCampaignsHandler = new GetAllCampaignsHandler(
      campaignRepository,
    )
    const getCampaignByIdHandler = new GetCampaignByIdHandler(
      campaignRepository,
    )

    // Initialize controller with the handlers
    const campaignController = new CampaignController(
      getAllCampaignsHandler,
      getCampaignByIdHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all campaigns with filtering and pagination
    fastify.get<{
      Querystring: schemas.CampaignSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.CampaignSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.CampaignSearchQuery
        }>,
        reply,
      ) => {
        const result = await campaignController.getAllCampaigns(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific campaign by ID
    fastify.get<{
      Params: schemas.CampaignId
    }>(
      '/:campaign_id',
      {
        schema: {
          params: schemas.CampaignIdSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.CampaignId
        }>,
        reply,
      ) => {
        const result = await campaignController.getCampaignById(request)

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
