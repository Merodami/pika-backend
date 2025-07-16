import type { PrismaClient } from '@prisma/client'
import {
  AdminGetSubscriptionsQuery,
  ProcessSubscriptionCreditsRequest,
  SubscriptionIdParam,
} from '@pika/api/admin'
import {
  CancelSubscriptionRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@pikaublic'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika
import type { ICacheService } from '@pika'
import { CommunicationServiceClient } from '@pikad'
import { SubscriptionController } from '@subscription/controllers/SubscriptionController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { SubscriptionRepository } from '@subscription/repositories/SubscriptionRepository.js'
import { CreditProcessingService } from '@subscription/services/CreditProcessingService.js'
import { SubscriptionService } from '@subscription/services/SubscriptionService.js'
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
  const creditProcessingService = new CreditProcessingService(
    prisma,
    cache,
    communicationClient,
  )
  const subscriptionService = new SubscriptionService(
    prisma,
    subscriptionRepository,
    planRepository,
    creditProcessingService,
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

  // Credit processing route
  router.post(
    '/:id/process-credits',
    requireAdmin(),
    validateParams(SubscriptionIdParam),
    validateBody(ProcessSubscriptionCreditsRequest),
    controller.processSubscriptionCredits,
  )

  // Admin routes
  router.get(
    '/',
    requireAdmin(),
    validateQuery(AdminGetSubscriptionsQuery),
    controller.getSubscriptions,
  )

  return router
}
