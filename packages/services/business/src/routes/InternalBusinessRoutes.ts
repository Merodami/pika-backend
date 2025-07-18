import type { PrismaClient } from '@prisma/client'
import { businessInternal, businessPublic, shared } from '@pika/api'
import {
  requireInternalAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
import { Router } from 'express'

import { InternalBusinessController } from '../controllers/InternalBusinessController.js'
import { BusinessRepository } from '../repositories/BusinessRepository.js'
import { BusinessService } from '../services/BusinessService.js'

/**
 * Creates internal business routes for service-to-service communication
 */
export function createInternalBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache)
  const controller = new InternalBusinessController(service)

  // All routes require internal authentication
  router.use(requireInternalAuth())

  // GET /internal/businesses/:id - Get business by ID
  router.get(
    '/:id',
    validateParams(businessPublic.BusinessPathParams),
    validateQuery(businessInternal.GetBusinessRequest),
    controller.getBusinessById,
  )

  // GET /internal/businesses/user/:id - Get business by user ID
  router.get(
    '/user/:id',
    validateParams(shared.UserIdParam),
    validateQuery(businessInternal.GetBusinessRequest),
    controller.getBusinessByUserId,
  )

  // POST /internal/businesses/batch - Get multiple businesses by IDs
  router.post(
    '/batch',
    validateBody(businessInternal.GetBusinessesByIdsRequest),
    controller.getBusinessesByIds,
  )

  // GET /internal/businesses/category/:categoryId - Get businesses by category
  router.get(
    '/category/:categoryId',
    validateParams(shared.CategoryIdParam),
    validateQuery(businessInternal.GetBusinessesByCategoryRequest),
    controller.getBusinessesByCategory,
  )

  return router
}
