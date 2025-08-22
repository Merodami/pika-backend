import { userAdmin } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { CommunicationServiceClient, FileStoragePort } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'
import { AdminUserController } from '@user/controllers/AdminUserController.js'
import { UserRepository } from '@user/repositories/UserRepository.js'
import { InternalUserService } from '@user/services/InternalUserService.js'
import { UserService } from '@user/services/UserService.js'
import { Router } from 'express'
import multer from 'multer'

export function createAdminUserRouter(
  prisma: PrismaClient,
  cache: ICacheService,
  fileStorage: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
): Router {
  const router = Router()

  // Initialize repository
  const userRepository = new UserRepository(prisma, cache)

  // Initialize internal service
  const internalUserService = new InternalUserService(userRepository, cache)

  // Initialize service with all dependencies
  const userService = new UserService(
    userRepository,
    cache,
    fileStorage,
    internalUserService,
    communicationClient,
  )

  // Initialize controller
  const controller = new AdminUserController(userService)

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // ============= User Management Routes =============

  // GET /admin/users - List all users with filters
  router.get(
    '/',
    requireAuth(),
    requirePermissions('admin:users'),
    validateQuery(userAdmin.AdminUserQueryParams),
    controller.getAllUsers,
  )

  // ============= Admin Profile Routes (must be before :id routes) =============
  // GET /admin/users/me - Get current admin user profile
  router.get(
    '/me',
    requireAuth(),
    requirePermissions('admin:users'),
    controller.getMyProfile,
  )

  // PATCH /admin/users/me - Update current admin user profile
  router.patch(
    '/me',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userAdmin.AdminUpdateProfileRequest),
    controller.updateMyProfile,
  )

  // GET /admin/users/email/:email - Get user by email
  router.get(
    '/email/:email',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.EmailParam),
    controller.getUserByEmail,
  )

  // POST /admin/users - Create new user
  router.post(
    '/',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userAdmin.AdminCreateUserRequest),
    controller.createUser,
  )

  // PATCH /admin/users/:id - Update user
  router.patch(
    '/:id',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.AdminUpdateUserRequest),
    controller.updateUser,
  )

  // PATCH /admin/users/:id/status - Update user status
  router.patch(
    '/:id/status',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.AdminUpdateUserStatusRequest),
    controller.updateUserStatus,
  )

  // PUT /admin/users/:id/ban - Ban user
  router.put(
    '/:id/ban',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.AdminBanUserRequest),
    controller.banUser,
  )

  // PUT /admin/users/:id/unban - Unban user
  router.put(
    '/:id/unban',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    validateBody(userAdmin.AdminUnbanUserRequest),
    controller.unbanUser,
  )

  // ============= Verification Routes =============
  // POST /admin/users/verify - Admin verifies any user
  router.post(
    '/verify',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userAdmin.AdminVerificationRequest),
    controller.verifyUser,
  )

  // POST /admin/users/resend-verification - Admin resends verification for any user
  router.post(
    '/resend-verification',
    requireAuth(),
    requirePermissions('admin:users'),
    validateBody(userAdmin.AdminResendVerificationRequest),
    controller.resendVerification,
  )

  // POST /admin/users/:id/avatar - Admin uploads avatar for any user
  router.post(
    '/:id/avatar',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    upload.single('file'),
    controller.uploadUserAvatar,
  )

  // GET /admin/users/:id - Get user by ID with admin details
  router.get(
    '/:id',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.getUserById,
  )

  // GET /admin/users/:id/verification-status - Get user verification status
  router.get(
    '/:id/verification-status',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.getUserVerificationStatus,
  )

  // DELETE /admin/users/:id - Delete user by ID
  router.delete(
    '/:id',
    requireAuth(),
    requirePermissions('admin:users'),
    validateParams(userAdmin.UserIdParam),
    controller.deleteUser,
  )

  return router
}
