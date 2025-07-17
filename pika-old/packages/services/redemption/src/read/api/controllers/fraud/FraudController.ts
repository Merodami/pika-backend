import type { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { RedemptionMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type {
  GetFraudCaseByIdHandler,
  GetFraudStatisticsHandler,
  SearchFraudCasesHandler,
} from '@redemption-read/application/use_cases/queries/fraud/index.js'
import type { FastifyRequest } from 'fastify'

/**
 * Controller for fraud case read operations
 */
export class FraudController {
  constructor(
    private readonly getFraudCaseByIdHandler: GetFraudCaseByIdHandler,
    private readonly searchFraudCasesHandler: SearchFraudCasesHandler,
    private readonly getFraudStatisticsHandler: GetFraudStatisticsHandler,
  ) {
    this.getFraudCase = this.getFraudCase.bind(this)
    this.listFraudCases = this.listFraudCases.bind(this)
    this.getFraudStatistics = this.getFraudStatistics.bind(this)
  }

  /**
   * Get fraud case by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'fraud:case',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getFraudCase(
    request: FastifyRequest<{
      Params: { id: string }
    }>,
  ) {
    try {
      const { id } = request.params
      const context = RequestContext.fromHeaders(request)

      logger.debug('Getting fraud case by ID', {
        id,
        userId: context.userId,
        userRole: context.role,
      })

      const fraudCase = await this.getFraudCaseByIdHandler.execute(id)

      if (!fraudCase) {
        throw ErrorFactory.resourceNotFound('FraudCase', id, {
          source: 'FraudController.getFraudCase',
        })
      }

      // Authorization: Providers can only see their own fraud cases unless admin
      if (
        !RequestContext.isAdmin(context) &&
        fraudCase.providerId !== context.userId
      ) {
        throw ErrorFactory.businessRuleViolation(
          'ACCESS_DENIED',
          'You can only view fraud cases for your own business',
          {
            source: 'FraudController.getFraudCase',
          },
        )
      }

      // Use mapper for consistent DTO transformation
      return RedemptionMapper.toFraudCaseDTO(fraudCase)
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_fraud_case',
          'Failed to fetch fraud case from database',
          error,
          {
            correlationId: request.id,
            source: 'FraudController.getFraudCase',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * List fraud cases with filters
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'fraud:cases',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async listFraudCases(
    request: FastifyRequest<{
      Querystring: schemas.FraudCaseSearchParams
    }>,
  ) {
    try {
      const queryParams = request.query
      const context = RequestContext.fromHeaders(request)

      // Provider filtering should be done in the use case layer
      const searchProviderId = queryParams.provider_id

      logger.debug('Searching fraud cases', {
        userId: context.userId,
        providerId: searchProviderId,
        queryParams,
      })

      const result = await this.searchFraudCasesHandler.execute({
        providerId: searchProviderId,
        customerId: queryParams.customer_id,
        status: queryParams.status as any,
        minRiskScore: queryParams.min_risk_score,
        fromDate: queryParams.from_date
          ? new Date(queryParams.from_date)
          : undefined,
        toDate: queryParams.to_date ? new Date(queryParams.to_date) : undefined,
        page: queryParams.page || 1,
        limit: queryParams.limit || 20,
      })

      // Use mapper for consistent DTO transformation
      return {
        data: result.data.map((fraudCase) =>
          RedemptionMapper.toFraudCaseDTO(fraudCase),
        ),
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
          'list_fraud_cases',
          'Failed to fetch fraud cases from database',
          error,
          {
            correlationId: request.id,
            source: 'FraudController.listFraudCases',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get fraud statistics
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'fraud:stats',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getFraudStatistics(
    request: FastifyRequest<{
      Querystring: schemas.FraudStatisticsParams
    }>,
  ) {
    try {
      const queryParams = request.query
      const context = RequestContext.fromHeaders(request)

      // Provider filtering should be done in the use case layer
      const statsProviderId = queryParams.provider_id

      logger.debug('Getting fraud statistics', {
        userId: context.userId,
        providerId: statsProviderId,
        period: queryParams.period,
      })

      const stats = await this.getFraudStatisticsHandler.execute({
        providerId: statsProviderId,
        period: queryParams.period as any,
      })

      // Use mapper for consistent DTO transformation
      return RedemptionMapper.toFraudStatisticsDTO(stats)
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_fraud_statistics',
          'Failed to fetch fraud statistics from database',
          error,
          {
            correlationId: request.id,
            source: 'FraudController.getFraudStatistics',
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }
}
