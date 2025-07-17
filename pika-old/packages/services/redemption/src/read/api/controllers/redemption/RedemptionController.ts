import type { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { RedemptionMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type {
  GetFraudLogsHandler,
  GetRedemptionByIdHandler,
  GetRedemptionsByCustomerHandler,
  GetRedemptionsByProviderHandler,
} from '@redemption-read/application/use_cases/queries/index.js'
import { RedemptionDomainAdapter } from '@redemption-read/infrastructure/mappers/RedemptionDomainAdapter.js'
import type { FastifyRequest } from 'fastify'

/**
 * Controller for redemption read operations
 */
export class RedemptionController {
  constructor(
    private readonly getRedemptionByIdHandler: GetRedemptionByIdHandler,
    private readonly getRedemptionsByProviderHandler: GetRedemptionsByProviderHandler,
    private readonly getRedemptionsByCustomerHandler: GetRedemptionsByCustomerHandler,
    private readonly getFraudLogsHandler: GetFraudLogsHandler,
  ) {
    this.getRedemptionById = this.getRedemptionById.bind(this)
    this.getRedemptionsByProvider = this.getRedemptionsByProvider.bind(this)
    this.getRedemptionsByCustomer = this.getRedemptionsByCustomer.bind(this)
    this.getAllRedemptions = this.getAllRedemptions.bind(this)
    this.getFraudLogs = this.getFraudLogs.bind(this)
  }

  /**
   * Get redemption by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'redemption',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getRedemptionById(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
  ) {
    try {
      const { id } = request.params

      logger.debug('Getting redemption by ID', { id })

      const redemption = await this.getRedemptionByIdHandler.execute(id)

      if (!redemption) {
        throw ErrorFactory.resourceNotFound('Redemption', id, {
          source: 'RedemptionController.getRedemptionById',
        })
      }

      return RedemptionDomainAdapter.toDTO(redemption)
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_redemption_by_id',
          'Failed to fetch redemption from database',
          error,
          {
            correlationId: request.id,
            source: 'RedemptionController.getRedemptionById',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemptions by provider
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'redemptions:provider',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getRedemptionsByProvider(
    request: FastifyRequest<{
      Params: { providerId: string }
      Querystring: schemas.RedemptionSearchParams
    }>,
  ) {
    try {
      const { providerId } = request.params
      const queryParams = request.query
      const context = RequestContext.fromHeaders(request)

      // Providers can only see their own redemptions unless admin
      if (!RequestContext.isAdmin(context) && context.userId !== providerId) {
        throw ErrorFactory.businessRuleViolation(
          'ACCESS_DENIED',
          'You can only view redemptions for your own business',
          {
            source: 'RedemptionController.getRedemptionsByProvider',
          },
        )
      }

      logger.debug('Getting redemptions by provider', {
        providerId,
        queryParams,
      })

      const result = await this.getRedemptionsByProviderHandler.execute(
        providerId,
        {
          ...queryParams,
          fromDate: queryParams.from_date
            ? new Date(queryParams.from_date)
            : undefined,
          toDate: queryParams.to_date
            ? new Date(queryParams.to_date)
            : undefined,
          voucherId: queryParams.voucher_id,
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        },
      )

      return {
        data: result.data.map((r: any) => RedemptionDomainAdapter.toDTO(r)),
        pagination: result.pagination,
      }
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_redemptions_by_provider',
          'Failed to fetch redemptions from database',
          error,
          {
            correlationId: request.id,
            source: 'RedemptionController.getRedemptionsByProvider',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemptions by customer
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'redemptions:customer',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getRedemptionsByCustomer(
    request: FastifyRequest<{
      Params: { customerId: string }
      Querystring: schemas.RedemptionSearchParams
    }>,
  ) {
    try {
      const { customerId } = request.params
      const queryParams = request.query
      const context = RequestContext.fromHeaders(request)

      // Customers can only see their own redemptions unless admin
      if (!RequestContext.isAdmin(context) && context.userId !== customerId) {
        throw ErrorFactory.businessRuleViolation(
          'ACCESS_DENIED',
          'You can only view your own redemptions',
          {
            source: 'RedemptionController.getRedemptionsByCustomer',
          },
        )
      }

      logger.debug('Getting redemptions by customer', {
        customerId,
        queryParams,
      })

      const result = await this.getRedemptionsByCustomerHandler.execute(
        customerId,
        {
          ...queryParams,
          fromDate: queryParams.from_date
            ? new Date(queryParams.from_date)
            : undefined,
          toDate: queryParams.to_date
            ? new Date(queryParams.to_date)
            : undefined,
          providerId: queryParams.provider_id,
          page: queryParams.page || 1,
          limit: queryParams.limit || 20,
        },
      )

      return {
        data: result.data.map((r: any) => RedemptionDomainAdapter.toDTO(r)),
        pagination: result.pagination,
      }
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_redemptions_by_customer',
          'Failed to fetch redemptions from database',
          error,
          {
            correlationId: request.id,
            source: 'RedemptionController.getRedemptionsByCustomer',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get all redemptions (admin only)
   */
  async getAllRedemptions(
    request: FastifyRequest<{
      Querystring: schemas.RedemptionSearchParams
    }>,
  ) {
    try {
      // This endpoint is admin only, enforced by route preHandler
      const queryParams = request.query

      logger.debug('Getting all redemptions', { queryParams })

      const repository = (this.getRedemptionsByProviderHandler as any)
        .repository
      const result = await repository.getAllRedemptions({
        ...queryParams,
        fromDate: queryParams.from_date
          ? new Date(queryParams.from_date)
          : undefined,
        toDate: queryParams.to_date ? new Date(queryParams.to_date) : undefined,
        voucherId: queryParams.voucher_id,
        providerId: queryParams.provider_id,
        customerId: queryParams.customer_id,
        offlineRedemption: queryParams.offline_only,
        page: queryParams.page || 1,
        limit: queryParams.limit || 20,
      })

      return {
        data: result.data.map((r: any) => RedemptionDomainAdapter.toDTO(r)),
        pagination: result.pagination,
      }
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_redemptions',
          'Failed to fetch redemptions from database',
          error,
          {
            correlationId: request.id,
            source: 'RedemptionController.getAllRedemptions',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get fraud logs for dashboard display
   */
  async getFraudLogs(
    request: FastifyRequest<{
      Querystring: { type: 'customer' | 'provider' | 'admin'; id?: string }
    }>,
  ) {
    try {
      const { type, id } = request.query
      const context = RequestContext.fromHeaders(request)

      // Authorization checks
      if (type === 'admin' && !RequestContext.isAdmin(context)) {
        throw ErrorFactory.businessRuleViolation(
          'ACCESS_DENIED',
          'Admin access required to view admin fraud logs',
          {
            source: 'RedemptionController.getFraudLogs',
          },
        )
      }

      // Provider access validation should be done in the use case layer
      // to maintain clean architecture separation

      if (type === 'customer' && id) {
        if (!RequestContext.isAdmin(context) && context.userId !== id) {
          throw ErrorFactory.businessRuleViolation(
            'ACCESS_DENIED',
            'You can only view your own fraud logs',
            {
              source: 'RedemptionController.getFraudLogs',
            },
          )
        }
      }

      logger.debug('Getting fraud logs', { type, id, userId: context.userId })

      const logs = await this.getFraudLogsHandler.execute({ type, id })

      return RedemptionMapper.toFraudLogsDTO(logs)
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_fraud_logs',
          'Failed to fetch fraud logs from database',
          error,
          {
            correlationId: request.id,
            source: 'RedemptionController.getFraudLogs',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }
}
