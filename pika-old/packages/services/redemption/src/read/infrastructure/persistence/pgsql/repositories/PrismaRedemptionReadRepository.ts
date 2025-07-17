import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'
import type { Redemption } from '@redemption-read/domain/entities/Redemption.js'
import type { RedemptionStats } from '@redemption-read/domain/entities/RedemptionView.js'
import type { RedemptionReadRepositoryPort } from '@redemption-read/domain/port/redemption/RedemptionReadRepositoryPort.js'
import type { RedemptionSearchQuery } from '@redemption-read/domain/queries/RedemptionQuery.js'

import { RedemptionDocumentMapper } from '../mappers/RedemptionDocumentMapper.js'

/**
 * Prisma implementation of RedemptionReadRepository
 */
export class PrismaRedemptionReadRepository
  implements RedemptionReadRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get redemption by ID
   */
  async getRedemptionById(id: string): Promise<Redemption | null> {
    try {
      const result = await this.prisma.voucherRedemption.findUnique({
        where: { id },
        include: {
          voucher: {
            include: {
              provider: true,
            },
          },
          user: true,
        },
      })

      return result
        ? RedemptionDocumentMapper.mapDocumentToDomain(result as any)
        : null
    } catch (error) {
      logger.error('Error getting redemption by ID', { error, id })

      throw ErrorFactory.databaseError(
        'get_redemption_by_id',
        'Failed to get redemption by ID',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getRedemptionById',
        },
      )
    }
  }

  /**
   * Get all redemptions (admin only)
   */
  async getAllRedemptions(
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    try {
      const {
        page = 1,
        limit = 20,
        fromDate,
        toDate,
        voucherId,
        providerId,
        customerId,
        offlineRedemption,
      } = query
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {}

      if (fromDate || toDate) {
        where.redeemedAt = {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      }

      if (voucherId) where.voucherId = voucherId
      if (customerId) where.userId = customerId

      // Handle providerId through voucher relation
      if (providerId) {
        where.voucher = { providerId }
      }

      // Handle offlineRedemption through metadata
      if (offlineRedemption !== undefined) {
        where.metadata = {
          path: ['offlineRedemption'],
          equals: offlineRedemption,
        }
      }

      // Get total count
      const total = await this.prisma.voucherRedemption.count({ where })

      // Get paginated results
      const results = await this.prisma.voucherRedemption.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { redeemedAt: 'desc' },
        include: {
          voucher: {
            include: {
              provider: true,
            },
          },
          user: true,
        },
      })

      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data: results.map((result) =>
          RedemptionDocumentMapper.mapDocumentToDomain(result as any),
        ),
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error getting all redemptions', { error, query })

      throw ErrorFactory.databaseError(
        'get_all_redemptions',
        'Failed to get all redemptions',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getAllRedemptions',
        },
      )
    }
  }

  /**
   * Get redemptions by provider
   */
  async getRedemptionsByProvider(
    providerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    try {
      const { page = 1, limit = 20, fromDate, toDate, voucherId } = query
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {
        voucher: { providerId },
      }

      if (fromDate || toDate) {
        where.redeemedAt = {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      }

      if (voucherId) where.voucherId = voucherId

      // Get total count
      const total = await this.prisma.voucherRedemption.count({ where })

      // Get paginated results
      const results = await this.prisma.voucherRedemption.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { redeemedAt: 'desc' },
        include: {
          voucher: {
            include: {
              provider: true,
            },
          },
          user: true,
        },
      })

      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data: results.map((result) =>
          RedemptionDocumentMapper.mapDocumentToDomain(result as any),
        ),
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error getting redemptions by provider', {
        error,
        providerId,
        query,
      })

      throw ErrorFactory.databaseError(
        'get_redemptions_by_provider',
        'Failed to get redemptions by provider',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getRedemptionsByProvider',
        },
      )
    }
  }

  /**
   * Get redemptions by customer
   */
  async getRedemptionsByCustomer(
    customerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    try {
      const { page = 1, limit = 20, fromDate, toDate, providerId } = query
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {
        userId: customerId,
      }

      if (fromDate || toDate) {
        where.redeemedAt = {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      }

      if (providerId) {
        where.voucher = { providerId }
      }

      // Get total count
      const total = await this.prisma.voucherRedemption.count({ where })

      // Get paginated results
      const results = await this.prisma.voucherRedemption.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { redeemedAt: 'desc' },
        include: {
          voucher: {
            include: {
              provider: true,
            },
          },
          user: true,
        },
      })

      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data: results.map((result) =>
          RedemptionDocumentMapper.mapDocumentToDomain(result as any),
        ),
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error getting redemptions by customer', {
        error,
        customerId,
        query,
      })

      throw ErrorFactory.databaseError(
        'get_redemptions_by_customer',
        'Failed to get redemptions by customer',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getRedemptionsByCustomer',
        },
      )
    }
  }

  /**
   * Get redemptions by voucher
   */
  async getRedemptionsByVoucher(
    voucherId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'redeemedAt',
        sortOrder = 'desc',
      } = query

      const whereClause: any = {
        voucherId,
      }

      if (query.fromDate || query.toDate) {
        whereClause.redeemedAt = {}
        if (query.fromDate) whereClause.redeemedAt.gte = query.fromDate
        if (query.toDate) whereClause.redeemedAt.lte = query.toDate
      }

      if (query.offlineRedemption !== undefined) {
        whereClause.metadata = {
          path: '$.offlineRedemption',
          equals: query.offlineRedemption,
        }
      }

      const [total, results] = await Promise.all([
        this.prisma.voucherRedemption.count({ where: whereClause }),
        this.prisma.voucherRedemption.findMany({
          where: whereClause,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            voucher: {
              include: {
                provider: true,
              },
            },
            user: true,
          },
        }),
      ])

      const pages = Math.ceil(total / limit)

      return {
        data: results.map((result) =>
          RedemptionDocumentMapper.mapDocumentToDomain(result as any),
        ),
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error getting redemptions by voucher', { error, voucherId })

      throw ErrorFactory.databaseError(
        'get_redemptions_by_voucher',
        'Failed to get redemptions by voucher',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getRedemptionsByVoucher',
        },
      )
    }
  }

  /**
   * Get redemption statistics for a provider
   */
  async getProviderStats(
    providerId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<RedemptionStats> {
    try {
      const whereClause: any = {
        voucher: {
          providerId,
        },
      }

      if (fromDate || toDate) {
        whereClause.redeemedAt = {}
        if (fromDate) whereClause.redeemedAt.gte = fromDate
        if (toDate) whereClause.redeemedAt.lte = toDate
      }

      const [totalRedemptions, uniqueCustomers, topVouchers] =
        await Promise.all([
          this.prisma.voucherRedemption.count({ where: whereClause }),
          this.prisma.voucherRedemption.groupBy({
            by: ['userId'],
            where: whereClause,
            _count: true,
          }),
          this.prisma.voucherRedemption.groupBy({
            by: ['voucherId'],
            where: whereClause,
            _count: {
              _all: true,
            },
            orderBy: {
              _count: {
                voucherId: 'desc',
              },
            },
            take: 10,
          }),
        ])

      // Get voucher details for top vouchers
      const voucherIds = topVouchers.map((v) => v.voucherId)
      const vouchers = await this.prisma.voucher.findMany({
        where: { id: { in: voucherIds } },
        select: { id: true, title: true },
      })

      const voucherMap = new Map(vouchers.map((v) => [v.id, v]))

      // Calculate date range for daily average
      const dateRange =
        toDate && fromDate
          ? Math.ceil(
              (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
            )
          : 30 // Default to 30 days

      const averageRedemptionsPerDay = totalRedemptions / dateRange

      return {
        totalRedemptions,
        uniqueCustomers: uniqueCustomers.length,
        averageRedemptionsPerDay,
        topVouchers: topVouchers.map((v) => ({
          voucherId: v.voucherId,
          voucherTitle:
            (voucherMap.get(v.voucherId)?.title as any)?.es || 'Unknown',
          redemptionCount: v._count._all,
        })),
        redemptionsByHour: {}, // TODO: Implement hourly breakdown
        redemptionsByDayOfWeek: {}, // TODO: Implement day of week breakdown
      }
    } catch (error) {
      logger.error('Error getting provider stats', { error, providerId })

      throw ErrorFactory.databaseError(
        'get_provider_stats',
        'Failed to get provider stats',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getProviderStats',
        },
      )
    }
  }

  /**
   * Get redemption statistics for a voucher
   */
  async getVoucherStats(voucherId: string): Promise<RedemptionStats> {
    try {
      const whereClause = { voucherId }

      const [totalRedemptions, uniqueCustomers, redemptionsByHour] =
        await Promise.all([
          this.prisma.voucherRedemption.count({ where: whereClause }),
          this.prisma.voucherRedemption.groupBy({
            by: ['userId'],
            where: whereClause,
            _count: true,
          }),
          this.prisma.$queryRaw`
          SELECT 
            EXTRACT(HOUR FROM "redeemedAt") as hour,
            COUNT(*) as count
          FROM "VoucherRedemption"
          WHERE "voucherId" = ${voucherId}
          GROUP BY hour
          ORDER BY hour
        ` as Promise<Array<{ hour: number; count: bigint }>>,
        ])

      const redemptionsByDayOfWeek = await this.prisma.$queryRaw<
        Array<{ day_of_week: number; count: bigint }>
      >`
        SELECT 
          EXTRACT(DOW FROM "redeemedAt") as day_of_week,
          COUNT(*) as count
        FROM "VoucherRedemption"
        WHERE "voucherId" = ${voucherId}
        GROUP BY day_of_week
        ORDER BY day_of_week
      `

      // Convert query results to proper format
      const hourlyData: Record<number, number> = {}

      redemptionsByHour.forEach((row: { hour: number; count: bigint }) => {
        hourlyData[Number(row.hour)] = Number(row.count)
      })

      const dayOfWeekData: Record<number, number> = {}

      redemptionsByDayOfWeek.forEach(
        (row: { day_of_week: number; count: bigint }) => {
          dayOfWeekData[Number(row.day_of_week)] = Number(row.count)
        },
      )

      return {
        totalRedemptions,
        uniqueCustomers: uniqueCustomers.length,
        averageRedemptionsPerDay: 0, // Not meaningful for single voucher
        topVouchers: [], // Not applicable for single voucher
        redemptionsByHour: hourlyData,
        redemptionsByDayOfWeek: dayOfWeekData,
      }
    } catch (error) {
      logger.error('Error getting voucher stats', { error, voucherId })

      throw ErrorFactory.databaseError(
        'get_voucher_stats',
        'Failed to get voucher stats',
        error,
        {
          source: 'PrismaRedemptionReadRepository.getVoucherStats',
        },
      )
    }
  }
}
