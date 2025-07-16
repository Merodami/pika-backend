import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  IntrospectRequest,
  RegisterRequest,
  ResetPasswordRequest,
  RevokeTokenRequest,
  TokenRequest,
  VerifyEmailRequest,
} from '@pika/api/public'
import { requireAuth, validateBody, validateParams } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { CommunicationServiceClient, UserServiceClient } from '@pika/shared'
import { Router } from 'express'

import { AuthController } from '../controllers/AuthController.js'
import { AuthService } from '../services/AuthService.js'

export function createAuthRouter(
  cache: ICacheService,
  userServiceClient: UserServiceClient,
  communicationClient?: CommunicationServiceClient,
): Router {
  const router = Router()

  // Initialize dependencies using manual DI pattern
  const authService = new AuthService(
    cache,
    userServiceClient,
    communicationClient,
  )
  const controller = new AuthController(authService)

  // Public routes (no authentication required)
  router.post('/register', validateBody(RegisterRequest), controller.register)

  // Password reset routes (public)
  router.post(
    '/forgot-password',
    validateBody(ForgotPasswordRequest),
    controller.forgotPassword,
  )

  router.post(
    '/reset-password',
    validateBody(ResetPasswordRequest),
    controller.resetPassword,
  )

  // Email verification routes (public)
  router.get(
    '/verify-email/:token',
    validateParams(VerifyEmailRequest),
    controller.verifyEmail,
  )

  router.post(
    '/resend-verification',
    validateBody(ForgotPasswordRequest), // Reuse same schema (only email field)
    controller.resendVerificationEmail,
  )

  // Protected routes (authentication required)
  router.post(
    '/change-password',
    requireAuth(),
    validateBody(ChangePasswordRequest),
    controller.changePassword,
  )

  // OAuth 2.0 standard endpoints
  router.post('/token', validateBody(TokenRequest), controller.token)

  router.post(
    '/introspect',
    validateBody(IntrospectRequest),
    controller.introspect,
  )

  router.post('/revoke', validateBody(RevokeTokenRequest), controller.revoke)

  // Protected route - auth is handled manually in the controller
  router.get('/userinfo', controller.userinfo)

  return router
}
