import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'

import { CACHE_KEYS } from '../constants/cache-keys.js'
import type {
  IRedemptionAnalyticsRepository,
  RedemptionHistoryFilters,
  RedemptionHistoryRecord,
  RedemptionStats,
  RedemptionStatsFilters,
} from '../repositories/RedemptionAnalyticsRepository.js'

export interface IRedemptionAnalyticsService {
  getRedemptionHistory(
    filters: RedemptionHistoryFilters,
    pagination?: { page: number; limit: number },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>>
  getRedemptionStats(filters: RedemptionStatsFilters): Promise<RedemptionStats>
  getBusinessRedemptionStats(
    businessId: string,
    filters: Omit<RedemptionStatsFilters, 'businessId'>,
  ): Promise<RedemptionStats>
  getUserRedemptionHistory(
    userId: string,
    filters: Omit<RedemptionHistoryFilters, 'userId'>,
    pagination?: { page: number; limit: number },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>>
  getVoucherRedemptionHistory(
    voucherId: string,
    filters: Omit<RedemptionHistoryFilters, 'voucherId'>,
    pagination?: { page: number; limit: number },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>>
}

export class RedemptionAnalyticsService implements IRedemptionAnalyticsService {
  constructor(
    private readonly repository: IRedemptionAnalyticsRepository,
    private readonly cache: ICacheService,
  ) {}

  /**
   * Get redemption history with optional filters
   */
  @Cache({
    ttl: 300, // 5 minutes cache for analytics data
    prefix: 'redemption-history',
  })
  async getRedemptionHistory(
    filters: RedemptionHistoryFilters,
    pagination = { page: 1, limit: PAGINATION_DEFAULT_LIMIT },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>> {
    try {
      logger.info('Fetching redemption history', { filters, pagination })

      const result = await this.repository.getRedemptionHistory(
        filters,
        pagination,
      )

      logger.info('Redemption history fetched successfully', {
        totalRecords: result.pagination.total,
        page: result.pagination.page,
      })

      return result
    } catch (error) {
      logger.error('Failed to get redemption history', { error, filters })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemption statistics for analytics
   */
  @Cache({
    ttl: 600, // 10 minutes cache for stats
    prefix: 'redemption-stats',
  })
  async getRedemptionStats(
    filters: RedemptionStatsFilters,
  ): Promise<RedemptionStats> {
    try {
      logger.info('Fetching redemption statistics', { filters })

      const stats = await this.repository.getRedemptionStats(filters)

      logger.info('Redemption statistics fetched successfully', {
        totalRedemptions: stats.totalRedemptions,
        uniqueUsers: stats.uniqueUsers,
        totalValue: stats.totalDiscountValue,
      })

      return stats
    } catch (error) {
      logger.error('Failed to get redemption stats', { error, filters })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemption statistics for a specific business
   */
  async getBusinessRedemptionStats(
    businessId: string,
    filters: Omit<RedemptionStatsFilters, 'businessId'>,
  ): Promise<RedemptionStats> {
    try {
      const cacheKey = `${CACHE_KEYS.ADMIN.STATS}:business:${businessId}`

      // Try to get from cache first
      const cached = await this.cache.get<RedemptionStats>(cacheKey)

      if (cached) {
        logger.debug('Returning cached business redemption stats', {
          businessId,
        })

        return cached
      }

      // Fetch from repository
      const stats = await this.repository.getRedemptionStats({
        ...filters,
        businessId,
      })

      // Cache the results
      await this.cache.set(cacheKey, stats, 600) // 10 minutes

      return stats
    } catch (error) {
      logger.error('Failed to get business redemption stats', {
        error,
        businessId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemption history for a specific user
   */
  async getUserRedemptionHistory(
    userId: string,
    filters: Omit<RedemptionHistoryFilters, 'userId'>,
    pagination = { page: 1, limit: PAGINATION_DEFAULT_LIMIT },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>> {
    try {
      logger.info('Fetching user redemption history', { userId, filters })

      const result = await this.repository.getRedemptionHistory(
        {
          ...filters,
          userId,
        },
        pagination,
      )

      return result
    } catch (error) {
      logger.error('Failed to get user redemption history', {
        error,
        userId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get redemption history for a specific voucher
   */
  async getVoucherRedemptionHistory(
    voucherId: string,
    filters: Omit<RedemptionHistoryFilters, 'voucherId'>,
    pagination = { page: 1, limit: PAGINATION_DEFAULT_LIMIT },
  ): Promise<PaginatedResult<RedemptionHistoryRecord>> {
    try {
      logger.info('Fetching voucher redemption history', { voucherId, filters })

      // First check if we get any results - if empty and no error, voucher might not exist
      // For now, let the repository handle this naturally

      const result = await this.repository.getRedemptionHistory(
        {
          ...filters,
          voucherId,
        },
        pagination,
      )

      // TODO: Add voucher existence validation
      // For now, return empty results for non-existent vouchers

      return result
    } catch (error) {
      logger.error('Failed to get voucher redemption history', {
        error,
        voucherId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Invalidate cache for redemption analytics
   */
  private async invalidateCache(pattern?: string): Promise<void> {
    try {
      const keys = pattern
        ? `${CACHE_KEYS.REDEMPTION.LIST}:${pattern}:*`
        : `${CACHE_KEYS.REDEMPTION.LIST}:*`

      await this.cache.delPattern(keys)
      logger.debug('Cache invalidated for redemption analytics', { pattern })
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error, pattern })
    }
  }
}
