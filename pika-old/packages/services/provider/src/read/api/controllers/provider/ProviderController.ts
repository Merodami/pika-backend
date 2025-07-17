import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import {
  ErrorFactory,
  ErrorSeverity,
  logger,
  processMultilingualContent,
} from '@pika/shared'
import { adaptProviderSearchQuery } from '@provider-read/application/adapters/sortingAdapter.js'
import {
  GetAllProvidersHandler,
  GetProviderByIdHandler,
  GetProviderByUserIdHandler,
} from '@provider-read/application/use_cases/queries/index.js'
import { ProviderDomainAdapter } from '@provider-read/infrastructure/mappers/ProviderDomainAdapter.js'
import type { FastifyRequest } from 'fastify'

// Provider localization configuration
const providerLocalizationConfig = {
  multilingualFields: ['business_name', 'business_description'],
  recursiveFields: [],
}

/**
 * Controller handling HTTP requests for provider read operations
 * Implements proper caching for performance
 */
export class ProviderController {
  constructor(
    private readonly getAllProvidersHandler: GetAllProvidersHandler,
    private readonly getProviderByIdHandler: GetProviderByIdHandler,
    private readonly getProviderByUserIdHandler: GetProviderByUserIdHandler,
  ) {
    this.getAllProviders = this.getAllProviders.bind(this)
    this.getProviderById = this.getProviderById.bind(this)
    this.getProviderByUserId = this.getProviderByUserId.bind(this)
  }

  /**
   * GET /provider
   * Get all providers with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'providers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllProviders(
    request: FastifyRequest<{
      Querystring: schemas.ProviderSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.ProviderSearchQuery

      // Use the adapter to convert API query to domain model format
      // This properly handles type conversions for sort parameters
      const searchParams = adaptProviderSearchQuery(query)

      const result = await this.getAllProvidersHandler.execute(searchParams)

      // Convert domain models to API DTOs using adapter
      const dtoResult = {
        data: result.data.map((provider) =>
          ProviderDomainAdapter.toDTO(provider),
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
              config: providerLocalizationConfig,
            },
          ],
        },
        preferredLanguage,
      )
    } catch (error: any) {
      logger.error('Error in getAllProviders:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        query: request.query,
      })

      // Transform specific error types for better metrics
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'ProviderController.getAllProviders',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors with proper classification
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_providers',
          'Failed to fetch providers from database',
          error,
          {
            correlationId: request.id,
            source: 'ProviderController.getAllProviders',
            severity: ErrorSeverity.ERROR,
            metadata: { query: request.query },
          },
        )
      }

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * GET /provider/:providerId
   * Get a specific provider by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'providers',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProviderById(
    request: FastifyRequest<{
      Params: schemas.ProviderId
      Querystring: schemas.ProviderGetQuery
    }>,
  ) {
    try {
      const { provider_id } = request.params
      const { include_user } = request.query

      const provider = await this.getProviderByIdHandler.execute({
        id: provider_id,
        includeUser: include_user,
      })

      if (!provider) {
        throw ErrorFactory.resourceNotFound('Provider', provider_id, {
          correlationId: request.id,
          source: 'ProviderController.getProviderById',
          suggestion:
            'Check that the provider ID exists and is in the correct format',
          metadata: {
            requestParams: request.params,
          },
        })
      }

      // Convert to API DTO using adapter
      const dto = ProviderDomainAdapter.toDTO(provider)

      // Get the preferred language from the Accept-Language header via request.language
      const preferredLanguage = getPreferredLanguage(request)

      // Use our reusable multilingual processor for consistent handling
      return processMultilingualContent(
        dto,
        providerLocalizationConfig,
        preferredLanguage,
      )
    } catch (error: any) {
      logger.error('Error in getProviderById:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        providerId: request.params.provider_id,
      })

      // If it's already a properly formatted error, just rethrow
      if (error.context?.domain) {
        throw error
      }

      // Handle specific error cases for metrics
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'Provider',
          request.params.provider_id,
          {
            correlationId: request.id,
            source: 'ProviderController.getProviderById',
            severity: ErrorSeverity.WARNING,
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_provider_by_id',
          'Failed to fetch provider from database',
          error,
          {
            correlationId: request.id,
            source: 'ProviderController.getProviderById',
            severity: ErrorSeverity.ERROR,
            metadata: { providerId: request.params.provider_id },
          },
        )
      }

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * GET /provider/user
   * Get provider by user ID from headers
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'providers',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProviderByUserId(request: FastifyRequest) {
    try {
      const userId = request.headers['x-user-id'] as string

      if (!userId) {
        throw ErrorFactory.unauthorized('User ID not found in headers', {
          correlationId: request.id,
          source: 'ProviderController.getProviderByUserId',
          suggestion: 'Ensure you are authenticated',
        })
      }

      const provider = await this.getProviderByUserIdHandler.execute(userId)

      // Convert to API DTO using adapter
      const dto = ProviderDomainAdapter.toDTO(provider)

      // Get the preferred language from the Accept-Language header via request.language
      const preferredLanguage = getPreferredLanguage(request)

      // Use our reusable multilingual processor for consistent handling
      return processMultilingualContent(
        dto,
        providerLocalizationConfig,
        preferredLanguage,
      )
    } catch (error: any) {
      logger.error('Error in getProviderByUserId:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.headers['x-user-id'],
      })

      // If it's already a properly formatted error, just rethrow
      if (error.context?.domain) {
        throw error
      }

      // Handle specific error cases for metrics
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound('Provider', 'user', {
          correlationId: request.id,
          source: 'ProviderController.getProviderByUserId',
          severity: ErrorSeverity.INFO, // INFO because this is expected for new users
          suggestion:
            'No provider profile found for this user. Create a provider profile first.',
          metadata: {
            userId: request.headers['x-user-id'],
          },
        })
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_provider_by_user_id',
          'Failed to fetch provider from database',
          error,
          {
            correlationId: request.id,
            source: 'ProviderController.getProviderByUserId',
            severity: ErrorSeverity.ERROR,
            metadata: {
              userId: request.headers['x-user-id'],
            },
          },
        )
      }

      // Re-throw for global error handler
      throw error
    }
  }
}
