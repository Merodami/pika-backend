import { subscriptionPublic } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { PaymentServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { PlanController } from '../controllers/PlanController.js'
import { PlanRepository } from '../repositories/PlanRepository.js'
import { PlanService } from '../services/PlanService.js'

export function createPlanRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  paymentClient: PaymentServiceClient,
): Router {
  const router = Router()

  // Initialize repository
  const planRepository = new PlanRepository(prisma, cache)

  // Initialize service
  const planService = new PlanService(planRepository, cache, paymentClient)

  // Initialize controller
  const controller = new PlanController(planService)

  // Plan routes - public access for viewing
  router.get(
    '/',
    validateQuery(subscriptionPublic.SubscriptionPlanQueryParams),
    controller.getPlans,
  )

  router.get(
    '/:id',
    validateParams(subscriptionPublic.PlanIdParam),
    controller.getPlanById,
  )

  // Admin routes
  router.post(
    '/',
    requireAuth(),
    requirePermissions('admin:subscriptions'),
    validateBody(subscriptionPublic.CreateSubscriptionPlanRequest),
    controller.createPlan,
  )

  router.put(
    '/:id',
    requireAuth(),
    requirePermissions('admin:subscriptions'),
    validateParams(subscriptionPublic.PlanIdParam),
    validateBody(subscriptionPublic.UpdateSubscriptionPlanRequest),
    controller.updatePlan,
  )

  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('admin:subscriptions'),
    validateParams(subscriptionPublic.PlanIdParam),
    controller.deletePlan,
  )

  router.post(
    '/sync',
    requireAuth(),
    requirePermissions('admin:subscriptions'),
    controller.syncPlans,
  )

  return router
}
