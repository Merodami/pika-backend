import { userAdmin, userPublic } from '@pika/api'
import {
  createAvatarUploadMiddleware,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, FileStoragePort } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { UserController } from '@user/controllers/UserController.js'
import { UserRepository } from '@user/repositories/UserRepository.js'
import { InternalUserService } from '@user/services/InternalUserService.js'
import { UserService } from '@user/services/UserService.js'
import { Router } from 'express'

// User route definitions for Pika gym platform
// Public and authenticated user routes only

export async function createUserRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  fileStorage?: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
): Promise<Router> {
  const router = Router()

  // Create instances
  const repository = new UserRepository(prisma, cache)
  const internalUserService = new InternalUserService(repository, cache)
  const communicationServiceClient =
    communicationClient || new CommunicationServiceClient()
  const service = new UserService(
    repository,
    cache,
    fileStorage,
    internalUserService,
    communicationServiceClient,
  )
  const controller = new UserController(service)

  // Configure upload middleware
  const upload = createAvatarUploadMiddleware()

  // ============= Public Profile Routes =============

  // GET /users/me - Get current user profile
  router.get('/me', requireAuth(), controller.getMe)

  // PUT /users/me - Update current user profile
  router.put(
    '/me',
    requireAuth(),
    validateBody(userPublic.UpdateProfileRequest),
    controller.updateMe,
  )

  // POST /users/me/avatar - Upload avatar for current user
  router.post(
    '/me/avatar',
    requireAuth(),
    upload.single('avatar'),
    controller.uploadMyAvatar,
  )

  // ============= User Discovery Routes =============

  // GET /users/:id - Get user by ID (authenticated users can view profiles)
  router.get(
    '/:id',
    requireAuth(),
    validateParams(userAdmin.UserIdParam),
    validateQuery(userPublic.GetUserByIdQuery),
    controller.getUserById,
  )

  // GET /users/sub/:subToken - Get user by sub token
  router.get(
    '/sub/:subToken',
    requireAuth(),
    validateParams(userAdmin.SubTokenParam),
    controller.getUserBySubToken,
  )

  // POST /users/:id/avatar - Upload user avatar (self or admin check done in controller)
  router.post(
    '/:id/avatar',
    requireAuth(),
    validateParams(userAdmin.UserIdParam),
    upload.single('avatar'),
    controller.uploadAvatar,
  )

  return router
}
