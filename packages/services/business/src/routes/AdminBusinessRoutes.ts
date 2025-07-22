import { businessAdmin, businessCommon } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { AdminBusinessController } from '../controllers/AdminBusinessController.js'
import { BusinessRepository } from '../repositories/BusinessRepository.js'
import { BusinessService } from '../services/BusinessService.js'

/**
 * Creates admin business routes
 */
export function createAdminBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache)
  const controller = new AdminBusinessController(service)

  // All routes require authentication
  router.use(requireAuth())

  // GET /admin/businesses - List all businesses with admin filters
  router.get(
    '/',
    requirePermissions('businesses:read'),
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getAllBusinesses,
  )

  // GET /admin/businesses/:id - Get business by ID with full details
  router.get(
    '/:id',
    requirePermissions('businesses:read'),
    validateParams(businessCommon.BusinessIdParam),
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getBusinessById,
  )

  // POST /admin/businesses - Create new business
  router.post(
    '/',
    requirePermissions('businesses:write'),
    validateBody(businessAdmin.CreateBusinessRequest),
    controller.createBusiness,
  )

  // PATCH /admin/businesses/:id - Update business
  router.patch(
    '/:id',
    requirePermissions('businesses:write'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.UpdateBusinessRequest),
    controller.updateBusiness,
  )

  // DELETE /admin/businesses/:id - Delete business
  router.delete(
    '/:id',
    requirePermissions('businesses:delete'),
    validateParams(businessCommon.BusinessIdParam),
    controller.deleteBusiness,
  )

  // POST /admin/businesses/:id/verify - Verify business
  router.post(
    '/:id/verify',
    requirePermissions('businesses:verify'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.ToggleBusinessVerificationRequest),
    controller.verifyBusiness,
  )

  // POST /admin/businesses/:id/deactivate - Deactivate business
  router.post(
    '/:id/deactivate',
    requirePermissions('businesses:write'),
    validateParams(businessCommon.BusinessIdParam),
    controller.deactivateBusiness,
  )

  // POST /admin/businesses/:id/activate - Activate business
  router.post(
    '/:id/activate',
    requirePermissions('businesses:write'),
    validateParams(businessCommon.BusinessIdParam),
    controller.activateBusiness,
  )

  // POST /admin/businesses/:id/rating - Update business rating
  router.post(
    '/:id/rating',
    requirePermissions('businesses:write'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.UpdateBusinessRatingRequest),
    controller.updateBusinessRating,
  )

  return router
}
