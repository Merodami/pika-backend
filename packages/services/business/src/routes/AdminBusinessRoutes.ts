import { AdminBusinessController } from '@business/controllers/AdminBusinessController.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessService } from '@business/services/BusinessService.js'
import { businessAdmin, businessCommon } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

/**
 * Creates admin business routes
 */
export function createAdminBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver?: TranslationResolver,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache, translationResolver)
  const controller = new AdminBusinessController(service)

  // All routes require authentication
  router.use(requireAuth())

  // GET /admin/businesses - List all businesses with admin filters
  router.get(
    '/',
    requirePermissions('admin:businesses'),
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getAllBusinesses,
  )

  // GET /admin/businesses/:id - Get business by ID with full details
  router.get(
    '/:id',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getBusinessById,
  )

  // POST /admin/businesses - Create new business
  router.post(
    '/',
    requirePermissions('admin:businesses'),
    validateBody(businessAdmin.AdminCreateBusinessRequest),
    controller.createBusiness,
  )

  // PATCH /admin/businesses/:id - Update business
  router.patch(
    '/:id',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.AdminUpdateBusinessRequest),
    controller.updateBusiness,
  )

  // DELETE /admin/businesses/:id - Delete business
  router.delete(
    '/:id',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    controller.deleteBusiness,
  )

  // POST /admin/businesses/:id/verify - Verify business
  router.post(
    '/:id/verify',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.AdminToggleBusinessVerificationRequest),
    controller.verifyBusiness,
  )

  // POST /admin/businesses/:id/deactivate - Deactivate business
  router.post(
    '/:id/deactivate',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    controller.deactivateBusiness,
  )

  // POST /admin/businesses/:id/activate - Activate business
  router.post(
    '/:id/activate',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    controller.activateBusiness,
  )

  // POST /admin/businesses/:id/rating - Update business rating
  router.post(
    '/:id/rating',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.AdminUpdateBusinessRatingRequest),
    controller.updateBusinessRating,
  )

  // POST /admin/businesses/:id/approve - Approve or reject business
  router.post(
    '/:id/approve',
    requirePermissions('admin:businesses'),
    validateParams(businessCommon.BusinessIdParam),
    validateBody(businessAdmin.AdminBusinessApprovalRequest),
    controller.approveBusiness,
  )

  return router
}
