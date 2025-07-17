import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { type ICacheService } from '@pika/redis'
import { RedemptionController } from '@redemption-read/api/controllers/redemption/RedemptionController.js'
import {
  GetFraudLogsHandler,
  GetRedemptionByIdHandler,
  GetRedemptionsByCustomerHandler,
  GetRedemptionsByProviderHandler,
} from '@redemption-read/application/use_cases/queries/index.js'
import type { RedemptionReadRepositoryPort } from '@redemption-read/domain/port/redemption/RedemptionReadRepositoryPort.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for redemption read endpoints
 *
 * @param redemptionRepository - Repository for redemption data access
 * @param cacheService - Cache service for fraud logs
 * @returns Fastify plugin for redemption routes
 */
export function createRedemptionReadRouter(
  redemptionRepository: RedemptionReadRepositoryPort,
  cacheService: ICacheService,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getRedemptionByIdHandler = new GetRedemptionByIdHandler(
      redemptionRepository,
    )
    const getRedemptionsByProviderHandler = new GetRedemptionsByProviderHandler(
      redemptionRepository,
    )
    const getRedemptionsByCustomerHandler = new GetRedemptionsByCustomerHandler(
      redemptionRepository,
    )
    const getFraudLogsHandler = new GetFraudLogsHandler(cacheService)

    // Initialize controller with the handlers
    const controller = new RedemptionController(
      getRedemptionByIdHandler,
      getRedemptionsByProviderHandler,
      getRedemptionsByCustomerHandler,
      getFraudLogsHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // GET /redemptions - Get all redemptions (admin only)
    fastify.get<{
      Querystring: schemas.RedemptionSearchParams
    }>(
      '/',
      {
        schema: {
          querystring: schemas.RedemptionSearchParamsSchema,
        },
      },
      async (request, reply) => {
        const result = await controller.getAllRedemptions(request)

        reply.code(200).send(result)
      },
    )

    // GET /redemptions/:id - Get redemption by ID
    fastify.get<{
      Params: { id: string }
    }>(
      '/:id',
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
        const result = await controller.getRedemptionById(request)

        reply.code(200).send(result)
      },
    )

    // GET /redemptions/provider/:providerId - Get redemptions by provider
    fastify.get<{
      Params: { providerId: string }
      Querystring: schemas.RedemptionSearchParams
    }>(
      '/provider/:providerId',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              providerId: { type: 'string', format: 'uuid' },
            },
            required: ['providerId'],
          },
          querystring: schemas.RedemptionSearchParamsSchema,
        },
      },
      async (request, reply) => {
        const result = await controller.getRedemptionsByProvider(request)

        reply.code(200).send(result)
      },
    )

    // GET /redemptions/customer/:customerId - Get redemptions by customer
    fastify.get<{
      Params: { customerId: string }
      Querystring: schemas.RedemptionSearchParams
    }>(
      '/customer/:customerId',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              customerId: { type: 'string', format: 'uuid' },
            },
            required: ['customerId'],
          },
          querystring: schemas.RedemptionSearchParamsSchema,
        },
      },
      async (request, reply) => {
        const result = await controller.getRedemptionsByCustomer(request)

        reply.code(200).send(result)
      },
    )

    // GET /redemptions/fraud-logs - Get fraud logs for dashboard
    fastify.get<{
      Querystring: { type: 'customer' | 'provider' | 'admin'; id?: string }
    }>(
      '/fraud-logs',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['customer', 'provider', 'admin'],
              },
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Required for customer and provider types',
              },
            },
            required: ['type'],
          },
        },
      },
      async (request, reply) => {
        const result = await controller.getFraudLogs(request)

        reply.code(200).send(result)
      },
    )
  }
}
