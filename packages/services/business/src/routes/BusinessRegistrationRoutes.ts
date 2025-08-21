import { BusinessRegistrationController } from '@business/controllers/BusinessRegistrationController.js'
import { BusinessRegistrationRepository } from '@business/repositories/BusinessRegistrationRepository.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessRegistrationService } from '@business/services/BusinessRegistrationService.js'
import { businessPublic } from '@pika/api'
import { requireAuth, requirePermissions, validateBody } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { UserServiceClient } from '@pika/shared'
import type { TranslationClient } from '@pika/translation'
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
  userServiceClient: UserServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const registrationRepository = new BusinessRegistrationRepository(
    prisma,
    cache,
  )
  const businessRepository = new BusinessRepository(prisma, cache)
  const service = new BusinessRegistrationService(
    registrationRepository,
    businessRepository,
    userServiceClient,
  )
  const controller = new BusinessRegistrationController(service)

  // Business registration routes (require auth and business permissions)
  // GET /businesses/registration/status - Get current registration status
  router.get(
    '/status',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    controller.getRegistrationStatus,
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

  // POST /businesses/registration/step3 - Submit step 3 data and complete registration
  router.post(
    '/step3',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.BusinessRegistrationStep3Request),
    controller.submitStep3,
  )

  return router
}
