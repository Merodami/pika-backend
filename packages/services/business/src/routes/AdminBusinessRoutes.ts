import type { PrismaClient } from '@prisma/client'
import { businessAdmin, shared } from '@pika/api'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
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

  // All routes require authentication and admin role
  router.use(requireAuth())
  router.use(requireAdmin())

  // GET /admin/businesses - List all businesses with admin filters
  router.get(
    '/',
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getAllBusinesses,
  )

  // GET /admin/businesses/:id - Get business by ID with full details
  router.get(
    '/:id',
    validateParams(shared.BusinessIdParam),
    validateQuery(businessAdmin.AdminBusinessQueryParams),
    controller.getBusinessById,
  )

  // POST /admin/businesses - Create new business
  router.post(
    '/',
    validateBody(businessAdmin.CreateBusinessRequest),
    controller.createBusiness,
  )

  // PATCH /admin/businesses/:id - Update business
  router.patch(
    '/:id',
    validateParams(shared.BusinessIdParam),
    validateBody(businessAdmin.UpdateBusinessRequest),
    controller.updateBusiness,
  )

  // DELETE /admin/businesses/:id - Delete business
  router.delete(
    '/:id',
    validateParams(shared.BusinessIdParam),
    controller.deleteBusiness,
  )

  // POST /admin/businesses/:id/verify - Verify business
  router.post(
    '/:id/verify',
    validateParams(shared.BusinessIdParam),
    validateBody(businessAdmin.ToggleBusinessVerificationRequest),
    controller.verifyBusiness,
  )

  // POST /admin/businesses/:id/deactivate - Deactivate business
  router.post(
    '/:id/deactivate',
    validateParams(shared.BusinessIdParam),
    controller.deactivateBusiness,
  )

  // POST /admin/businesses/:id/activate - Activate business
  router.post(
    '/:id/activate',
    validateParams(shared.BusinessIdParam),
    controller.activateBusiness,
  )

  // POST /admin/businesses/:id/rating - Update business rating
  router.post(
    '/:id/rating',
    validateParams(shared.BusinessIdParam),
    validateBody(businessAdmin.UpdateBusinessRatingRequest),
    controller.updateBusinessRating,
  )

  return router
}
