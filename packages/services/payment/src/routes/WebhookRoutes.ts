import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import express, { Router } from 'express'
import type Stripe from 'stripe'

import { WebhookController } from '../controllers/WebhookController.js'
import { StripeService } from '../services/StripeService.js'

export function createWebhookRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  stripeInstance?: Stripe,
): Router {
  const router = Router()

  // Initialize services
  const stripeService = new StripeService(stripeInstance)

  // Initialize controller
  const webhookController = new WebhookController(
    stripeService,
  )

  // Modern industry standard: Raw body parsing for webhook signature verification
  router.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    webhookController.handleStripeWebhook,
  )

  return router
}
