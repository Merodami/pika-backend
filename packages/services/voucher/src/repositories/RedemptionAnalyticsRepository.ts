import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { type VoucherDomain, VoucherMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'
import { VoucherRedemptionMethod, VoucherRedemptionType } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'
import { get, has, set } from 'lodash-es'

// Redemption logging data structure
export interface VoucherRedemptionLogData {
  businessId?: string
  codeUsed?: string
  location?: { lat: number; lng: number }
  locationName?: string
  deviceInfo?: {
    platform?: string
    version?: string
    model?: string
    [key: string]: any
  }
  ipAddress?: string
  userAgent?: string
  transactionId?: string
  transactionAmount?: number
  discountApplied?: number
  redemptionType?: VoucherRedemptionType
  redemptionMethod?: VoucherRedemptionMethod
}

// Redemption history filters
export interface RedemptionHistoryFilters {
  voucherId?: string
  userId?: string
  businessId?: string
  startDate?: Date
  endDate?: Date
  redemptionType?: VoucherRedemptionType
  redemptionMethod?: VoucherRedemptionMethod
}

// Redemption history record
export interface RedemptionHistoryRecord {
  id: string
  voucherId: string
  userId: string
  redeemedAt: Date
  codeUsed: string | null
  metadata: {
    businessId?: string
    location?: { lat: number; lng: number }
    locationName?: string
    deviceInfo?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    transactionId?: string
    transactionAmount?: number
    discountApplied?: number
    currency?: string
    voucherTitle?: string
    voucherType?: string
    redemptionType?: string
    redemptionMethod?: string
  } | null
  voucher?: VoucherDomain
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

// Redemption statistics filters
export interface RedemptionStatsFilters {
  businessId?: string
  startDate?: Date
  endDate?: Date
}

// Redemption statistics response
export interface RedemptionStats {
  totalRedemptions: number
  uniqueUsers: number
  totalDiscountValue: number
  byType: Record<string, number>
  byMethod: Record<string, number>
  dailyRedemptions: Array<{ date: string; count: number; value: number }>
}

export interface IRedemptionAnalyticsRepository {
  logRedemption(
    voucherId: string,
    userId: string,
    voucher: any,
    redemptionData?: VoucherRedemptionLogData,
  ): Promise<void>
  getRedemptionHistory(
    filters: RedemptionHistoryFilters,
    pagination?: { page: number; limit: number },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>>
  getRedemptionStats(filters: RedemptionStatsFilters): Promise<RedemptionStats>
  voucherExists(voucherId: string): Promise<boolean>
}

export class RedemptionAnalyticsRepository
  implements IRedemptionAnalyticsRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Logs voucher redemption for analytics and reporting
   * This is a non-critical operation that should not block the redemption flow
   */
  async logRedemption(
    voucherId: string,
    userId: string,
    voucher: any,
    redemptionData?: VoucherRedemptionLogData,
  ): Promise<void> {
    await this.prisma.voucherRedemption.create({
      data: {
        voucherId,
        userId,
        codeUsed: redemptionData?.codeUsed || '',
        redeemedAt: new Date(),
        metadata: {
          businessId: redemptionData?.businessId || voucher?.businessId,
          location: redemptionData?.location,
          locationName: redemptionData?.locationName,
          deviceInfo: redemptionData?.deviceInfo,
          ipAddress: redemptionData?.ipAddress,
          userAgent: redemptionData?.userAgent,
          transactionId: redemptionData?.transactionId,
          transactionAmount: redemptionData?.transactionAmount,
          discountApplied:
            redemptionData?.discountApplied ||
            voucher?.discount ||
            voucher?.value,
          currency: voucher?.currency || 'PYG',
          voucherTitle: voucher?.titleKey,
          voucherType: voucher?.type,
          redemptionType:
            redemptionData?.redemptionType || VoucherRedemptionType.APP,
          redemptionMethod:
            redemptionData?.redemptionMethod ||
            VoucherRedemptionMethod.MANUAL_CODE,
        },
      },
    })

    logger.info('Voucher redemption logged successfully', {
      voucherId,
      userId,
      transactionId: redemptionData?.transactionId,
    })
  }

  /**
   * Get redemption history for reporting
   */
  async getRedemptionHistory(
    filters: RedemptionHistoryFilters,
    pagination = { page: 1, limit: PAGINATION_DEFAULT_LIMIT },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>> {
    try {
      const where: Prisma.VoucherRedemptionWhereInput = {}

      if (filters.voucherId) where.voucherId = filters.voucherId
      if (filters.userId) where.userId = filters.userId

      // Filter by businessId in metadata using JSON path
      if (filters.businessId) {
        where.metadata = {
          path: ['businessId'],
          equals: filters.businessId,
        }
      }

      // Date range filters
      if (filters.startDate || filters.endDate) {
        where.redeemedAt = {}
        if (filters.startDate) where.redeemedAt.gte = filters.startDate
        if (filters.endDate) where.redeemedAt.lte = filters.endDate
      }

      // Note: For complex JSON queries on redemptionType and redemptionMethod,
      // we'll filter in memory after fetching or use raw SQL if needed

      const [redemptions, total] = await Promise.all([
        this.prisma.voucherRedemption.findMany({
          where,
          include: {
            voucher: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { redeemedAt: 'desc' },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        this.prisma.voucherRedemption.count({ where }),
      ])

      // Filter by redemption type and method if provided (in-memory filtering)
      let filteredRedemptions = redemptions

      if (filters.redemptionType) {
        filteredRedemptions = filteredRedemptions.filter((r) => {
          const metadata = r.metadata as Record<string, any>

          return metadata?.redemptionType === filters.redemptionType
        })
      }
      if (filters.redemptionMethod) {
        filteredRedemptions = filteredRedemptions.filter((r) => {
          const metadata = r.metadata as Record<string, any>

          return metadata?.redemptionMethod === filters.redemptionMethod
        })
      }

      // Map to RedemptionHistoryRecord format
      const mappedRedemptions: RedemptionHistoryRecord[] =
        filteredRedemptions.map((r) => ({
          id: r.id,
          voucherId: r.voucherId,
          userId: r.userId,
          redeemedAt: r.redeemedAt,
          codeUsed: r.codeUsed,
          metadata: r.metadata as RedemptionHistoryRecord['metadata'],
          voucher: r.voucher
            ? VoucherMapper.fromDocument(
                this.convertPrismaVoucherToDocument(r.voucher),
              )
            : undefined,
          user: r.user || undefined,
        }))

      return {
        data: mappedRedemptions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
          hasNext: pagination.page < Math.ceil(total / pagination.limit),
          hasPrev: pagination.page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to get redemption history', { error, filters })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemption statistics for analytics
   */
  async getRedemptionStats(
    filters: RedemptionStatsFilters,
  ): Promise<RedemptionStats> {
    try {
      const where: Prisma.VoucherRedemptionWhereInput = {}

      // Date range filters
      if (filters.startDate || filters.endDate) {
        where.redeemedAt = {}
        if (filters.startDate) where.redeemedAt.gte = filters.startDate
        if (filters.endDate) where.redeemedAt.lte = filters.endDate
      }

      const redemptions = await this.prisma.voucherRedemption.findMany({
        where,
        select: {
          userId: true,
          redeemedAt: true,
          metadata: true,
        },
      })

      // Filter by businessId if provided (in-memory filtering)
      let filteredRedemptions = redemptions

      if (filters.businessId) {
        filteredRedemptions = redemptions.filter((r) => {
          const metadata = r.metadata as Record<string, any>

          return metadata?.businessId === filters.businessId
        })
      }

      // Calculate statistics
      const uniqueUsers = new Set(filteredRedemptions.map((r) => r.userId)).size

      let totalDiscountValue = 0

      const byType: Record<string, number> = {}
      const byMethod: Record<string, number> = {}
      const dailyMap: Record<string, { count: number; value: number }> = {}

      filteredRedemptions.forEach((redemption) => {
        const metadata = redemption.metadata as Record<string, any>

        // Sum discount values
        if (metadata?.discountApplied) {
          totalDiscountValue += Number(metadata.discountApplied)
        }

        // Count by type
        const type = get(metadata, 'redemptionType', 'unknown')

        set(byType, type, get(byType, type, 0) + 1)

        // Count by method
        const method = get(metadata, 'redemptionMethod', 'unknown')

        set(byMethod, method, get(byMethod, method, 0) + 1)

        // Daily aggregation
        const date = redemption.redeemedAt.toISOString().split('T')[0]

        if (!has(dailyMap, date)) {
          set(dailyMap, date, { count: 0, value: 0 })
        }

        const currentCount = get(dailyMap, `${date}.count`, 0) as number

        set(dailyMap, `${date}.count`, currentCount + 1)
        if (get(metadata, 'discountApplied')) {
          const currentValue = get(dailyMap, `${date}.value`, 0) as number
          const discountValue = Number(get(metadata, 'discountApplied', 0))

          set(dailyMap, `${date}.value`, currentValue + discountValue)
        }
      })

      const dailyRedemptions = Object.entries(dailyMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        totalRedemptions: filteredRedemptions.length,
        uniqueUsers,
        totalDiscountValue,
        byType,
        byMethod,
        dailyRedemptions,
      }
    } catch (error) {
      logger.error('Failed to get redemption stats', { error, filters })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Check if a voucher exists
   */
  async voucherExists(voucherId: string): Promise<boolean> {
    try {
      logger.debug('Checking voucher existence', { voucherId })

      const count = await this.prisma.voucher.count({
        where: { id: voucherId },
      })

      logger.debug('Voucher existence check result', { voucherId, count })

      return count > 0
    } catch (error) {
      logger.error('Failed to check voucher existence', { error, voucherId })
      throw error // Re-throw to see what's causing the 500
    }
  }

  /**
   * Helper method to convert Prisma Voucher to VoucherDocument
   */
  private convertPrismaVoucherToDocument(prismaVoucher: any): any {
    return {
      ...prismaVoucher,
      state: prismaVoucher.state as string,
      type: prismaVoucher.type as string,
    }
  }
}
