import { businessCommon, shared, voucherAdmin, voucherCommon } from '@pika/api'
import { requirePermissions, validateParams, validateQuery } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { RedemptionAnalyticsController } from '../controllers/RedemptionAnalyticsController.js'
import { RedemptionAnalyticsRepository } from '../repositories/RedemptionAnalyticsRepository.js'
import { RedemptionAnalyticsService } from '../services/RedemptionAnalyticsService.js'

/**
 * Creates redemption analytics routes for admin and business owners
 * Uses granular permissions for redemption analytics and reports
 */
export function createRedemptionAnalyticsRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new RedemptionAnalyticsRepository(prisma)
  const service = new RedemptionAnalyticsService(repository, cache)
  const controller = new RedemptionAnalyticsController(service)

  // GET /admin/vouchers/redemptions/history - Get redemption history with filters
  // Only admins can access all redemption history
  router.get(
    '/redemptions/history',
    requirePermissions('redemption-reports:read'),
    validateQuery(voucherAdmin.RedemptionHistoryQueryParams),
    controller.getRedemptionHistory,
  )

  // GET /admin/vouchers/redemptions/stats - Get redemption statistics
  // Only admins can access global redemption statistics
  router.get(
    '/redemptions/stats',
    requirePermissions('redemption-analytics:read'),
    validateQuery(voucherAdmin.RedemptionStatsQueryParams),
    controller.getRedemptionStats,
  )

  // GET /admin/vouchers/redemptions/business/:businessId/stats - Get business redemption statistics
  // Admin: can access any business, Business: can only access their own (permission check in controller)
  router.get(
    '/redemptions/business/:id/stats',
    requirePermissions('redemption-analytics:read', 'redemption-analytics:read:own'),
    validateParams(businessCommon.BusinessIdParam),
    validateQuery(voucherAdmin.RedemptionStatsQueryParams),
    controller.getBusinessRedemptionStats,
  )

  // GET /admin/vouchers/redemptions/user/:userId/history - Get user redemption history
  // Only admins can access user-specific redemption history
  router.get(
    '/redemptions/user/:id/history',
    requirePermissions('redemption-reports:read'),
    validateParams(shared.UserIdParam),
    validateQuery(voucherAdmin.RedemptionHistoryQueryParams),
    controller.getUserRedemptionHistory,
  )

  // GET /admin/vouchers/:id/redemptions/history - Get voucher-specific redemption history
  // Admin: can access any voucher, Business: can only access their own vouchers (permission check in controller)
  router.get(
    '/:id/redemptions/history',
    requirePermissions('redemption-reports:read', 'redemption-reports:read:own'),
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherAdmin.RedemptionHistoryQueryParams),
    controller.getVoucherRedemptionHistory,
  )

  return router
}
