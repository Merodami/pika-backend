import { ErrorFactory, logger } from '@pika/shared'
import type { FastifyReply, FastifyRequest } from 'fastify'

import type { ClaimVoucherCommandHandler } from '../../../application/use_cases/commands/ClaimVoucherCommandHandler.js'
import type { VoucherScanCommandHandler } from '../../../application/use_cases/commands/VoucherScanCommandHandler.js'

/**
 * Controller for voucher scanning operations (customer-facing)
 */
export class VoucherScanController {
  constructor(
    private readonly scanHandler: VoucherScanCommandHandler,
    private readonly claimHandler: ClaimVoucherCommandHandler,
  ) {
    this.trackScan = this.trackScan.bind(this)
    this.claimVoucher = this.claimVoucher.bind(this)
  }

  /**
   * Track a customer scan of a voucher QR code
   * This does NOT redeem the voucher, only tracks the scan for analytics
   */
  async trackScan(
    request: FastifyRequest<{
      Params: { voucherId: string }
      Body: {
        scanSource?: 'CAMERA' | 'GALLERY' | 'LINK' | 'SHARE'
        location?: {
          latitude: number
          longitude: number
        }
        deviceInfo?: {
          platform: string
          version: string
          model?: string
        }
      }
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { voucherId } = request.params
      const userId = request.headers['x-user-id'] as string | undefined

      logger.info('Tracking voucher scan', {
        voucherId,
        userId,
        scanSource: request.body.scanSource,
      })

      const result = await this.scanHandler.execute({
        voucherId,
        userId,
        scanType: 'CUSTOMER',
        scanSource: request.body.scanSource || 'CAMERA',
        location: request.body.location,
        deviceInfo: request.body.deviceInfo || {
          platform: request.headers['user-agent'] || 'unknown',
          version: 'unknown',
        },
      })

      // Return voucher details for display
      reply.status(200).send({
        voucher: result.voucher,
        scanId: result.scanId,
        canClaim: result.canClaim,
        alreadyClaimed: result.alreadyClaimed,
        nearbyLocations: result.nearbyLocations,
      })
    } catch (error) {
      logger.error('Error tracking voucher scan', { error })

      if (error instanceof Error && error.message.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          request.params.voucherId,
          {
            source: 'VoucherScanController.trackScan',
          },
        )
      }

      throw ErrorFactory.externalServiceError(
        'scan-tracking',
        'Failed to track voucher scan',
        error,
        {
          source: 'VoucherScanController.trackScan',
        },
      )
    }
  }

  /**
   * Claim a voucher to the customer's wallet
   * This associates the voucher with the customer but does NOT redeem it
   */
  async claimVoucher(
    request: FastifyRequest<{
      Params: { voucherId: string }
      Body: {
        notificationPreferences?: {
          enableReminders: boolean
          reminderDaysBefore?: number
        }
      }
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { voucherId } = request.params
      const userId = request.headers['x-user-id'] as string

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to claim vouchers',
          { source: 'VoucherScanController.claimVoucher' },
        )
      }

      logger.info('Claiming voucher to wallet', { voucherId, userId })

      const result = await this.claimHandler.execute({
        voucherId,
        customerId: userId,
        notificationPreferences: request.body.notificationPreferences,
      })

      reply.status(201).send({
        claimId: result.claimId,
        voucher: result.voucher,
        claimedAt: result.claimedAt,
        expiresAt: result.expiresAt,
        walletPosition: result.walletPosition,
      })
    } catch (error) {
      logger.error('Error claiming voucher', { error })

      if (error instanceof Error) {
        if (error.message.includes('already claimed')) {
          throw ErrorFactory.resourceConflict(
            'Voucher',
            'Already claimed by this customer',
            {
              source: 'VoucherScanController.claimVoucher',
            },
          )
        }
        if (error.message.includes('not found')) {
          throw ErrorFactory.resourceNotFound(
            'Voucher',
            request.params.voucherId,
            {
              source: 'VoucherScanController.claimVoucher',
            },
          )
        }
        if (error.message.includes('expired')) {
          throw ErrorFactory.businessRuleViolation(
            'Cannot claim expired voucher',
            'The voucher has already expired',
            { source: 'VoucherScanController.claimVoucher' },
          )
        }
      }

      throw ErrorFactory.externalServiceError(
        'voucher-claim',
        'Failed to claim voucher',
        error,
        {
          source: 'VoucherScanController.claimVoucher',
        },
      )
    }
  }
}
