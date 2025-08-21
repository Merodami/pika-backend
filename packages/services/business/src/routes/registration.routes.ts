import { businessPublic } from '@pika/api'
import { validateRequest } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { UserServiceClient } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import type { Router } from 'express'
import express from 'express'

import { BusinessRegistrationController } from '../registration/BusinessRegistrationController.js'
import { BusinessRegistrationRepository } from '../registration/BusinessRegistrationRepository.js'
import { BusinessRegistrationService } from '../registration/BusinessRegistrationService.js'
import { BusinessRepository } from '../repositories/BusinessRepository.js'

/**
 * Create business registration routes
 * Handles multi-step business registration flow
 */
export function createBusinessRegistrationRouter(
  prisma: PrismaClient,
  cacheService: ICacheService,
  userServiceClient: UserServiceClient,
): Router {
  const router = express.Router()

  // Initialize repositories
  const registrationRepository = new BusinessRegistrationRepository(
    prisma,
    cacheService,
  )
  const businessRepository = new BusinessRepository(prisma, cacheService)

  // Initialize service
  const registrationService = new BusinessRegistrationService(
    registrationRepository,
    businessRepository,
    userServiceClient,
  )

  // Initialize controller
  const controller = new BusinessRegistrationController(registrationService)

  // ============= Registration Routes =============

  /**
   * GET /business/registration/status
   * Check registration status for authenticated user
   */
  router.get('/status', controller.getRegistrationStatus)

  /**
   * POST /business/registration/start
   * Start business registration process
   */
  router.post('/start', controller.startRegistration)

  /**
   * GET /business/registration/progress
   * Get current registration progress
   */
  router.get('/progress', controller.getProgress)

  /**
   * POST /business/registration/steps/:stepNumber
   * Submit data for a specific step
   */
  router.post(
    '/steps/:stepNumber',
    validateRequest({
      body: businessPublic.SubmitRegistrationStepRequest,
    }),
    controller.submitStep,
  )

  /**
   * POST /business/registration/complete
   * Complete registration and submit for approval
   */
  router.post(
    '/complete',
    validateRequest({
      body: businessPublic.CompleteBusinessRegistrationRequest,
    }),
    controller.completeRegistration,
  )

  return router
}
