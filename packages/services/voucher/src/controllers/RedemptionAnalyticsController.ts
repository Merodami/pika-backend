import { businessCommon, userAdmin, voucherCommon } from '@pika/api'
import {
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
} from '@pika/http'
import { logger } from '@pika/shared'
import { VoucherRedemptionMethod, VoucherRedemptionType } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type {
  RedemptionHistoryFilters,
  RedemptionStatsFilters,
} from '../repositories/RedemptionAnalyticsRepository.js'
import type { IRedemptionAnalyticsService } from '../services/RedemptionAnalyticsService.js'

// Query parameter types
type RedemptionHistoryQuery = {
  voucherId?: string
  userId?: string
  businessId?: string
  startDate?: Date
  endDate?: Date
  redemptionType?: VoucherRedemptionType
  redemptionMethod?: VoucherRedemptionMethod
  page: number
  limit: number
}

type RedemptionStatsQuery = {
  businessId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * Handles redemption analytics operations
 */
export class RedemptionAnalyticsController {
  constructor(private readonly analyticsService: IRedemptionAnalyticsService) {
    // Bind methods to preserve 'this' context
    this.getRedemptionHistory = this.getRedemptionHistory.bind(this)
    this.getRedemptionStats = this.getRedemptionStats.bind(this)
    this.getBusinessRedemptionStats = this.getBusinessRedemptionStats.bind(this)
    this.getUserRedemptionHistory = this.getUserRedemptionHistory.bind(this)
    this.getVoucherRedemptionHistory =
      this.getVoucherRedemptionHistory.bind(this)
  }

  /**
   * GET /admin/vouchers/redemptions/history
   * Get redemption history with filters and pagination
   */
  async getRedemptionHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<RedemptionHistoryQuery>(req)
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin fetching redemption history', {
        adminUserId,
        filters: query,
      })

      // Map query to service filters
      const filters: RedemptionHistoryFilters = {
        voucherId: query.voucherId,
        userId: query.userId,
        businessId: query.businessId,
        startDate: query.startDate,
        endDate: query.endDate,
        redemptionType: query.redemptionType,
        redemptionMethod: query.redemptionMethod,
      }

      const pagination = {
        page: query.page,
        limit: query.limit,
      }

      const result = await this.analyticsService.getRedemptionHistory(
        filters,
        pagination,
      )

      // Use paginatedResponse utility
      const responseData = paginatedResponse(result, (record) => ({
        id: record.id,
        voucherId: record.voucherId,
        userId: record.userId,
        redeemedAt: record.redeemedAt,
        codeUsed: record.codeUsed,
        metadata: record.metadata,
        voucher: record.voucher,
        user: record.user,
      }))

      res.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/redemptions/stats
   * Get redemption statistics
   */
  async getRedemptionStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<RedemptionStatsQuery>(req)
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin fetching redemption statistics', {
        adminUserId,
        filters: query,
      })

      // Map query to service filters
      const filters: RedemptionStatsFilters = {
        businessId: query.businessId,
        startDate: query.startDate,
        endDate: query.endDate,
      }

      const stats = await this.analyticsService.getRedemptionStats(filters)

      res.json({
        totalRedemptions: stats.totalRedemptions,
        uniqueUsers: stats.uniqueUsers,
        totalDiscountValue: stats.totalDiscountValue,
        byType: stats.byType,
        byMethod: stats.byMethod,
        dailyRedemptions: stats.dailyRedemptions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/redemptions/business/:businessId/stats
   * Get business-specific redemption statistics
   */
  async getBusinessRedemptionStats(
    req: Request<businessCommon.BusinessIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query = getValidatedQuery<RedemptionStatsQuery>(req)
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const userRole = context?.role?.toString().toLowerCase()

      logger.info('Fetching business redemption statistics', {
        userId,
        userRole,
        businessId,
        filters: query,
      })

      // TODO: Add proper business ownership validation
      // Business owners should only access their own business statistics
      // This requires checking if the business belongs to the current user
      if (userRole === 'business') {
        // For now, let the service layer handle the filtering by userId
        // TODO: Implement proper business ownership validation
      }

      const stats = await this.analyticsService.getBusinessRedemptionStats(
        businessId,
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      )

      res.json({
        businessId,
        totalRedemptions: stats.totalRedemptions,
        uniqueUsers: stats.uniqueUsers,
        totalDiscountValue: stats.totalDiscountValue,
        byType: stats.byType,
        byMethod: stats.byMethod,
        dailyRedemptions: stats.dailyRedemptions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/redemptions/user/:userId/history
   * Get user-specific redemption history
   */
  async getUserRedemptionHistory(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const query = getValidatedQuery<RedemptionHistoryQuery>(req)
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      logger.info('Admin fetching user redemption history', {
        adminUserId,
        userId,
        filters: query,
      })

      const filters: Omit<RedemptionHistoryFilters, 'userId'> = {
        voucherId: query.voucherId,
        businessId: query.businessId,
        startDate: query.startDate,
        endDate: query.endDate,
        redemptionType: query.redemptionType,
        redemptionMethod: query.redemptionMethod,
      }

      const pagination = {
        page: query.page,
        limit: query.limit,
      }

      const result = await this.analyticsService.getUserRedemptionHistory(
        userId,
        filters,
        pagination,
      )

      // Use paginatedResponse utility
      const responseData = paginatedResponse(result, (record) => ({
        id: record.id,
        voucherId: record.voucherId,
        userId: record.userId,
        redeemedAt: record.redeemedAt,
        codeUsed: record.codeUsed,
        metadata: record.metadata,
        voucher: record.voucher,
        user: record.user,
      }))

      res.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id/redemptions/history
   * Get voucher-specific redemption history
   */
  async getVoucherRedemptionHistory(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query = getValidatedQuery<RedemptionHistoryQuery>(req)
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const userRole = context?.role?.toString().toLowerCase()

      logger.info('Fetching voucher redemption history', {
        userId,
        userRole,
        voucherId,
        filters: query,
      })

      // TODO: Add proper voucher ownership validation for business users
      // For business owners, we need to validate they own the voucher
      if (userRole === 'business') {
        // TODO: Implement proper voucher ownership validation
        // This requires checking if the voucher belongs to the current user's business
        // For now, let the service layer handle access control
      }

      const filters: Omit<RedemptionHistoryFilters, 'voucherId'> = {
        userId: query.userId,
        businessId: query.businessId,
        startDate: query.startDate,
        endDate: query.endDate,
        redemptionType: query.redemptionType,
        redemptionMethod: query.redemptionMethod,
      }

      const pagination = {
        page: query.page,
        limit: query.limit,
      }

      const result = await this.analyticsService.getVoucherRedemptionHistory(
        voucherId,
        filters,
        pagination,
      )

      // Use paginatedResponse utility
      const responseData = paginatedResponse(result, (record) => ({
        id: record.id,
        voucherId: record.voucherId,
        userId: record.userId,
        redeemedAt: record.redeemedAt,
        codeUsed: record.codeUsed,
        metadata: record.metadata,
        voucher: record.voucher,
        user: record.user,
      }))

      res.json(responseData)
    } catch (error) {
      next(error)
    }
  }
}
