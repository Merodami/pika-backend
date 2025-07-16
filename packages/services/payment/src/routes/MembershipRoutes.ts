import type { PrismaClient } from '@prisma/client'
import {
  CreateCustomerAndMembershipRequest,
  CreateMembershipRequest,
  CreateMembershipSubscriptionRequest,
  MembershipIdParam,
  UpdateMembershipRequest,
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
import type Stripe from 'stripe'

import { MembershipController } from '../controllers/MembershipController.js'
import { MembershipRepository } from '../repositories/MembershipRepository.js'
import { MembershipService } from '../services/MembershipService.js'
import { StripeService } from '../services/StripeService.js'

export function createMembershipRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  stripeInstance?: Stripe,
): Router {
  const router = Router()

  // Initialize repositories
  const membershipRepository = new MembershipRepository(prisma, cache)

  // Initialize services
  const stripeService = new StripeService(stripeInstance)
  const membershipService = new MembershipService(
    membershipRepository,
    stripeService,
    cache,
  )

  // Initialize controller
  const controller = new MembershipController(membershipService)

  // Get membership by ID
  router.get(
    '/:id',
    requireAuth(),
    validateParams(MembershipIdParam),
    controller.getMembershipById,
  )

  // Get membership by user ID
  router.get(
    '/user/:userId',
    requireAuth(),
    validateParams(UserIdParam),
    controller.getMembershipByUserId,
  )

  // Create membership (admin only)
  router.post(
    '/',
    requireAdmin(),
    validateBody(CreateMembershipRequest),
    controller.createMembership,
  )

  // Update membership (admin only)
  router.put(
    '/:id',
    requireAdmin(),
    validateParams(MembershipIdParam),
    validateBody(UpdateMembershipRequest),
    controller.updateMembership,
  )

  // Delete membership (admin only)
  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(MembershipIdParam),
    controller.deleteMembership,
  )

  // Create Stripe customer and membership
  router.post(
    '/create-customer',
    requireAuth(),
    validateBody(CreateCustomerAndMembershipRequest),
    controller.createCustomerAndMembership,
  )

  // Create subscription for membership
  router.post(
    '/:id/subscription',
    requireAuth(),
    validateParams(MembershipIdParam),
    validateBody(CreateMembershipSubscriptionRequest),
    controller.createSubscription,
  )

  // Cancel subscription for membership
  router.delete(
    '/:id/subscription',
    requireAuth(),
    validateParams(MembershipIdParam),
    controller.cancelSubscription,
  )

  // Stripe webhook endpoint (no auth required - Stripe signature verification should be handled)
  router.post('/webhook/stripe', controller.handleStripeWebhook)

  return router
}
