import { BusinessRegistrationController } from '@business/controllers/BusinessRegistrationController.js'
import { BusinessDetailsRepository } from '@business/repositories/BusinessDetailsRepository.js'
import { BusinessRegistrationRepository } from '@business/repositories/BusinessRegistrationRepository.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessRegistrationService } from '@business/services/BusinessRegistrationService.js'
import { businessPublic } from '@pika/api'
import { requireAuth, requirePermissions, validateBody } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { UserServiceClient } from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

/**
 * Creates business registration routes
 * These routes handle the multi-step business registration flow
 */
export function createBusinessRegistrationRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver?: TranslationResolver,
  userServiceClient?: UserServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const registrationRepository = new BusinessRegistrationRepository(
    prisma,
    cache,
  )
  const businessRepository = new BusinessRepository(prisma, cache)
  const businessDetailsRepository = new BusinessDetailsRepository(prisma, cache)
  
  if (!userServiceClient) {
    throw new Error('UserServiceClient is required for BusinessRegistrationRoutes')
  }
  
  const service = new BusinessRegistrationService(
    registrationRepository,
    businessRepository,
    businessDetailsRepository,
    userServiceClient,
  )
  const controller = new BusinessRegistrationController(service)

  // Business registration routes (require auth and business permissions)

  // POST /businesses/registration/start - Start registration process
  router.post(
    '/start',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    controller.startRegistration,
  )

  // GET /businesses/registration/status - Get current registration status
  router.get(
    '/status',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    controller.getRegistrationStatus,
  )

  // GET /businesses/registration/progress - Get detailed registration progress
  router.get(
    '/progress',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    controller.getProgress,
  )

  // POST /businesses/registration/step1 - Submit step 1 data
  router.post(
    '/step1',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.BusinessRegistrationStep1Request),
    controller.submitStep1,
  )

  // POST /businesses/registration/step2 - Submit step 2 data
  router.post(
    '/step2',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.BusinessRegistrationStep2Request),
    controller.submitStep2,
  )

  // POST /businesses/registration/step3 - Submit step 3 data (does NOT auto-complete)
  router.post(
    '/step3',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.BusinessRegistrationStep3Request),
    controller.submitStep3,
  )

  // POST /businesses/registration/complete - Complete registration with user consent
  router.post(
    '/complete',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.CompleteBusinessRegistrationRequest),
    controller.completeRegistration,
  )

  return router
}
