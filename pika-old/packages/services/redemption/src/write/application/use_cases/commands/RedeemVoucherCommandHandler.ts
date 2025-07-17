import type { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { ProviderServiceClient, VoucherServiceClient } from '@pika/shared'

import type {
  RedeemVoucherDTO,
  RedemptionResultDTO,
} from '../../../domain/dtos/RedemptionDTO.js'
import { Redemption } from '../../../domain/entities/Redemption.js'
import type { FraudCaseRepositoryPort } from '../../../domain/port/fraud/FraudCaseRepositoryPort.js'
import type { RedemptionWriteRepositoryPort } from '../../../domain/port/redemption/RedemptionWriteRepositoryPort.js'
import { FraudDetectionService } from '../../../infrastructure/services/FraudDetectionService.js'
import { JWTService } from '../../../infrastructure/services/JWTService.js'
import { ShortCodeService } from '../../../infrastructure/services/ShortCodeService.js'
import { CreateFraudCaseCommandHandler } from './CreateFraudCaseCommandHandler.js'

/**
 * Command handler for redeeming vouchers
 */
export class RedeemVoucherCommandHandler {
  private readonly fraudDetectionService: FraudDetectionService
  private readonly createFraudCaseHandler: CreateFraudCaseCommandHandler

  constructor(
    private readonly redemptionRepo: RedemptionWriteRepositoryPort,
    private readonly fraudCaseRepo: FraudCaseRepositoryPort,
    private readonly voucherService: VoucherServiceClient,
    private readonly providerService: ProviderServiceClient,
    private readonly jwtService: JWTService,
    private readonly shortCodeService: ShortCodeService,
    private readonly cacheService: ICacheService,
  ) {
    this.fraudDetectionService = new FraudDetectionService(cacheService)
    this.createFraudCaseHandler = new CreateFraudCaseCommandHandler(
      fraudCaseRepo,
    )
  }

  /**
   * Execute voucher redemption
   */
  async execute(dto: RedeemVoucherDTO): Promise<RedemptionResultDTO> {
    logger.debug('Processing voucher redemption', {
      userId: dto.providerId, // This is actually the userId from the controller
      codeLength: dto.code.length,
      offline: dto.offlineRedemption,
    })

    try {
      // First, look up the provider entity by user ID
      // The dto.providerId is actually the userId from the controller
      const provider = await this.providerService.getProviderByUserId(
        dto.providerId,
      )

      if (!provider || !provider.active) {
        return {
          success: false,
          error: 'Only active providers can redeem vouchers',
          errorCode: 'INVALID_PROVIDER',
        }
      }

      const actualProviderId = provider.id

      // 1. Determine code type and extract voucher/customer info
      let voucherId: string
      let customerId: string
      let shortCodeInfo: {
        voucherId: string
        type: string
        customerId?: string
      } | null = null

      if (this.isJWTToken(dto.code)) {
        // Handle JWT token from QR code
        const claims = await this.jwtService.verifyRedemptionToken(dto.code)

        voucherId = claims.voucherId
        customerId = claims.customerId
      } else {
        // Handle short code
        shortCodeInfo = await this.shortCodeService.lookupShortCode(dto.code)
        if (!shortCodeInfo) {
          return {
            success: false,
            error: 'Invalid redemption code',
            errorCode: 'INVALID_CODE',
          }
        }
        voucherId = shortCodeInfo.voucherId
        // For short codes, we need to get customer ID from the request context
        // For static codes without customer context, use the provided customer ID
        customerId = dto.customerId || ''
        if (!customerId) {
          return {
            success: false,
            error: 'Customer ID is required for voucher redemption',
            errorCode: 'INVALID_CODE',
          }
        }
      }

      // 2. Validate voucher exists and is redeemable
      const voucher = await this.voucherService.getVoucherById(voucherId)

      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found',
          errorCode: 'VOUCHER_NOT_FOUND',
        }
      }

      // 3. Check voucher expiration first
      if (new Date() > new Date(voucher.expiresAt)) {
        return {
          success: false,
          error: 'Voucher has expired',
          errorCode: 'EXPIRED',
        }
      }

      // 4. Check voucher state
      if (voucher.state !== 'PUBLISHED') {
        return {
          success: false,
          error: 'Voucher is not available for redemption',
          errorCode: 'INVALID_CODE',
        }
      }

      // 5. Validate provider
      if (voucher.providerId !== actualProviderId) {
        logger.warn('Provider mismatch attempted', {
          voucherId,
          expectedProviderId: voucher.providerId,
          attemptedProviderId: actualProviderId,
          userId: dto.providerId,
        })

        return {
          success: false,
          error: 'This voucher cannot be redeemed at this provider',
          errorCode: 'INVALID_PROVIDER',
        }
      }

      // 6. Check redemption limits
      const customerRedemptions =
        await this.redemptionRepo.countCustomerVoucherRedemptions(
          voucherId,
          customerId,
        )

      if (customerRedemptions >= voucher.maxRedemptionsPerUser) {
        logger.warn('Duplicate redemption attempt', {
          voucherId,
          customerId,
          existingRedemptions: customerRedemptions,
          limit: voucher.maxRedemptionsPerUser,
        })

        return {
          success: false,
          error: 'You have already redeemed this voucher',
          errorCode: 'ALREADY_REDEEMED',
        }
      }

      // Check total redemption limit if set
      if (voucher.maxRedemptions) {
        const totalRedemptions =
          await this.redemptionRepo.countVoucherRedemptions(voucherId)

        if (totalRedemptions >= voucher.maxRedemptions) {
          return {
            success: false,
            error: 'This voucher has reached its redemption limit',
            errorCode: 'ALREADY_REDEEMED',
          }
        }
      }

      // 7. Record redemption first (before fraud check to get redemption ID)
      const redemptionEntity = Redemption.create({
        voucherId,
        customerId,
        providerId: actualProviderId,
        code: dto.code,
        redeemedAt: new Date(),
        location: dto.location,
        offlineRedemption: dto.offlineRedemption || false,
        metadata: {
          deviceId: dto.deviceId,
        },
      })

      const redemption =
        await this.redemptionRepo.recordRedemption(redemptionEntity)

      // 8. Run fraud detection checks with redemption ID
      const fraudCheck = await this.fraudDetectionService.checkRedemption({
        redemptionId: redemption.id,
        voucherId,
        customerId,
        providerId: actualProviderId,
        location: dto.location,
        timestamp: new Date(),
      })

      // Create fraud case if suspicious activity detected
      if (fraudCheck.flags.length > 0) {
        logger.warn('Fraud flags detected during redemption', {
          redemptionId: redemption.id,
          voucherId,
          customerId,
          providerId: actualProviderId,
          flags: fraudCheck.flags,
          riskScore: fraudCheck.riskScore,
          requiresReview: fraudCheck.requiresReview,
        })

        // Create fraud case in database
        try {
          await this.createFraudCaseHandler.execute({
            redemptionId: redemption.id,
            riskScore: fraudCheck.riskScore,
            flags: fraudCheck.flags,
            customerId,
            providerId: actualProviderId,
            voucherId,
            detectionMetadata: {
              location: dto.location,
              deviceId: dto.deviceId,
              offlineRedemption: dto.offlineRedemption,
            },
          })
        } catch (error) {
          // Log error but don't fail redemption
          logger.error('Failed to create fraud case', {
            error,
            redemptionId: redemption.id,
          })

          // Add to retry queue for later processing
          try {
            const retryData = {
              redemptionId: redemption.id,
              riskScore: fraudCheck.riskScore,
              flags: fraudCheck.flags,
              customerId,
              providerId: actualProviderId,
              voucherId,
              detectionMetadata: {
                location: dto.location,
                deviceId: dto.deviceId,
                offlineRedemption: dto.offlineRedemption,
              },
              attempt: 1,
              lastError: error.message,
            }

            // Store in Redis with TTL for retry processing
            await this.cacheService.set(
              `fraud:retry:${redemption.id}`,
              retryData,
              86400, // 24 hour TTL
            )

            logger.info('Added fraud case to retry queue', {
              redemptionId: redemption.id,
              attempt: 1,
            })
          } catch (retryError) {
            logger.error('Failed to add fraud case to retry queue', {
              error: retryError,
              redemptionId: redemption.id,
            })
          }
        }
      }

      // 9. Update voucher state to REDEEMED in voucher service
      try {
        await this.voucherService.updateVoucherState(
          voucherId,
          {
            state: 'REDEEMED',
            redeemedAt: new Date().toISOString(),
            redeemedBy: customerId,
            location: dto.location
              ? {
                  lat: dto.location.lat,
                  lng: dto.location.lng,
                }
              : undefined,
          },
          {
            serviceName: 'redemption-service',
            correlationId: `redemption-${redemption.id}`,
            useServiceAuth: true,
          },
        )

        logger.info('Voucher state updated to REDEEMED', {
          voucherId,
          redemptionId: redemption.id,
        })
      } catch (stateUpdateError) {
        // Log error but don't fail the redemption - it's already recorded
        logger.error('Failed to update voucher state after redemption', {
          error: stateUpdateError,
          voucherId,
          redemptionId: redemption.id,
        })

        // Add to retry queue for later processing
        try {
          await this.cacheService.set(
            `voucher:state:retry:${redemption.id}`,
            {
              voucherId,
              redemptionId: redemption.id,
              state: 'REDEEMED',
              redeemedAt: redemption.redeemedAt,
              redeemedBy: customerId,
              attempt: 1,
              lastError: stateUpdateError.message,
            },
            86400, // 24 hour TTL
          )

          logger.info('Added voucher state update to retry queue', {
            redemptionId: redemption.id,
            voucherId,
          })
        } catch (retryError) {
          logger.error('Failed to add voucher state update to retry queue', {
            error: retryError,
            redemptionId: redemption.id,
          })
        }
      }

      // 10. Invalidate dynamic short codes after successful redemption
      if (shortCodeInfo?.type === 'dynamic') {
        await this.shortCodeService.invalidateShortCode(dto.code)
      }

      // 11. Invalidate cache for voucher stats
      await this.cacheService.del(`voucher:${voucherId}:stats`)
      await this.cacheService.del(`provider:${actualProviderId}:redemptions`)

      // 12. Get provider name
      const providerDetails = await this.providerService.getProvider(
        voucher.providerId,
      )
      const providerName =
        providerDetails?.businessName?.en ||
        providerDetails?.businessName?.es ||
        'Provider'

      // 13. Format discount for display
      const discount =
        voucher.discountType === 'PERCENTAGE'
          ? `${voucher.discountValue}%`
          : `${voucher.currency} ${voucher.discountValue}`

      // 14. Log successful redemption for audit trail
      logger.info('Voucher redeemed successfully', {
        redemptionId: redemption.id,
        voucherId,
        customerId,
        providerId: actualProviderId,
        userId: dto.providerId,
        location: dto.location,
        offlineRedemption: dto.offlineRedemption,
        codeType: this.isJWTToken(dto.code) ? 'jwt' : 'short',
      })

      return {
        success: true,
        redemptionId: redemption.id,
        voucherDetails: {
          title: voucher.title.es || voucher.title.en || 'Voucher',
          discount,
          providerName,
          instructions: 'Show this confirmation to the staff',
        },
      }
    } catch (error) {
      logger.error('Error redeeming voucher', { error, dto })

      if (error.message?.includes('expired')) {
        return {
          success: false,
          error: 'Redemption code has expired',
          errorCode: 'EXPIRED',
        }
      }

      throw ErrorFactory.fromError(error, 'Failed to redeem voucher', {
        source: 'RedeemVoucherCommandHandler.execute',
        metadata: { userId: dto.providerId },
      })
    }
  }

  /**
   * Check if code is a JWT token
   */
  private isJWTToken(code: string): boolean {
    // JWT tokens have 3 parts separated by dots
    return code.split('.').length === 3
  }
}
