import type { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, logger } from '@pika/shared'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type {
  RedeemVoucherCommandHandler,
  SyncOfflineRedemptionsCommandHandler,
  ValidateOfflineRedemptionCommandHandler,
} from '../../../application/use_cases/commands/index.js'
import type { QRGenerator } from '../../../infrastructure/utils/qrGenerator.js'

/**
 * Controller for redemption write operations
 */
export class RedemptionController {
  constructor(
    private readonly redeemVoucherHandler: RedeemVoucherCommandHandler,
    private readonly validateOfflineHandler: ValidateOfflineRedemptionCommandHandler,
    private readonly syncOfflineRedemptionsHandler: SyncOfflineRedemptionsCommandHandler,
    private readonly qrGenerator: QRGenerator,
  ) {
    this.redeemVoucher = this.redeemVoucher.bind(this)
    this.validateOffline = this.validateOffline.bind(this)
    this.syncOfflineRedemptions = this.syncOfflineRedemptions.bind(this)
    this.generateQRCode = this.generateQRCode.bind(this)
  }

  /**
   * Redeem a voucher
   */
  async redeemVoucher(
    request: FastifyRequest<{
      Body: schemas.RedeemVoucherDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)
      const dto = request.body

      logger.info('Redeeming voucher', {
        code: dto.code,
        userId: context.userId,
        role: context.role,
        customerId: dto.customer_id,
      })

      const result = await this.redeemVoucherHandler.execute({
        code: dto.code,
        providerId: context.userId, // Provider ID from authenticated user
        customerId: dto.customer_id || context.userId,
        location: dto.location,
        offlineRedemption: dto.offline_redemption,
      })

      reply.code(200).send(result)
    } catch (error: any) {
      logger.error('Error redeeming voucher', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        context: error.context,
      })

      if (error.code === 'VOUCHER_ALREADY_REDEEMED') {
        throw ErrorFactory.resourceConflict(
          'Voucher',
          'This voucher has already been redeemed',
          {
            source: 'RedemptionController.redeemVoucher',
          },
        )
      }

      if (error.code === 'VOUCHER_EXPIRED') {
        throw ErrorFactory.validationError(
          { voucher: ['Voucher has expired'] },
          {
            source: 'RedemptionController.redeemVoucher',
          },
        )
      }

      throw error
    }
  }

  /**
   * Validate offline redemption
   */
  async validateOffline(
    request: FastifyRequest<{
      Body: schemas.ValidateOfflineDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { token } = request.body

      logger.info('Validating offline redemption token')

      const result = await this.validateOfflineHandler.execute({ token })

      reply.code(200).send(result)
    } catch (error: any) {
      logger.error('Error validating offline redemption', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to validate offline redemption',
        {
          source: 'RedemptionController.validateOffline',
          correlationId: request.id,
        },
      )
    }
  }

  /**
   * Sync offline redemptions
   */
  async syncOfflineRedemptions(
    request: FastifyRequest<{
      Body: schemas.SyncOfflineRedemptionsDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)
      const { redemptions } = request.body

      logger.info('Syncing offline redemptions', {
        userId: context.userId,
        count: redemptions.length,
      })

      const result = await this.syncOfflineRedemptionsHandler.execute(
        {
          redemptions: redemptions.map((r: any) => ({
            code: r.code,
            redeemedAt: new Date(r.redeemed_at),
            location: r.location,
            deviceId: r.device_id,
          })),
        },
        context.userId,
      )

      reply.code(200).send(result)
    } catch (error: any) {
      logger.error('Error syncing offline redemptions', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to sync offline redemptions',
        {
          source: 'RedemptionController.syncOfflineRedemptions',
          correlationId: request.id,
        },
      )
    }
  }

  /**
   * Generate QR code for a voucher
   */
  async generateQRCode(
    request: FastifyRequest<{
      Body: schemas.GenerateQRCodeDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { token, format = 'png' } = request.body

      logger.info('Generating QR code', { format })

      let qrCode: string

      if (format === 'svg') {
        qrCode = await this.qrGenerator.generateQRCodeSVG(token)
      } else {
        qrCode = await this.qrGenerator.generateQRCode(token)
      }

      reply.code(200).send({
        qr_code: qrCode,
        format,
      })
    } catch (error: any) {
      logger.error('Error generating QR code', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })
      throw ErrorFactory.fromError(error, 'Failed to generate QR code', {
        source: 'RedemptionController.generateQRCode',
        correlationId: request.id,
      })
    }
  }
}
