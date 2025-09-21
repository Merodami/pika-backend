import { BusinessController } from '@business/controllers/BusinessController.js'
import { BusinessDetailsRepository } from '@business/repositories/BusinessDetailsRepository.js'
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import { BusinessService } from '@business/services/BusinessService.js'
import { businessPublic, shared } from '@pika/api'
import {
  createAvatarUploadMiddleware,
  requireActiveBusinesses,
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { StorageServiceClient, UserServiceClient } from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

/**
 * Creates public business routes
 */
export function createBusinessRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver?: TranslationResolver,
  userServiceClient?: UserServiceClient,
  storageServiceClient?: StorageServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma)
  const businessDetailsRepository = new BusinessDetailsRepository(prisma)
  const service = new BusinessService(
    repository,
    translationClient,
    userServiceClient,
    cache,
    translationResolver,
    businessDetailsRepository,
    storageServiceClient,
  )
  const controller = new BusinessController(service)

  // Configure upload middleware for logo uploads
  const upload = createAvatarUploadMiddleware() // Reuse avatar upload middleware for business logos

  // Public routes (require authentication but available to all users)
  // GET /businesses - List all active businesses
  router.get(
    '/',
    requireAuth(),
    validateQuery(businessPublic.BusinessQueryParams),
    controller.getAllBusinesses,
  )

  // Business owner routes (require auth, business permissions, and at least one active business)
  // GET /businesses/me - Get all current user's businesses (must come before /:id)
  router.get(
    '/me',
    requireAuth(),
    requirePermissions('businesses:read:own'),
    // Note: Don't require active businesses - users need to see their businesses during approval process
    validateQuery(businessPublic.BusinessQueryParams),
    controller.getMyBusinesses,
  )

  // POST /businesses/me - Create business for current user
  router.post(
    '/me',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    // Note: Don't require active businesses for creation - this is how users get their first business
    validateBody(businessPublic.CreateMyBusinessRequest),
    controller.createMyBusiness,
  )

  // PUT /businesses/me - Update current user's business
  router.put(
    '/me',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    requireActiveBusinesses(), // Ensure business user has at least one active business
    validateBody(businessPublic.UpdateMyBusinessRequest),
    controller.updateMyBusiness,
  )

  // POST /businesses/me/logo - Upload logo for current user's business
  router.post(
    '/me/logo',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    requireActiveBusinesses(), // Ensure business user has at least one active business
    upload.single('logo'),
    controller.uploadBusinessLogo,
  )

  // GET /businesses/user/:id - Get business by user ID (must come before /:id)
  router.get(
    '/user/:id',
    requireAuth(),
    validateParams(shared.UserIdParam),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessByUserId,
  )

  // GET /businesses/:id - Get business by ID (must come last to avoid conflicts)
  router.get(
    '/:id',
    requireAuth(),
    validateParams(businessPublic.BusinessPathParams),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessById,
  )

  return router
}
