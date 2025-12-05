import { BusinessSettingsController } from '@business/controllers/BusinessSettingsController.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessSettingsRepository } from '@business/repositories/BusinessSettingsRepository.js'
import { BusinessSettingsService } from '@business/services/BusinessSettingsService.js'
import { businessBusiness } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

/**
 * Creates business settings routes for business owners
 * These routes allow business owners to manage their own business settings
 */
export function createBusinessSettingsRoutes(
  prisma: PrismaClient,
  cache?: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const businessRepository = new BusinessRepository(prisma)
  const businessSettingsRepository = new BusinessSettingsRepository(prisma)
  const service = new BusinessSettingsService(
    businessSettingsRepository,
    businessRepository,
    cache,
  )
  const controller = new BusinessSettingsController(service)

  // Business owner routes - manage own business settings
  // GET /businesses/:id/settings - Get business settings
  router.get(
    '/:id/settings',
    requireAuth(),
    requirePermissions('businesses:read:own'),
    validateParams(businessBusiness.BusinessSettingsPathParams),
    controller.getMyBusinessSettings,
  )

  // PATCH /businesses/:id/settings - Update business settings
  router.patch(
    '/:id/settings',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateParams(businessBusiness.BusinessSettingsPathParams),
    validateBody(businessBusiness.UpdateBusinessSettingsRequest),
    controller.updateMyBusinessSettings,
  )

  // POST /businesses/:id/settings/reset - Reset business settings to defaults
  router.post(
    '/:id/settings/reset',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateParams(businessBusiness.BusinessSettingsPathParams),
    validateBody(businessBusiness.ResetBusinessSettingsRequest),
    controller.resetMyBusinessSettings,
  )

  return router
}
