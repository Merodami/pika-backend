import { PrismaClient } from '@prisma/client'
import {
  CreateEmailVerificationTokenRequest,
  CreatePasswordResetTokenRequest,
  CreateUserRequest,
  EmailParam,
  PhoneParam,
  UpdateLastLoginRequest,
  UpdatePasswordRequest,
  UserIdParam,
  ValidateEmailVerificationTokenRequest,
  ValidatePasswordResetTokenRequest,
  VerifyEmailRequest,
} from '@pika/api/internal'
import { requireServiceAuth, validateBody, validateParams } from '@pika
import { ICacheService } from '@pika'
import { Router } from 'express'

import { InternalUserController } from '../controllers/InternalUserController.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { InternalUserService } from '../services/InternalUserService.js'

/**
 * Internal API routes for service-to-service communication
 * These routes are protected by service authentication
 */
export function createInternalUserRouter(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Create instances
  const repository = new UserRepository(prisma, cache)
  const service = new InternalUserService(repository, cache)
  const controller = new InternalUserController(service)

  // Apply service auth to all internal routes
  router.use(requireServiceAuth())

  // Auth-related endpoints

  // GET /internal/users/auth/by-email/:email - Get user auth data by email
  router.get(
    '/auth/by-email/:email',
    validateParams(EmailParam),
    controller.getUserAuthDataByEmail,
  )

  // GET /internal/users/auth/:id - Get user auth data by ID
  router.get(
    '/auth/:id',
    validateParams(UserIdParam),
    controller.getUserAuthData,
  )

  // POST /internal/users - Create new user (for registration)
  router.post('/', validateBody(CreateUserRequest), controller.createUser)

  // POST /internal/users/:id/last-login - Update last login
  router.post(
    '/:id/last-login',
    validateParams(UserIdParam),
    validateBody(UpdateLastLoginRequest),
    controller.updateLastLogin,
  )

  // GET /internal/users/check-email/:email - Check if email exists
  router.get(
    '/check-email/:email',
    validateParams(EmailParam),
    controller.checkEmailExists,
  )

  // GET /internal/users/check-phone/:phone - Check if phone exists
  router.get(
    '/check-phone/:phone',
    validateParams(PhoneParam),
    controller.checkPhoneExists,
  )

  // POST /internal/users/:id/password - Update password
  router.post(
    '/:id/password',
    validateParams(UserIdParam),
    validateBody(UpdatePasswordRequest),
    controller.updatePassword,
  )

  // POST /internal/users/:id/verify-email - Mark email as verified
  router.post(
    '/:id/verify-email',
    validateParams(UserIdParam),
    validateBody(VerifyEmailRequest),
    controller.verifyEmail,
  )

  // POST /internal/users/:id/password-reset-token - Create password reset token
  router.post(
    '/:id/password-reset-token',
    validateParams(UserIdParam),
    validateBody(CreatePasswordResetTokenRequest),
    controller.createPasswordResetToken,
  )

  // POST /internal/users/validate-password-reset-token - Validate password reset token
  router.post(
    '/validate-password-reset-token',
    validateBody(ValidatePasswordResetTokenRequest),
    controller.validatePasswordResetToken,
  )

  // POST /internal/users/invalidate-password-reset-token - Invalidate password reset token
  router.post(
    '/invalidate-password-reset-token',
    validateBody(ValidatePasswordResetTokenRequest),
    controller.invalidatePasswordResetToken,
  )

  // POST /internal/users/:id/email-verification-token - Create email verification token
  router.post(
    '/:id/email-verification-token',
    validateParams(UserIdParam),
    validateBody(CreateEmailVerificationTokenRequest),
    controller.createEmailVerificationToken,
  )

  // POST /internal/users/validate-email-verification-token - Validate email verification token
  router.post(
    '/validate-email-verification-token',
    validateBody(ValidateEmailVerificationTokenRequest),
    controller.validateEmailVerificationToken,
  )

  return router
}
