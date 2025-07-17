import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { voucherLocalizationConfig } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  processMultilingualContent,
} from '@pika/shared'
import { adaptVoucherSearchQuery } from '@voucher-read/application/adapters/sortingAdapter.js'
import {
  GetAllVouchersHandler,
  GetVoucherByIdHandler,
  GetVouchersByIdsHandler,
  GetVouchersByProviderIdHandler,
  GetVouchersByUserIdHandler,
} from '@voucher-read/application/use_cases/queries/index.js'
import { VoucherDomainAdapter } from '@voucher-read/infrastructure/mappers/VoucherDomainAdapter.js'
import type { FastifyRequest } from 'fastify'
import { get } from 'lodash-es'

/**
 * Controller handling HTTP requests for voucher read operations
 * Implements proper caching for performance
 */
export class VoucherController {
  constructor(
    private readonly getAllVouchersHandler: GetAllVouchersHandler,
    private readonly getVoucherByIdHandler: GetVoucherByIdHandler,
    private readonly getVouchersByProviderIdHandler: GetVouchersByProviderIdHandler,
    private readonly getVouchersByUserIdHandler: GetVouchersByUserIdHandler,
    private readonly getVouchersByIdsHandler?: GetVouchersByIdsHandler,
  ) {
    this.getAllVouchers = this.getAllVouchers.bind(this)
    this.getVoucherById = this.getVoucherById.bind(this)
    this.getVouchersByProviderId = this.getVouchersByProviderId.bind(this)
    this.getVouchersByUserId = this.getVouchersByUserId.bind(this)
    this.getVouchersByIds = this.getVouchersByIds.bind(this)
  }

  /**
   * GET /vouchers
   * Get all vouchers with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVouchers(
    request: FastifyRequest<{
      Querystring: schemas.VoucherSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.VoucherSearchQuery

      // Use the adapter to convert API query to domain model format
      // This properly handles type conversions for sort parameters
      const searchParams = adaptVoucherSearchQuery(query)

      const result = await this.getAllVouchersHandler.execute(searchParams)

      // Convert domain models to API DTOs using adapter pattern
      const dtoResult = {
        data: result.data.map((voucher) => VoucherDomainAdapter.toDTO(voucher)),
        pagination: result.pagination,
      }

      // Get the preferred language from the request.language property
      // This is set by the languageNegotiation plugin
      const preferredLanguage = getPreferredLanguage(request)

      // Use the reusable multilingual content processor
      // For 'all' languages, return full multilingual objects
      // For specific languages, we need to ensure all fields are preserved
      if (preferredLanguage === 'all') {
        return processMultilingualContent(
          dtoResult,
          {
            multilingualFields: [],
            recursiveFields: [
              {
                field: 'data',
                config: voucherLocalizationConfig,
              },
            ],
          },
          preferredLanguage,
        )
      }

      // For specific languages, we need to ensure ALL fields are preserved
      // The standard processMultilingualContent strips non-multilingual fields
      // So we process only the multilingual fields while keeping everything else
      const processedData = dtoResult.data.map((voucher) => {
        const processed = { ...voucher }

        // Only process the known multilingual fields, leave everything else untouched
        if (voucher.title && typeof voucher.title === 'object') {
          const titleValue = get(voucher.title, preferredLanguage)

          processed.title = titleValue
            ? { [preferredLanguage]: titleValue }
            : voucher.title
        }
        if (voucher.description && typeof voucher.description === 'object') {
          const descValue = get(voucher.description, preferredLanguage)

          processed.description = descValue
            ? { [preferredLanguage]: descValue }
            : voucher.description
        }
        if (voucher.terms && typeof voucher.terms === 'object') {
          const termsValue = get(voucher.terms, preferredLanguage)

          processed.terms = termsValue
            ? { [preferredLanguage]: termsValue }
            : voucher.terms
        }

        return processed
      })

      return {
        data: processedData,
        pagination: dtoResult.pagination,
      }
    } catch (error) {
      // Transform the error using our new error system
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'VoucherController.getAllVouchers',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_vouchers',
          'Failed to fetch vouchers from database',
          error,
          {
            correlationId: request.id,
            source: 'VoucherController.getAllVouchers',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /vouchers/:voucherId
   * Get a specific voucher by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'vouchers',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherById(
    request: FastifyRequest<{
      Params: schemas.VoucherId
      Querystring: {
        include_codes?: boolean
      }
    }>,
  ) {
    try {
      const { voucher_id } = request.params
      const { include_codes } = request.query

      const voucher = await this.getVoucherByIdHandler.execute({
        id: voucher_id,
        includeCodes:
          include_codes === undefined ? undefined : Boolean(include_codes),
      })

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucher_id, {
          correlationId: request.id,
          source: 'VoucherController.getVoucherById',
          suggestion:
            'Check that the voucher ID exists and is in the correct format',
          metadata: {
            requestParams: request.params,
            includeCodes: include_codes,
          },
        })
      }

      // Convert to API DTO using adapter pattern
      const dto = VoucherDomainAdapter.toDTO(voucher)

      // Get the preferred language from the Accept-Language header via request.language
      const preferredLanguage = getPreferredLanguage(request)

      // Apply the same multilingual processing fix as getAllVouchers
      if (preferredLanguage === 'all') {
        const localizedDto = processMultilingualContent(
          dto,
          voucherLocalizationConfig,
          preferredLanguage,
        )

        // Ensure codes are preserved if included
        if (voucher.codes && typeof localizedDto === 'object') {
          ;(localizedDto as typeof dto).codes = voucher.codes
        }

        return localizedDto
      }

      // For specific languages, preserve all fields while only transforming multilingual ones
      const processed = { ...dto }

      // Only process the known multilingual fields, leave everything else untouched
      if (dto.title && typeof dto.title === 'object') {
        const titleValue = get(dto.title, preferredLanguage)

        processed.title = titleValue
          ? { [preferredLanguage]: titleValue }
          : dto.title
      }
      if (dto.description && typeof dto.description === 'object') {
        const descValue = get(dto.description, preferredLanguage)

        processed.description = descValue
          ? { [preferredLanguage]: descValue }
          : dto.description
      }
      if (dto.terms && typeof dto.terms === 'object') {
        const termsValue = get(dto.terms, preferredLanguage)

        processed.terms = termsValue
          ? { [preferredLanguage]: termsValue }
          : dto.terms
      }

      // Ensure codes are preserved if included
      if (voucher.codes) {
        processed.codes = voucher.codes
      }

      return processed
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          request.params.voucher_id,
          {
            correlationId: request.id,
            source: 'VoucherController.getVoucherById',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_voucher_by_id',
          'Failed to fetch voucher from database',
          error,
          {
            correlationId: request.id,
            source: 'VoucherController.getVoucherById',
            metadata: { voucherId: request.params.voucher_id },
          },
        )
      }

      // For any other unexpected errors
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /vouchers/provider/:providerId
   * Get all vouchers for a specific provider
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:provider',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getVouchersByProviderId(
    request: FastifyRequest<{
      Params: schemas.ProviderId
      Querystring: schemas.VoucherSearchQuery
    }>,
  ) {
    try {
      const { provider_id } = request.params
      const query = request.query as schemas.VoucherSearchQuery

      const searchParams = adaptVoucherSearchQuery(query)
      const result = await this.getVouchersByProviderIdHandler.execute(
        provider_id,
        searchParams,
      )

      const dtoResult = {
        data: result.data.map((voucher) => VoucherDomainAdapter.toDTO(voucher)),
        pagination: result.pagination,
      }

      const preferredLanguage = getPreferredLanguage(request)

      return processMultilingualContent(
        dtoResult,
        {
          multilingualFields: [],
          recursiveFields: [
            {
              field: 'data',
              config: voucherLocalizationConfig,
            },
          ],
        },
        preferredLanguage,
      )
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_vouchers_by_provider',
          'Failed to fetch provider vouchers',
          error,
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByProviderId',
            metadata: { providerId: request.params.provider_id },
          },
        )
      }
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /vouchers/user/:userId
   * Get all vouchers claimed by a specific user
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:user',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getVouchersByUserId(
    request: FastifyRequest<{
      Params: schemas.UserIdParam
      Querystring: schemas.VoucherSearchQuery
    }>,
  ) {
    try {
      const { user_id } = request.params
      const query = request.query as schemas.VoucherSearchQuery

      const searchParams = adaptVoucherSearchQuery(query)
      const result = await this.getVouchersByUserIdHandler.execute(
        user_id,
        searchParams,
      )

      const dtoResult = {
        data: result.data.map((voucher) => VoucherDomainAdapter.toDTO(voucher)),
        pagination: result.pagination,
      }

      const preferredLanguage = getPreferredLanguage(request)

      return processMultilingualContent(
        dtoResult,
        {
          multilingualFields: [],
          recursiveFields: [
            {
              field: 'data',
              config: voucherLocalizationConfig,
            },
          ],
        },
        preferredLanguage,
      )
    } catch (error) {
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_vouchers_by_user',
          'Failed to fetch user vouchers',
          error,
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByUserId',
            metadata: { userId: (request.params as any).user_id },
          },
        )
      }
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * POST /vouchers/batch
   * Get multiple vouchers by their IDs (for service-to-service calls)
   * This endpoint is designed for internal service use only
   */
  async getVouchersByIds(
    request: FastifyRequest<{
      Body: { voucher_ids: string[] }
    }>,
  ) {
    try {
      if (!this.getVouchersByIdsHandler) {
        throw ErrorFactory.notImplemented(
          'Batch voucher endpoint not available',
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByIds',
          },
        )
      }

      const { voucher_ids } = request.body

      if (!voucher_ids || !Array.isArray(voucher_ids)) {
        throw ErrorFactory.validationError(
          {
            voucher_ids: ['voucher_ids must be an array of strings'],
          },
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByIds',
          },
        )
      }

      if (voucher_ids.length > 100) {
        throw ErrorFactory.validationError(
          {
            voucher_ids: ['Cannot request more than 100 vouchers at once'],
          },
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByIds',
          },
        )
      }

      const voucherMap = await this.getVouchersByIdsHandler.execute({
        voucherIds: voucher_ids,
      })

      // Convert Map to object with voucher DTOs
      const result: Record<string, any> = {}

      for (const [id, voucher] of voucherMap) {
        // Use Object.assign to avoid object injection
        Object.assign(result, { [id]: VoucherDomainAdapter.toDTO(voucher) })
      }

      const preferredLanguage = getPreferredLanguage(request)

      // Process multilingual content for each voucher
      const processedResult: Record<string, any> = {}

      for (const [id, dto] of Object.entries(result)) {
        // Use Object.assign to avoid object injection
        Object.assign(processedResult, {
          [id]: processMultilingualContent(
            dto,
            voucherLocalizationConfig,
            preferredLanguage,
          ),
        })
      }

      return processedResult
    } catch (error) {
      if (error.context && error.context.domain) {
        throw error
      }

      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_vouchers_batch',
          'Failed to fetch vouchers batch',
          error,
          {
            correlationId: request.id,
            source: 'VoucherController.getVouchersByIds',
          },
        )
      }
      throw ErrorFactory.fromError(error)
    }
  }
}
