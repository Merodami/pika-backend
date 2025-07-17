import { adaptCampaignSearchQuery } from '@campaign-read/application/adapters/sortingAdapter.js'
import {
  GetAllCampaignsHandler,
  GetCampaignByIdHandler,
} from '@campaign-read/application/use_cases/queries/index.js'
import { CampaignDomainAdapter } from '@campaign-read/infrastructure/mappers/CampaignDomainAdapter.js'
import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { campaignLocalizationConfig } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  processMultilingualContent,
} from '@pika/shared'
import type { FastifyRequest } from 'fastify'

/**
 * Controller handling HTTP requests for campaign read operations
 * Implements proper caching for performance
 */
export class CampaignController {
  constructor(
    private readonly getAllCampaignsHandler: GetAllCampaignsHandler,
    private readonly getCampaignByIdHandler: GetCampaignByIdHandler,
  ) {
    this.getAllCampaigns = this.getAllCampaigns.bind(this)
    this.getCampaignById = this.getCampaignById.bind(this)
  }

  /**
   * GET /campaigns
   * Get all campaigns with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'campaigns',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllCampaigns(
    request: FastifyRequest<{
      Querystring: schemas.CampaignSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.CampaignSearchQuery

      // Use the adapter to convert API query to domain model format
      // This properly handles type conversions for sort parameters
      const searchParams = adaptCampaignSearchQuery(query)

      const result = await this.getAllCampaignsHandler.execute(searchParams)

      // Convert domain models to API DTOs using adapter
      const dtoResult = {
        data: result.data.map((campaign) =>
          CampaignDomainAdapter.toDTO(campaign),
        ),
        pagination: result.pagination,
      }

      // Get the preferred language from the request.language property
      // This is set by the languageNegotiation plugin
      const preferredLanguage = getPreferredLanguage(request)

      // Use the reusable multilingual content processor
      // It handles both 'all' and specific language cases
      return processMultilingualContent(
        dtoResult,
        {
          multilingualFields: [],
          recursiveFields: [
            {
              field: 'data',
              config: campaignLocalizationConfig,
            },
          ],
        },
        preferredLanguage,
      )
    } catch (error) {
      // Transform the error using our new error system
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'CampaignController.getAllCampaigns',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_campaigns',
          'Failed to fetch campaigns from database',
          error,
          {
            correlationId: request.id,
            source: 'CampaignController.getAllCampaigns',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      // Re-throw already formatted errors
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /campaigns/:campaign_id
   * Get a single campaign by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'campaigns',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCampaignById(
    request: FastifyRequest<{
      Params: schemas.CampaignId
    }>,
  ) {
    try {
      const { campaign_id } = request.params

      const campaign = await this.getCampaignByIdHandler.execute({
        id: campaign_id,
      })

      if (!campaign) {
        throw ErrorFactory.resourceNotFound('Campaign', campaign_id, {
          correlationId: request.id,
          source: 'CampaignController.getCampaignById',
          suggestion:
            'Check that the campaign ID exists and is in the correct format',
          metadata: { requestParams: request.params },
        })
      }

      const dto = CampaignDomainAdapter.toDTO(campaign)
      const preferredLanguage = getPreferredLanguage(request)

      return processMultilingualContent(
        dto,
        campaignLocalizationConfig,
        preferredLanguage,
      )
    } catch (error) {
      // If it's already a BaseError from our system, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle not found cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'Campaign',
          request.params.campaign_id,
          {
            correlationId: request.id,
            source: 'CampaignController.getCampaignById',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_campaign_by_id',
          'Failed to fetch campaign from database',
          error,
          {
            correlationId: request.id,
            source: 'CampaignController.getCampaignById',
            metadata: { campaignId: request.params.campaign_id },
          },
        )
      }

      // Re-throw already formatted errors
      throw ErrorFactory.fromError(error)
    }
  }
}
