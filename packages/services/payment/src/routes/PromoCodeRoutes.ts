import type { PrismaClient } from '@prisma/client'
import {
  ApplyPromoCodeRequest,
  CreatePromoCodeRequest,
  PromoCodeCodeParam,
  PromoCodeIdParam,
  PromoCodeUserParams,
  UpdatePromoCodeRequest,
  UserIdParam,
} from '@pika/api/public'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
} from '@pika
import type { ICacheService } from '@pika
import { Router } from 'express'

import { PromoCodeController } from '../controllers/PromoCodeController.js'
import { PromoCodeRepository } from '../repositories/PromoCodeRepository.js'
import { PromoCodeService } from '../services/PromoCodeService.js'

export function createPromoCodeRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repository
  const repository = new PromoCodeRepository(prisma, cache)

  // Initialize service
  const service = new PromoCodeService(repository, cache)

  // Initialize controller
  const controller = new PromoCodeController(service)

  // Public routes - promo code validation and usage
  router.get('/active', requireAuth(), controller.getActivePromoCodes)

  router.get(
    '/code/:code',
    requireAuth(),
    validateParams(PromoCodeCodeParam),
    controller.getPromoCodeByCode,
  )

  router.get(
    '/:code/validate/:userId',
    requireAuth(),
    validateParams(PromoCodeUserParams),
    controller.validatePromoCodeForUser,
  )

  router.post(
    '/:code/use/:userId',
    requireAuth(),
    validateParams(PromoCodeUserParams),
    validateBody(ApplyPromoCodeRequest),
    controller.usePromoCode,
  )

  // User routes - promo code usage history
  router.get(
    '/users/:userId/usages',
    requireAuth(),
    validateParams(UserIdParam),
    controller.getUserPromoCodeUsages,
  )

  // Admin routes - promo code management
  router.get('/admin', requireAdmin(), controller.getAllPromoCodes)

  router.get(
    '/admin/:id',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    controller.getPromoCodeById,
  )

  router.get(
    '/admin/:id/with-usages',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    controller.getPromoCodeByIdWithUsages,
  )

  router.get(
    '/admin/:id/usages',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    controller.getPromoCodeUsages,
  )

  router.post(
    '/admin',
    requireAdmin(),
    validateBody(CreatePromoCodeRequest),
    controller.createPromoCode,
  )

  router.put(
    '/admin/:id',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    validateBody(UpdatePromoCodeRequest),
    controller.updatePromoCode,
  )

  router.delete(
    '/admin/:id',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    controller.deletePromoCode,
  )

  router.patch(
    '/admin/:id/cancel',
    requireAdmin(),
    validateParams(PromoCodeIdParam),
    controller.cancelPromoCode,
  )

  return router
}
