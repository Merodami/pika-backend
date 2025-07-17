import { ErrorFactory, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { Redemption } from '@redemption-write/domain/entities/Redemption.js'
import type { RedemptionWriteRepositoryPort } from '@redemption-write/domain/port/redemption/RedemptionWriteRepositoryPort.js'

import { RedemptionDocumentMapper } from '../mappers/RedemptionDocumentMapper.js'

/**
 * Prisma implementation of RedemptionWriteRepository
 */
export class PrismaRedemptionWriteRepository
  implements RedemptionWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Record a new redemption
   */
  async recordRedemption(redemption: Redemption): Promise<Redemption> {
    try {
      const createData =
        RedemptionDocumentMapper.mapDomainToCreateData(redemption)

      const result = await this.prisma.voucherRedemption.create({
        data: createData,
      })

      return RedemptionDocumentMapper.mapDocumentToDomain(result as any)
    } catch (error) {
      logger.error('Error recording redemption', { error, redemption })

      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'Redemption',
          'This voucher has already been redeemed by this customer',
          {
            source: 'PrismaRedemptionWriteRepository.recordRedemption',
            metadata: {
              voucherId: redemption.voucherId,
              customerId: redemption.customerId,
            },
          },
        )
      }

      throw ErrorFactory.databaseError(
        'record_redemption',
        'Failed to record redemption',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.recordRedemption',
        },
      )
    }
  }

  /**
   * Check if a redemption exists for a voucher and customer
   */
  async checkRedemptionExists(
    voucherId: string,
    customerId: string,
  ): Promise<boolean> {
    try {
      const count = await this.prisma.voucherRedemption.count({
        where: {
          voucherId,
          userId: customerId,
        },
      })

      return count > 0
    } catch (error) {
      logger.error('Error checking redemption existence', {
        error,
        voucherId,
        customerId,
      })

      throw ErrorFactory.databaseError(
        'check_redemption_exists',
        'Failed to check redemption existence',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.checkRedemptionExists',
        },
      )
    }
  }

  /**
   * Get redemption by code
   */
  async getRedemptionByCode(code: string): Promise<Redemption | null> {
    try {
      const result = await this.prisma.voucherRedemption.findFirst({
        where: { codeUsed: code },
      })

      return result
        ? RedemptionDocumentMapper.mapDocumentToDomain(result as any)
        : null
    } catch (error) {
      logger.error('Error getting redemption by code', { error, code })

      throw ErrorFactory.databaseError(
        'get_redemption_by_code',
        'Failed to get redemption by code',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.getRedemptionByCode',
        },
      )
    }
  }

  /**
   * Count total redemptions for a voucher
   */
  async countVoucherRedemptions(voucherId: string): Promise<number> {
    try {
      return await this.prisma.voucherRedemption.count({
        where: { voucherId },
      })
    } catch (error) {
      logger.error('Error counting voucher redemptions', { error, voucherId })

      throw ErrorFactory.databaseError(
        'count_voucher_redemptions',
        'Failed to count voucher redemptions',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.countVoucherRedemptions',
        },
      )
    }
  }

  /**
   * Count redemptions for a voucher by a specific customer
   */
  async countCustomerVoucherRedemptions(
    voucherId: string,
    customerId: string,
  ): Promise<number> {
    try {
      return await this.prisma.voucherRedemption.count({
        where: {
          voucherId,
          userId: customerId,
        },
      })
    } catch (error) {
      logger.error('Error counting customer voucher redemptions', {
        error,
        voucherId,
        customerId,
      })

      throw ErrorFactory.databaseError(
        'count_customer_voucher_redemptions',
        'Failed to count customer voucher redemptions',
        error,
        {
          source:
            'PrismaRedemptionWriteRepository.countCustomerVoucherRedemptions',
        },
      )
    }
  }

  /**
   * Update redemption sync status
   */
  async updateRedemptionSyncStatus(
    redemptionId: string,
    syncedAt: Date,
  ): Promise<void> {
    try {
      await this.prisma.voucherRedemption.update({
        where: { id: redemptionId },
        data: {
          metadata: {
            syncedAt,
          },
        },
      })
    } catch (error) {
      logger.error('Error updating redemption sync status', {
        error,
        redemptionId,
      })

      throw ErrorFactory.databaseError(
        'update_redemption_sync_status',
        'Failed to update redemption sync status',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.updateRedemptionSyncStatus',
        },
      )
    }
  }

  /**
   * Batch insert offline redemptions
   */
  async batchInsertRedemptions(
    redemptions: Array<Omit<Redemption, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Redemption[]> {
    try {
      const data = redemptions.map((r) => {
        const redemption = Redemption.create({
          voucherId: r.voucherId,
          customerId: r.customerId,
          providerId: r.providerId,
          code: r.code,
          redeemedAt: r.redeemedAt,
          location: r.location,
          offlineRedemption: r.offlineRedemption,
          metadata: r.metadata,
        })

        return RedemptionDocumentMapper.mapDomainToCreateData(redemption)
      })

      // Prisma doesn't return created records from createMany
      // Use voucher+user combination to find created records since IDs are auto-generated
      const voucherUserPairs = data.map((d) => ({
        voucherId: d.voucherId,
        userId: d.userId,
      }))

      await this.prisma.voucherRedemption.createMany({ data })

      const created = await this.prisma.voucherRedemption.findMany({
        where: {
          OR: voucherUserPairs.map((pair) => ({
            voucherId: pair.voucherId,
            userId: pair.userId,
          })),
        },
      })

      return created.map((c) =>
        RedemptionDocumentMapper.mapDocumentToDomain(c as any),
      )
    } catch (error) {
      logger.error('Error batch inserting redemptions', { error })

      throw ErrorFactory.databaseError(
        'batch_insert_redemptions',
        'Failed to batch insert redemptions',
        error,
        {
          source: 'PrismaRedemptionWriteRepository.batchInsertRedemptions',
        },
      )
    }
  }
}
