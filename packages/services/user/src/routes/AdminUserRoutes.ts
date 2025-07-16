import type { PrismaClient } from '@prisma/client'
import { UpdateAdminProfileRequest, UserIdParam } from '@pika/api/admin'
import {
  UnifiedResendVerificationRequest,
  UnifiedVerificationRequest,
} from '@pika/api/public'
import {
  requireAdmin,
  requireAuth,
  validateBody,
  validateParams,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type {
  CommunicationServiceClient,
  FileStoragePort,
} from '@pika/shared'
import { Router } from 'express'
import multer from 'multer'

import { AdminUserController } from '../controllers/AdminUserController.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { InternalUserService } from '../services/InternalUserService.js'
import { UserService } from '../services/UserService.js'

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

  // Admin verification routes
  // POST /admin/users/verify - Admin verifies any user
  router.post(
    '/verify',
    requireAuth(),
    requireAdmin(),
    validateBody(UnifiedVerificationRequest),
    controller.verifyUser,
  )

  // POST /admin/users/resend-verification - Admin resends verification for any user
  router.post(
    '/resend-verification',
    requireAuth(),
    requireAdmin(),
    validateBody(UnifiedResendVerificationRequest),
    controller.resendVerification,
  )

  // POST /admin/users/:id/avatar - Admin uploads avatar for any user
  router.post(
    '/:id/avatar',
    requireAuth(),
    requireAdmin(),
    validateParams(UserIdParam),
    upload.single('file'),
    controller.uploadUserAvatar,
  )

  // Admin profile routes
  // GET /admin/users/me - Get current admin user profile
  router.get('/me', requireAuth(), requireAdmin(), controller.getMyProfile)

  // PATCH /admin/users/me - Update current admin user profile
  router.patch(
    '/me',
    requireAuth(),
    requireAdmin(),
    validateBody(UpdateAdminProfileRequest),
    controller.updateMyProfile,
  )

  // GET /admin/users/:id/verification-status - Get user verification status
  router.get(
    '/:id/verification-status',
    requireAuth(),
    requireAdmin(),
    validateParams(UserIdParam),
    controller.getUserVerificationStatus,
  )

  return router
}
