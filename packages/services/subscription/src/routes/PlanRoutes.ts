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
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { PaymentServiceClient } from '@pika/shared'
import { PlanController } from '../controllers/PlanController.js'
import { PlanRepository } from '../repositories/PlanRepository.js'
import { PlanService } from '../services/PlanService.js'
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
