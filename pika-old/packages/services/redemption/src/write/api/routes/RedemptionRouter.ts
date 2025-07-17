import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import type {
  RedeemVoucherCommandHandler,
  SyncOfflineRedemptionsCommandHandler,
  ValidateOfflineRedemptionCommandHandler,
} from '@redemption-write/application/use_cases/commands/index.js'
import type { QRGenerator } from '@redemption-write/infrastructure/utils/qrGenerator.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

import { RedemptionController } from '../controllers/redemption/RedemptionController.js'

/**
 * Creates a Fastify router for redemption write endpoints
 *
 * @param handlers - Command handlers for redemption operations
 * @param qrGenerator - QR code generator for converting JWT to images
 * @returns Fastify plugin for redemption write routes
 */
export function createRedemptionWriteRouter(
  handlers: {
    redeemVoucherHandler: RedeemVoucherCommandHandler
    validateOfflineHandler: ValidateOfflineRedemptionCommandHandler
    syncOfflineRedemptionsHandler: SyncOfflineRedemptionsCommandHandler
  },
  qrGenerator: QRGenerator,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize controller with the handlers
    const controller = new RedemptionController(
      handlers.redeemVoucherHandler,
      handlers.validateOfflineHandler,
      handlers.syncOfflineRedemptionsHandler,
      qrGenerator,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // POST /redemptions - Redeem a voucher
    fastify.post<{
      Body: schemas.RedeemVoucherDTO
    }>(
      '/',
      {
        schema: {
          body: schemas.RedeemVoucherDTOSchema,
        },
      },
      async (request, reply) => {
        await controller.redeemVoucher(request, reply)
      },
    )

    // POST /redemptions/validate-offline - Validate an offline redemption token
    fastify.post<{
      Body: schemas.ValidateOfflineDTO
    }>(
      '/validate-offline',
      {
        schema: {
          body: schemas.ValidateOfflineDTOSchema,
        },
      },
      async (request, reply) => {
        await controller.validateOffline(request, reply)
      },
    )

    // POST /redemptions/sync-offline - Sync offline redemptions
    fastify.post<{
      Body: schemas.SyncOfflineRedemptionsDTO
    }>(
      '/sync-offline',
      {
        schema: {
          body: schemas.SyncOfflineRedemptionsDTOSchema,
        },
      },
      async (request, reply) => {
        await controller.syncOfflineRedemptions(request, reply)
      },
    )

    // POST /redemptions/generate-qr - Generate QR code for a redemption token
    fastify.post<{
      Body: schemas.GenerateQRCodeDTO
    }>(
      '/generate-qr',
      {
        schema: {
          body: schemas.GenerateQRCodeDTOSchema,
        },
      },
      async (request, reply) => {
        await controller.generateQRCode(request, reply)
      },
    )
  }
}
