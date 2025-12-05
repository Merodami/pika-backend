import { AuthController } from '@auth-service/controllers/AuthController.js'
import { SocialAuthController } from '@auth-service/controllers/SocialAuthController.js'
import { AuthService } from '@auth-service/services/AuthService.js'
import { SocialAuthService } from '@auth-service/services/SocialAuthService.js'
import { authPublic } from '@pika/api'
import { requireAuth, validateBody, validateParams } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  UserServiceClient,
} from '@pika/shared'
import { Router } from 'express'

export async function createAuthRouter(
  cache: ICacheService,
  userServiceClient: UserServiceClient,
  communicationClient?: CommunicationServiceClient,
  businessServiceClient?: BusinessServiceClient,
): Promise<Router> {
  const router = Router()

  // Initialize dependencies using manual DI pattern with async factory
  const authService = await AuthService.create(
    cache,
    userServiceClient,
    communicationClient,
    businessServiceClient,
  )
  const controller = new AuthController(authService)

  // Initialize social auth service and controller
  const socialAuthService = new SocialAuthService(
    cache,
    userServiceClient,
    communicationClient,
    businessServiceClient,
  )
  const socialAuthController = new SocialAuthController(socialAuthService)

  // Public routes (no authentication required)
  router.post(
    '/register',
    validateBody(authPublic.RegisterRequest),
    controller.register,
  )

  // Password reset routes (public)
  router.post(
    '/forgot-password',
    validateBody(authPublic.ForgotPasswordRequest),
    controller.forgotPassword,
  )

  router.post(
    '/reset-password',
    validateBody(authPublic.ResetPasswordRequest),
    controller.resetPassword,
  )

  // Email verification routes (public)
  router.get(
    '/verify-email/:token',
    validateParams(authPublic.VerifyEmailRequest),
    controller.verifyEmail,
  )

  router.post(
    '/resend-verification',
    validateBody(authPublic.ForgotPasswordRequest), // Reuse same schema (only email field)
    controller.resendVerificationEmail,
  )

  // Protected routes (authentication required)
  router.post(
    '/change-password',
    requireAuth(),
    validateBody(authPublic.ChangePasswordRequest),
    controller.changePassword,
  )

  // OAuth 2.0 standard endpoints
  router.post('/token', validateBody(authPublic.TokenRequest), controller.token)

  router.post(
    '/introspect',
    validateBody(authPublic.IntrospectRequest),
    controller.introspect,
  )

  router.post(
    '/revoke',
    validateBody(authPublic.RevokeTokenRequest),
    controller.revoke,
  )

  // Protected route - auth is handled manually in the controller
  router.get('/userinfo', controller.userinfo)

  // Social Authentication routes
  router.post(
    '/social/login',
    validateBody(authPublic.SocialLoginRequest),
    socialAuthController.socialLogin,
  )

  // OAuth authorization code exchange (public endpoint)
  router.post(
    '/exchange-token',
    validateBody(authPublic.ExchangeTokenRequest),
    socialAuthController.exchangeToken,
  )

  router.post(
    '/social/link',
    requireAuth(),
    validateBody(authPublic.LinkAccountRequest),
    socialAuthController.linkAccount,
  )

  router.post(
    '/social/unlink',
    requireAuth(),
    validateBody(authPublic.UnlinkAccountRequest),
    socialAuthController.unlinkAccount,
  )

  router.get(
    '/social/accounts',
    requireAuth(),
    socialAuthController.getLinkedAccounts,
  )

  return router
}
