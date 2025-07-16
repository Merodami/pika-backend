import type { PrismaClient } from '@prisma/client'
import {
  CreateSubscriptionPlanRequest,
  PlanIdParam,
  SubscriptionPlanQueryParams,
  UpdateSubscriptionPlanRequest,
} from '@pika/api/public'
import {
  requireAdmin,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika
import type { ICacheService } from '@pika'
import { PaymentServiceClient } from '@pikad'
import { PlanController } from '@subscription/controllers/PlanController.js'
import { PlanRepository } from '@subscription/repositories/PlanRepository.js'
import { PlanService } from '@subscription/services/PlanService.js'
import { Router } from 'express'

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
    validateQuery(SubscriptionPlanQueryParams),
    controller.getPlans,
  )

  router.get('/:id', validateParams(PlanIdParam), controller.getPlanById)

  // Admin routes
  router.post(
    '/',
    requireAdmin(),
    validateBody(CreateSubscriptionPlanRequest),
    controller.createPlan,
  )

  router.put(
    '/:id',
    requireAdmin(),
    validateParams(PlanIdParam),
    validateBody(UpdateSubscriptionPlanRequest),
    controller.updatePlan,
  )

  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(PlanIdParam),
    controller.deletePlan,
  )

  router.post('/sync', requireAdmin(), controller.syncPlans)

  return router
}
