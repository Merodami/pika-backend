import type { PrismaClient } from '@prisma/client'
// Note: Currently no internal schemas are used in credit routes
// All credit operations use public/admin authentication
import {
  AdminAddCreditsToUserRequest,
  AdminCreateUserCreditsRequest,
  AdminUpdateUserCreditsRequest,
} from '@pika/api/admin'
import {
  AddCreditsServiceRequest,
  ConsumeCreditsRequest,
  ConsumeCreditsSmartRequest,
  CreditsIdParam,
  TransferCreditsRequest,
  UserIdParam,
} from '@pikac'
import {
  requireAdmin,
  requireAuth,
  requireOwnership,
  requireRoles,
  validateBody,
  validateParams,
} from '@pika
import type { ICacheService } from '@pika
import { UserRole } from '@pika
import { Router } from 'express'

import { CreditsController } from '../controllers/CreditsController.js'
import { CreditsRepository } from '../repositories/CreditsRepository.js'
import { PromoCodeRepository } from '../repositories/PromoCodeRepository.js'
import { CreditsService } from '../services/CreditsService.js'
import { StripeService } from '../services/StripeService.js'
import { TransactionService } from '../services/TransactionService.js'

export function createCreditsRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize repositories
  const creditsRepository = new CreditsRepository(prisma, cache)
  const promoCodeRepository = new PromoCodeRepository(prisma, cache)

  // Initialize services
  const stripeService = new StripeService()
  const transactionService = new TransactionService(prisma, stripeService)
  const creditsService = new CreditsService(
    creditsRepository,
    promoCodeRepository,
    cache,
    stripeService,
    transactionService,
  )

  // Initialize controller
  const controller = new CreditsController(creditsService)

  // User credits routes (require authentication and ownership validation)
  router.get(
    '/users/:userId',
    requireAuth(),
    validateParams(UserIdParam),
    requireOwnership(), // Users can only access their own credits (unless admin)
    controller.getUserCredits,
  )

  router.get(
    '/users/:userId/history',
    requireAuth(),
    validateParams(UserIdParam),
    requireOwnership(), // Users can only access their own history (unless admin)
    controller.getUserCreditsHistory,
  )

  router.post(
    '/users/:userId/add',
    requireRoles(UserRole.ADMIN), // Only admins can manually add credits
    validateParams(UserIdParam),
    validateBody(AdminAddCreditsToUserRequest),
    controller.addCreditsToUser,
  )

  router.post(
    '/users/:userId/consume',
    requireAuth(),
    validateParams(UserIdParam),
    requireOwnership(), // Users can only consume their own credits (unless admin)
    validateBody(ConsumeCreditsRequest),
    controller.consumeUserCredits,
  )

  router.post(
    '/users/:userId/consume-smart',
    requireAuth(),
    validateParams(UserIdParam),
    requireOwnership(), // Users can only consume their own credits (unless admin)
    validateBody(ConsumeCreditsSmartRequest),
    controller.consumeUserCreditsWithPriority,
  )

  router.post(
    '/users/:userId/transfer',
    requireRoles(UserRole.MEMBER, UserRole.PROFESSIONAL, UserRole.ADMIN), // Only members and professionals can transfer
    validateParams(UserIdParam),
    requireOwnership(), // Users can only transfer from their own account (unless admin)
    validateBody(TransferCreditsRequest),
    controller.transferCredits,
  )

  // Admin routes
  router.post(
    '/',
    requireAdmin(),
    validateBody(AdminCreateUserCreditsRequest),
    controller.createUserCredits,
  )

  router.put(
    '/:id',
    requireAdmin(),
    validateParams(CreditsIdParam),
    validateBody(AdminUpdateUserCreditsRequest),
    controller.updateUserCredits,
  )

  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(CreditsIdParam),
    controller.deleteUserCredits,
  )

  // Legacy-compatible addCreditsService endpoint with Stripe integration
  router.post(
    '/add-credits',
    requireRoles(UserRole.MEMBER, UserRole.PROFESSIONAL, UserRole.ADMIN), // Members and professionals can purchase credits
    validateBody(AddCreditsServiceRequest),
    controller.addCreditsService,
  )

  return router
}
