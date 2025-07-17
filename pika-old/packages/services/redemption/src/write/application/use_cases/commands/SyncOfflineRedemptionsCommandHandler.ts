import { logger } from '@pika/shared'

import type { SyncOfflineRedemptionsDTO } from '../../../domain/dtos/RedemptionDTO.js'
import { Redemption } from '../../../domain/entities/Redemption.js'
import type { RedemptionWriteRepositoryPort } from '../../../domain/port/redemption/RedemptionWriteRepositoryPort.js'
import type { VoucherServicePort } from '../../../infrastructure/services/VoucherServiceClient.js'

/**
 * Command handler for syncing offline redemptions
 * Processes redemptions that were validated offline and need to be recorded
 */
export class SyncOfflineRedemptionsCommandHandler {
  constructor(
    private readonly redemptionRepo: RedemptionWriteRepositoryPort,
    private readonly voucherService: VoucherServicePort,
  ) {}

  /**
   * Sync multiple offline redemptions
   * Returns the IDs of successfully synced redemptions
   */
  async execute(
    dto: SyncOfflineRedemptionsDTO,
    providerId: string,
  ): Promise<{
    syncedIds: string[]
    errors: Array<{ code: string; error: string }>
  }> {
    logger.info(
      `Syncing ${dto.redemptions.length} offline redemptions for provider ${providerId}`,
    )

    const syncedIds: string[] = []
    const errors: Array<{ code: string; error: string }> = []

    // Process each redemption
    for (const offlineRedemption of dto.redemptions) {
      try {
        // Extract voucher and customer info from code
        // This is simplified - in reality we'd parse JWT or lookup short code
        const { voucherId, customerId } = await this.parseRedemptionCode(
          offlineRedemption.code,
        )

        // Validate voucher
        const voucher = await this.voucherService.getVoucherById(voucherId)

        if (!voucher) {
          errors.push({
            code: offlineRedemption.code,
            error: 'Voucher not found',
          })
          continue
        }

        // Check if already redeemed (prevent duplicates)
        const existingRedemption =
          await this.redemptionRepo.getRedemptionByCode(offlineRedemption.code)

        if (existingRedemption) {
          // Already synced, skip but don't report as error
          syncedIds.push(existingRedemption.id)
          continue
        }

        // Check redemption limits
        const customerRedemptions =
          await this.redemptionRepo.countCustomerVoucherRedemptions(
            voucherId,
            customerId,
          )

        if (customerRedemptions >= voucher.maxRedemptionsPerUser) {
          errors.push({
            code: offlineRedemption.code,
            error: 'Redemption limit exceeded',
          })
          continue
        }

        // Record redemption
        const redemptionEntity = Redemption.create({
          voucherId,
          customerId,
          providerId,
          code: offlineRedemption.code,
          redeemedAt: new Date(offlineRedemption.redeemedAt),
          location: offlineRedemption.location,
          offlineRedemption: true,
          metadata: {
            deviceId: offlineRedemption.deviceId,
            syncBatch: new Date().toISOString(),
          },
        })

        const redemption =
          await this.redemptionRepo.recordRedemption(redemptionEntity)

        syncedIds.push(redemption.id)
      } catch (error) {
        logger.error('Error syncing offline redemption', {
          code: offlineRedemption.code,
          error,
        })

        errors.push({
          code: offlineRedemption.code,
          error: error.message || 'Sync failed',
        })
      }
    }

    logger.info(
      `Offline sync complete: ${syncedIds.length} synced, ${errors.length} errors`,
    )

    return { syncedIds, errors }
  }

  /**
   * Parse redemption code to extract voucher and customer IDs
   * In a real implementation, this would decode JWT or lookup short code
   */
  private async parseRedemptionCode(
    code: string,
  ): Promise<{ voucherId: string; customerId: string }> {
    // Simplified implementation
    // In reality, we'd decode JWT or lookup short code in database

    if (code.includes('.')) {
      // JWT token - decode it
      // This is a placeholder - real implementation would use JWTService
      return {
        voucherId: 'placeholder-voucher-id',
        customerId: 'placeholder-customer-id',
      }
    } else {
      // Short code - lookup in database
      // This is a placeholder - real implementation would use ShortCodeService
      return {
        voucherId: 'placeholder-voucher-id',
        customerId: 'placeholder-customer-id',
      }
    }
  }
}
