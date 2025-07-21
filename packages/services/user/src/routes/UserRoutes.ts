import { userAdmin, userPublic } from '@pika/api'
import {
  createMulterMiddleware,
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, FileStoragePort } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { UserController } from '../controllers/UserController.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { InternalUserService } from '../services/InternalUserService.js'
import { UserService } from '../services/UserService.js'

// User route definitions for Pika gym platform

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

  // GET /users - Get all users with filters (admin only)
  router.get(
    '/',
    requireAdmin(),
    validateQuery(userAdmin.AdminUserQueryParams),
    controller.getAllUsers,
  )

  // GET /users/me - Get current user profile
  router.get('/me', requireAuth(), controller.getMe)

  // PUT /users/me - Update current user profile
  router.put(
    '/me',
    requireAuth(),
    validateBody(userPublic.UpdateProfileRequest),
    controller.updateMe,
  )

  // GET /users/email/:email - Get user by email (admin only)
  router.get(
    '/email/:email',
    requireAdmin(),
    validateParams(userAdmin.EmailParam),
    controller.getUserByEmail,
  )

  // GET /users/:id - Get user by ID
  router.get(
    '/:id',
    requireAuth(),
    validateParams(userAdmin.UserIdParam),
    validateQuery(userPublic.GetUserByIdQuery),
    controller.getUserById,
  )

  // POST /users - Create new user (admin only)
  router.post(
    '/',
    requireAdmin(),
    validateBody(userAdmin.AdminCreateUserRequest),
    controller.createAdminUser,
  )

  // PATCH /users/:id - Update user (admin only)
  router.patch(
    '/:id',
    requireAdmin(),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.AdminUpdateUserRequest),
    controller.updateUser,
  )

  // DELETE /users/:id - Delete user (admin only)
  router.delete(
    '/:id',
    requireAdmin(),
    validateParams(userAdmin.UserIdParam),
    controller.deleteUser,
  )

  // GET /users/sub/:subToken - Get user by sub token
  router.get(
    '/sub/:subToken',
    requireAuth(),
    validateParams(userAdmin.SubTokenParam),
    controller.getUserBySubToken,
  )

  // PUT /users/:id/status - Update user status (admin only)
  router.put(
    '/:id/status',
    requireAdmin(),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.UpdateUserStatusRequest),
    controller.updateUserStatus,
  )

  // PUT /users/:id/ban - Ban user (admin only)
  router.put(
    '/:id/ban',
    requireAdmin(),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.BanUserRequest),
    controller.banUser,
  )

  // PUT /users/:id/unban - Unban user (admin only)
  router.put(
    '/:id/unban',
    requireAdmin(),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.UnbanUserRequest),
    controller.unbanUser,
  )

  // GET /users/:id/friends - Get user friends/guests
  router.get(
    '/:id/friends',
    requireAuth(),
    validateParams(userAdmin.UserIdParam),
    controller.getUserFriends,
  )

  // POST /users/:id/avatar - Upload user avatar
  const upload = createMulterMiddleware({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    },
  })

  router.post(
    '/:id/avatar',
    requireAuth(),
    validateParams(userAdmin.UserIdParam),
    upload.single('avatar'),
    controller.uploadAvatar,
  )

  return router
}
