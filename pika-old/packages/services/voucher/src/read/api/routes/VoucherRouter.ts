import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { VoucherController } from '@voucher-read/api/controllers/voucher/index.js'
import {
  GetAllVouchersHandler,
  GetVoucherByIdHandler,
  GetVouchersByIdsHandler,
  GetVouchersByProviderIdHandler,
  GetVouchersByUserIdHandler,
} from '@voucher-read/application/use_cases/queries/index.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for voucher read endpoints
 *
 * @param voucherRepository - Repository for voucher data access
 * @returns Fastify plugin for voucher routes
 */
export function createVoucherReadRouter(
  voucherRepository: VoucherReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllVouchersHandler = new GetAllVouchersHandler(voucherRepository)
    const getVoucherByIdHandler = new GetVoucherByIdHandler(voucherRepository)
    const getVouchersByProviderIdHandler = new GetVouchersByProviderIdHandler(
      voucherRepository,
    )
    const getVouchersByUserIdHandler = new GetVouchersByUserIdHandler(
      voucherRepository,
    )
    const getVouchersByIdsHandler = new GetVouchersByIdsHandler(
      voucherRepository,
    )

    // Initialize controller with the handlers
    const voucherController = new VoucherController(
      getAllVouchersHandler,
      getVoucherByIdHandler,
      getVouchersByProviderIdHandler,
      getVouchersByUserIdHandler,
      getVouchersByIdsHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all vouchers with filtering and pagination
    fastify.get<{
      Querystring: schemas.VoucherSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.VoucherSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.VoucherSearchQuery
        }>,
        reply,
      ) => {
        const result = await voucherController.getAllVouchers(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific voucher by ID
    fastify.get<{
      Params: schemas.VoucherId
      Querystring: {
        include_codes?: boolean
        lang?: string
      }
    }>(
      '/:voucher_id',
      {
        schema: {
          params: schemas.VoucherIdSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.VoucherId
          Querystring: {
            include_codes?: boolean
            lang?: string
          }
        }>,
        reply,
      ) => {
        const result = await voucherController.getVoucherById(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving vouchers by provider ID
    fastify.get<{
      Params: schemas.ProviderId
      Querystring: schemas.VoucherSearchQuery
    }>(
      '/provider/:provider_id',
      {
        schema: {
          params: schemas.ProviderIdSchema,
          querystring: schemas.VoucherSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.ProviderId
          Querystring: schemas.VoucherSearchQuery
        }>,
        reply,
      ) => {
        const result = await voucherController.getVouchersByProviderId(request)

        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving vouchers by user ID
    fastify.get<{
      Params: schemas.UserIdParam
      Querystring: schemas.VoucherSearchQuery
    }>(
      '/user/:user_id',
      {
        schema: {
          params: schemas.UserIdParamSchema,
          querystring: schemas.VoucherSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.UserIdParam
          Querystring: schemas.VoucherSearchQuery
        }>,
        reply,
      ) => {
        const result = await voucherController.getVouchersByUserId(request)

        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for batch retrieval of vouchers by IDs (service-to-service)
    fastify.post<{
      Body: { voucher_ids: string[] }
    }>(
      '/batch',
      {
        schema: {
          body: {
            type: 'object',
            required: ['voucher_ids'],
            properties: {
              voucher_ids: {
                type: 'array',
                items: { type: 'string', format: 'uuid' },
                minItems: 1,
                maxItems: 100,
              },
            },
          },
        },
      },
      async (
        request: FastifyRequest<{
          Body: { voucher_ids: string[] }
        }>,
        reply,
      ) => {
        const result = await voucherController.getVouchersByIds(request)

        reply.code(200).send(result)
      },
    )
  }
}
