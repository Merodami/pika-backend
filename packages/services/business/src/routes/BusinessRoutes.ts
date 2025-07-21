import { businessPublic, shared } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { TranslationClient } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { BusinessController } from '../controllers/BusinessController.js'
import { BusinessRepository } from '../repositories/BusinessRepository.js'
import { BusinessService } from '../services/BusinessService.js'

/**
 * Creates public business routes
 */
export function createBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache)
  const controller = new BusinessController(service)

  // Public routes (no auth required)
  // GET /businesses - List all active businesses
  router.get(
    '/',
    validateQuery(businessPublic.BusinessQueryParams),
    controller.getAllBusinesses,
  )

  // GET /businesses/:id - Get business by ID
  router.get(
    '/:id',
    validateParams(businessPublic.BusinessPathParams),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessById,
  )

  // GET /businesses/user/:id - Get business by user ID
  router.get(
    '/user/:id',
    validateParams(shared.UserIdParam),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessByUserId,
  )

  // Business owner routes (require auth and business role)
  // GET /businesses/me - Get current user's business
  router.get(
    '/me',
    requireAuth(),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getMyBusiness,
  )

  // POST /businesses/me - Create business for current user
  router.post(
    '/me',
    requireAuth(),
    validateBody(businessPublic.CreateMyBusinessRequest),
    controller.createMyBusiness,
  )

  // PUT /businesses/me - Update current user's business
  router.put(
    '/me',
    requireAuth(),
    validateBody(businessPublic.UpdateMyBusinessRequest),
    controller.updateMyBusiness,
  )

  return router
}
