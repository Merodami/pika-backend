import { subscriptionAdmin, subscriptionPublic } from '@pika/api'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { SubscriptionController } from '../controllers/SubscriptionController.js'
import { PlanRepository } from '../repositories/PlanRepository.js'
import { SubscriptionRepository } from '../repositories/SubscriptionRepository.js'
import { SubscriptionService } from '../services/SubscriptionService.js'

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
    validateBody(subscriptionPublic.CreateSubscriptionRequest),
    controller.createSubscription,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(subscriptionAdmin.SubscriptionIdParam),
    controller.getSubscriptionById,
  )

  router.put(
    '/:id',
    requireAuth(),
    validateParams(subscriptionAdmin.SubscriptionIdParam),
    validateBody(subscriptionPublic.UpdateSubscriptionRequest),
    controller.updateSubscription,
  )

  router.post(
    '/:id/cancel',
    requireAuth(),
    validateParams(subscriptionAdmin.SubscriptionIdParam),
    validateBody(subscriptionPublic.CancelSubscriptionRequest),
    controller.cancelSubscription,
  )

  router.post(
    '/:id/reactivate',
    requireAuth(),
    validateParams(subscriptionAdmin.SubscriptionIdParam),
    controller.reactivateSubscription,
  )

  // Credit processing route removed - no credit tables in database

  // Admin routes
  router.get(
    '/',
    requireAdmin(),
    validateQuery(subscriptionAdmin.AdminGetSubscriptionsQuery),
    controller.getSubscriptions,
  )

  return router
}
