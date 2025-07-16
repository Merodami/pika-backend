import type { PrismaClient } from '@prisma/client'
import {
  AdminGetSubscriptionsQuery,
  SubscriptionIdParam,
} from '@pika/api/admin'
import {
  CancelSubscriptionRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@pika/api/public'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient } from '@pika/shared'
import { SubscriptionController } from '../controllers/SubscriptionController.js'
import { PlanRepository } from '../repositories/PlanRepository.js'
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js'
import { SubscriptionService } from '../services/SubscriptionService.js'
import { Router } from 'express'

export function createSubscriptionRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repositories
  const subscriptionRepository = new SubscriptionRepository(prisma, cache)
  const planRepository = new PlanRepository(prisma, cache)

  // Initialize services
  const communicationClient = new CommunicationServiceClient()
  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    cache,
    communicationClient,
  )

  // Initialize controller
  const controller = new SubscriptionController(subscriptionService)

  // User routes
  router.get('/me', requireAuth(), controller.getUserSubscription)

  router.post(
    '/',
    requireAuth(),
    validateBody(CreateSubscriptionRequest),
    controller.createSubscription,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(SubscriptionIdParam),
    controller.getSubscriptionById,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(SubscriptionIdParam),
    validateBody(UpdateSubscriptionRequest),
    controller.updateSubscription,
  )

  router.post(
    '/:id/cancel',
    requireAuth(),
    validateParams(SubscriptionIdParam),
    validateBody(CancelSubscriptionRequest),
    controller.cancelSubscription,
  )

  router.post(
    '/:id/reactivate',
    requireAuth(),
    validateParams(SubscriptionIdParam),
    controller.reactivateSubscription,
  )

  // Credit processing route removed - no credit tables in database

  // Admin routes
  router.get(
    '/',
    requireAdmin(),
    validateQuery(AdminGetSubscriptionsQuery),
    controller.getSubscriptions,
  )

  return router
}
