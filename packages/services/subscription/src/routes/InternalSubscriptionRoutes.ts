import type { PrismaClient } from '@prisma/client'
import {
  CheckSubscriptionAccessRequest,
  ProcessSubscriptionWebhookRequest,
  SendSubscriptionNotificationRequest,
  StripeSubscriptionIdParam,
  SubscriptionByUserIdParam,
  UpdateSubscriptionFromPaymentRequest,
} from '@pika/api/internal'
import { requireServiceAuth, validateBody, validateParams } from '@pika
import type { ICacheService } from '@pika'
import { CommunicationServiceClient } from '@pikad'
import { InternalSubscriptionController } from '@subscription/controllers/InternalSubscriptionController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { SubscriptionRepository } from '@subscription/repositories/SubscriptionRepository.js'
import { CreditProcessingService } from '@subscription/services/CreditProcessingService.js'
import { SubscriptionService } from '@subscription/services/SubscriptionService.js'
import { Router } from 'express'

export function createInternalSubscriptionRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Apply service auth to all internal routes
  router.use(requireServiceAuth())

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
  const controller = new InternalSubscriptionController(
    subscriptionService,
    subscriptionRepository,
    communicationClient,
  )

  // Webhook processing
  router.post(
    '/webhook',
    validateBody(ProcessSubscriptionWebhookRequest),
    controller.processWebhook,
  )

  // Subscription updates from payment service
  router.put(
    '/update-from-payment',
    validateBody(UpdateSubscriptionFromPaymentRequest),
    controller.updateFromPayment,
  )

  // Access checks
  router.post(
    '/check-access',
    validateBody(CheckSubscriptionAccessRequest),
    controller.checkAccess,
  )

  // Get by Stripe ID
  router.get(
    '/stripe/:stripeSubscriptionId',
    validateParams(StripeSubscriptionIdParam),
    controller.getByStripeId,
  )

  // Get user subscriptions
  router.get(
    '/users/:userId/subscriptions',
    validateParams(SubscriptionByUserIdParam),
    controller.getUserSubscriptions,
  )

  // Send notification
  router.post(
    '/notify',
    validateBody(SendSubscriptionNotificationRequest),
    controller.sendNotification,
  )

  return router
}
