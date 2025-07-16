import type { PrismaClient } from '@prisma/client'
import {
  CreateCreditPackRequest,
  UpdateCreditPackRequest,
} from '@pika/api/admin'
import {
  CreditPackIdParam,
  GetActiveCreditPacksQuery,
  GetAllCreditPacksQuery,
} from '@pikac'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika
import type { ICacheService } from '@pika
import { Router } from 'express'

import { CreditPackController } from '../controllers/CreditPackController.js'
import { CreditPackRepository } from '../repositories/CreditPackRepository.js'
import { CreditPackService } from '../services/CreditPackService.js'

export function createCreditPackRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new CreditPackRepository(prisma, cache)

  // Initialize service
  const service = new CreditPackService(repository, cache)

  // Initialize controller
  const controller = new CreditPackController(service)

  // Public routes (available credit packs for purchase)
  router.get(
    '/',
    requireAuth(),
    validateQuery(GetActiveCreditPacksQuery),
    controller.getActiveCreditPacks,
  )

  router.get(
    '/:id',
    requireAuth(),
    validateParams(CreditPackIdParam),
    controller.getCreditPackById,
  )

  // Admin routes
  router.get(
    '/admin/all',
    requireAdmin(),
    validateQuery(GetAllCreditPacksQuery),
    controller.getAllCreditPacks,
  )

  router.post(
    '/admin',
    requireAdmin(),
    validateBody(CreateCreditPackRequest),
    controller.createCreditPack,
  )

  router.put(
    '/admin/:id',
    requireAdmin(),
    validateParams(CreditPackIdParam),
    validateBody(UpdateCreditPackRequest),
    controller.updateCreditPack,
  )

  router.delete(
    '/admin/:id',
    requireAdmin(),
    validateParams(CreditPackIdParam),
    controller.deleteCreditPack,
  )

  router.patch(
    '/admin/:id/deactivate',
    requireAdmin(),
    validateParams(CreditPackIdParam),
    controller.deactivateCreditPack,
  )

  router.patch(
    '/admin/:id/activate',
    requireAdmin(),
    validateParams(CreditPackIdParam),
    controller.activateCreditPack,
  )

  return router
}
