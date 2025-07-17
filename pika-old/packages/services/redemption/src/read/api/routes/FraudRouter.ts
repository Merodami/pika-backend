import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { FraudController } from '@redemption-read/api/controllers/fraud/FraudController.js'
import {
  GetFraudCaseByIdHandler,
  GetFraudStatisticsHandler,
  SearchFraudCasesHandler,
} from '@redemption-read/application/use_cases/queries/index.js'
import type { FraudCaseReadRepositoryPort } from '@redemption-read/domain/port/fraud/FraudCaseReadRepositoryPort.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for fraud read endpoints
 *
 * @param fraudCaseRepository - Repository for fraud case data access
 * @returns Fastify plugin for fraud routes
 */
export function createFraudReadRouter(
  fraudCaseRepository: FraudCaseReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getFraudCaseByIdHandler = new GetFraudCaseByIdHandler(
      fraudCaseRepository,
    )
    const searchFraudCasesHandler = new SearchFraudCasesHandler(
      fraudCaseRepository,
    )
    const getFraudStatisticsHandler = new GetFraudStatisticsHandler(
      fraudCaseRepository,
    )

    // Initialize controller with the handlers
    const controller = new FraudController(
      getFraudCaseByIdHandler,
      searchFraudCasesHandler,
      getFraudStatisticsHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // GET /fraud/cases - List fraud cases
    fastify.get<{
      Querystring: schemas.FraudCaseSearchParams
    }>(
      '/cases',
      {
        schema: {
          querystring: schemas.FraudCaseSearchParamsSchema,
        },
      },
      async (request, reply) => {
        const result = await controller.listFraudCases(request)

        reply.code(200).send(result)
      },
    )

    // GET /fraud/cases/:id - Get fraud case details
    fastify.get<{
      Params: { id: string }
    }>(
      '/cases/:id',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
        },
      },
      async (request, reply) => {
        const result = await controller.getFraudCase(request)

        reply.code(200).send(result)
      },
    )

    // GET /fraud/statistics - Get fraud statistics
    fastify.get<{
      Querystring: schemas.FraudStatisticsParams
    }>(
      '/statistics',
      {
        schema: {
          querystring: schemas.FraudStatisticsParamsSchema,
        },
      },
      async (request, reply) => {
        const result = await controller.getFraudStatistics(request)

        reply.code(200).send(result)
      },
    )
  }
}
