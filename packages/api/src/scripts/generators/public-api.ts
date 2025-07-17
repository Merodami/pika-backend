import { z } from 'zod'

import type { ZodRegistry } from '@api/common/registry/base.js'
import * as pdfParameters from '@api/schemas/pdf/common/parameters.js'
import { ErrorResponse } from '@api/schemas/shared/errors.js'
import { successResponse as MessageResponse } from '@api/schemas/shared/responses.js'
import * as authLoginSchemas from '@api/schemas/auth/public/login.js'
import * as authOauthSchemas from '@api/schemas/auth/public/oauth.js'
import * as authPasswordSchemas from '@api/schemas/auth/public/password.js'
import * as authRegisterSchemas from '@api/schemas/auth/public/register.js'
import * as communicationNotificationSchemas from '@api/schemas/communication/public/notification.js'
import * as webhookSchemas from '@api/schemas/payment/public/webhooks.js'
import * as subscriptionSchemas from '@api/schemas/subscription/public/index.js'
import * as subscriptionPlanSchemas from '@api/schemas/subscription/public/index.js'
import * as supportCommentSchemas from '@api/schemas/support/public/comment.js'
import * as supportProblemSchemas from '@api/schemas/support/public/problem.js'
import * as supportParameterSchemas from '@api/schemas/support/common/parameters.js'
import * as userAddressSchemas from '@api/schemas/user/public/index.js'
import * as userPaymentMethodSchemas from '@api/schemas/user/public/paymentMethod.js'
import * as userProfileSchemas from '@api/schemas/user/public/profile.js'
import * as pdfVoucherBookSchemas from '@api/schemas/pdf/public/voucher-book.js'

/**
 * Register all public API schemas and routes
 */
export function registerPublicAPI(registry: ZodRegistry): void {
  // ============= Authentication Schemas =============
  // Common auth schemas
  registry.registerSchema(
    'AuthTokensResponse',
    authLoginSchemas.AuthTokensResponse,
  )
  registry.registerSchema('AuthUserResponse', authLoginSchemas.AuthUserResponse)

  // OAuth schemas
  registry.registerSchema('TokenRequest', authOauthSchemas.TokenRequest)
  registry.registerSchema('TokenResponse', authOauthSchemas.TokenResponse)
  registry.registerSchema(
    'IntrospectRequest',
    authOauthSchemas.IntrospectRequest,
  )
  registry.registerSchema(
    'IntrospectResponse',
    authOauthSchemas.IntrospectResponse,
  )
  registry.registerSchema(
    'RevokeTokenRequest',
    authOauthSchemas.RevokeTokenRequest,
  )
  registry.registerSchema(
    'RevokeTokenResponse',
    authOauthSchemas.RevokeTokenResponse,
  )
  registry.registerSchema('UserInfoResponse', authOauthSchemas.UserInfoResponse)

  registry.registerSchema(
    'ForgotPasswordRequest',
    authPasswordSchemas.ForgotPasswordRequest,
  )
  registry.registerSchema(
    'ResetPasswordRequest',
    authPasswordSchemas.ResetPasswordRequest,
  )
  registry.registerSchema(
    'ChangePasswordRequest',
    authPasswordSchemas.ChangePasswordRequest,
  )

  registry.registerSchema(
    'RegisterRequest',
    authRegisterSchemas.RegisterRequest,
  )
  registry.registerSchema(
    'RegisterResponse',
    authRegisterSchemas.RegisterResponse,
  )
  registry.registerSchema(
    'VerifyEmailRequest',
    authRegisterSchemas.VerifyEmailRequest,
  )
  registry.registerSchema(
    'ResendVerificationRequest',
    authRegisterSchemas.ResendVerificationRequest,
  )

  // ============= Communication Schemas =============
  registry.registerSchema(
    'NotificationListResponse',
    communicationNotificationSchemas.NotificationListResponse,
  )
  registry.registerSchema(
    'UpdateNotificationPreferencesRequest',
    communicationNotificationSchemas.UpdateNotificationPreferencesRequest,
  )
  registry.registerSchema(
    'NotificationPreferencesResponse',
    communicationNotificationSchemas.NotificationPreferencesResponse,
  )
  registry.registerSchema(
    'MarkNotificationsReadRequest',
    communicationNotificationSchemas.MarkNotificationsReadRequest,
  )
  registry.registerSchema(
    'MarkAllAsReadResponse',
    communicationNotificationSchemas.MarkAllAsReadResponse,
  )
  registry.registerSchema(
    'RegisterPushTokenRequest',
    communicationNotificationSchemas.RegisterPushTokenRequest,
  )
  registry.registerSchema(
    'UnregisterPushTokenRequest',
    communicationNotificationSchemas.UnregisterPushTokenRequest,
  )


  // ============= Webhook Schemas =============
  registry.registerSchema(
    'StripeWebhookEvent',
    webhookSchemas.StripeWebhookEvent,
  )
  registry.registerSchema('WebhookResponse', webhookSchemas.WebhookResponse)


  // ============= Subscription Schemas =============
  registry.registerSchema(
    'SubscriptionResponse',
    subscriptionSchemas.SubscriptionResponse,
  )
  registry.registerSchema(
    'SubscriptionListResponse',
    subscriptionSchemas.SubscriptionListResponse,
  )
  registry.registerSchema(
    'CreateSubscriptionRequest',
    subscriptionSchemas.CreateSubscriptionRequest,
  )
  registry.registerSchema(
    'UpdateSubscriptionRequest',
    subscriptionSchemas.UpdateSubscriptionRequest,
  )
  registry.registerSchema(
    'CancelSubscriptionRequest',
    subscriptionSchemas.CancelSubscriptionRequest,
  )
  registry.registerSchema(
    'SubscriptionQueryParams',
    subscriptionSchemas.SubscriptionQueryParams,
  )
  registry.registerSchema(
    'SubscriptionIdParam',
    subscriptionSchemas.SubscriptionIdParam,
  )

  registry.registerSchema(
    'SubscriptionPlanListResponse',
    subscriptionPlanSchemas.SubscriptionPlanListResponse,
  )
  registry.registerSchema(
    'SubscriptionPlanDetailResponse',
    subscriptionPlanSchemas.SubscriptionPlanDetailResponse,
  )
  registry.registerSchema(
    'CreateSubscriptionPlanRequest',
    subscriptionPlanSchemas.CreateSubscriptionPlanRequest,
  )
  registry.registerSchema(
    'UpdateSubscriptionPlanRequest',
    subscriptionPlanSchemas.UpdateSubscriptionPlanRequest,
  )
  registry.registerSchema(
    'SubscriptionPlanQueryParams',
    subscriptionPlanSchemas.SubscriptionPlanQueryParams,
  )
  registry.registerSchema('PlanIdParam', subscriptionPlanSchemas.PlanIdParam)

  // ============= Support Schemas =============
  // Problem schemas
  registry.registerSchema(
    'CreateSupportProblemRequest',
    supportProblemSchemas.CreateSupportProblemRequest,
  )
  registry.registerSchema(
    'SupportProblemResponse',
    supportProblemSchemas.SupportProblemResponse,
  )
  registry.registerSchema(
    'SupportProblemListResponse',
    supportProblemSchemas.SupportProblemListResponse,
  )
  registry.registerSchema(
    'ProblemIdParam',
    supportParameterSchemas.ProblemIdParam,
  )
  registry.registerSchema(
    'SupportProblemSearchParams',
    supportProblemSchemas.SupportProblemSearchParams,
  )

  // Comment schemas
  registry.registerSchema(
    'CreateSupportCommentRequest',
    supportCommentSchemas.CreateSupportCommentRequest,
  )
  registry.registerSchema(
    'UpdateSupportCommentRequest',
    supportCommentSchemas.UpdateSupportCommentRequest,
  )
  registry.registerSchema(
    'SupportCommentResponse',
    supportCommentSchemas.SupportCommentResponse,
  )
  registry.registerSchema(
    'SupportCommentListResponse',
    supportCommentSchemas.SupportCommentListResponse,
  )
  registry.registerSchema(
    'SupportCommentIdParam',
    supportParameterSchemas.SupportCommentIdParam,
  )
  registry.registerSchema(
    'ProblemIdForCommentsParam',
    supportParameterSchemas.ProblemIdForCommentsParam,
  )
  registry.registerSchema(
    'SupportCommentSearchParams',
    supportCommentSchemas.SupportCommentSearchParams,
  )

  // ============= User Schemas =============
  registry.registerSchema(
    'UserProfileResponse',
    userProfileSchemas.UserProfileResponse,
  )
  registry.registerSchema(
    'UpdateProfileRequest',
    userProfileSchemas.UpdateProfileRequest,
  )
  registry.registerSchema(
    'UploadAvatarRequest',
    userProfileSchemas.UploadAvatarRequest,
  )
  registry.registerSchema(
    'DeleteAccountRequest',
    userProfileSchemas.DeleteAccountRequest,
  )
  registry.registerSchema(
    'CurrentUserProfile',
    userProfileSchemas.CurrentUserProfile,
  )

  registry.registerSchema('UserAddress', userAddressSchemas.UserAddress)
  registry.registerSchema('AddressResponse', userAddressSchemas.AddressResponse)
  registry.registerSchema(
    'AddressListResponse',
    userAddressSchemas.AddressListResponse,
  )
  registry.registerSchema(
    'CreateAddressRequest',
    userAddressSchemas.CreateAddressRequest,
  )
  registry.registerSchema(
    'UpdateAddressRequest',
    userAddressSchemas.UpdateAddressRequest,
  )
  registry.registerSchema('AddressIdParam', userAddressSchemas.AddressIdParam)


  registry.registerSchema(
    'PaymentMethod',
    userPaymentMethodSchemas.PaymentMethod,
  )
  registry.registerSchema(
    'UserPaymentMethodsResponse',
    userPaymentMethodSchemas.UserPaymentMethodsResponse,
  )
  registry.registerSchema(
    'AddPaymentMethodRequest',
    userPaymentMethodSchemas.AddPaymentMethodRequest,
  )
  registry.registerSchema(
    'UpdatePaymentMethodRequest',
    userPaymentMethodSchemas.UpdatePaymentMethodRequest,
  )


  // ============= PDF/Voucher Book Schemas =============
  registry.registerSchema(
    'VoucherBookResponse',
    pdfVoucherBookSchemas.VoucherBookResponse,
  )
  registry.registerSchema(
    'VoucherBookListResponse',
    pdfVoucherBookSchemas.VoucherBookListResponse,
  )
  registry.registerSchema(
    'VoucherBookDetailResponse',
    pdfVoucherBookSchemas.VoucherBookDetailResponse,
  )
  registry.registerSchema(
    'VoucherBookQueryParams',
    pdfVoucherBookSchemas.VoucherBookQueryParams,
  )
  registry.registerSchema(
    'PdfDownloadResponse',
    pdfVoucherBookSchemas.PdfDownloadResponse,
  )
  
  // PDF parameter schemas
  registry.registerSchema('VoucherBookIdParam', pdfParameters.VoucherBookIdParam)

  // ============= Register Routes =============
  registerPublicRoutes(registry)
}

/**
 * Register all public API routes
 */
function registerPublicRoutes(registry: ZodRegistry): void {
  // Additional schemas needed for routes
  registry.registerSchema('Subscription', subscriptionSchemas.Subscription)
  registry.registerSchema(
    'SubscriptionPlan',
    subscriptionPlanSchemas.SubscriptionPlan,
  )
  registry.registerSchema(
    'Notification',
    communicationNotificationSchemas.Notification,
  )
  registry.registerSchema(
    'CreateNotificationRequest',
    communicationNotificationSchemas.CreateNotificationRequest,
  )
  registry.registerSchema(
    'StripeWebhookEvent',
    webhookSchemas.StripeWebhookEvent,
  )
  registry.registerSchema('WebhookResponse', webhookSchemas.WebhookResponse)
  registry.registerSchema(
    'WebhookErrorResponse',
    webhookSchemas.WebhookErrorResponse,
  )

  // OAuth 2.0 Authentication routes
  registry.registerRoute({
    method: 'post',
    path: '/auth/token',
    summary: 'OAuth 2.0 Token Endpoint',
    description:
      'Exchange credentials or refresh token for access tokens (RFC 6749)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.TokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully generated tokens',
        content: {
          'application/json': {
            schema: authOauthSchemas.TokenResponse,
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      401: {
        description: 'Invalid credentials',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/register',
    summary: 'User registration',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authRegisterSchemas.RegisterRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Registration successful',
        content: {
          'application/json': {
            schema: authRegisterSchemas.RegisterResponse,
          },
        },
      },
      400: {
        description: 'Invalid registration data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/introspect',
    summary: 'OAuth 2.0 Token Introspection',
    description: 'Check if a token is active and get its metadata (RFC 7662)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.IntrospectRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token introspection result',
        content: {
          'application/json': {
            schema: authOauthSchemas.IntrospectResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/revoke',
    summary: 'OAuth 2.0 Token Revocation',
    description: 'Revoke an access or refresh token (RFC 7009)',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authOauthSchemas.RevokeTokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token successfully revoked',
        content: {
          'application/json': {
            schema: authOauthSchemas.RevokeTokenResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/auth/userinfo',
    summary: 'OAuth 2.0 UserInfo Endpoint',
    description: 'Get information about the authenticated user',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User information',
        content: {
          'application/json': {
            schema: authOauthSchemas.UserInfoResponse,
          },
        },
      },
      401: {
        description: 'Not authenticated',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/forgot-password',
    summary: 'Request password reset',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ForgotPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset email sent (if account exists)',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/reset-password',
    summary: 'Reset password with token',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ResetPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset successful',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid or expired token',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/auth/verify-email/{token}',
    summary: 'Verify email address',
    tags: ['Authentication'],
    request: {
      params: authRegisterSchemas.VerifyEmailRequest,
    },
    responses: {
      200: {
        description: 'Email verified successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid or expired verification token',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/resend-verification',
    summary: 'Resend email verification',
    tags: ['Authentication'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ForgotPasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification email sent (if account exists)',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/change-password',
    summary: 'Change user password',
    tags: ['Authentication'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authPasswordSchemas.ChangePasswordRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password changed successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      400: {
        description: 'Invalid current password',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // User routes
  registry.registerRoute({
    method: 'get',
    path: '/users/profile',
    summary: 'Get current user profile',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User profile',
        content: {
          'application/json': {
            schema: userProfileSchemas.CurrentUserProfile,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/users/profile',
    summary: 'Update user profile',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userProfileSchemas.UpdateProfileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated profile',
        content: {
          'application/json': {
            schema: userProfileSchemas.CurrentUserProfile,
          },
        },
      },
    },
  })








  // Stripe webhook route (no authentication - uses signature verification)
  registry.registerRoute({
    method: 'post',
    path: '/webhooks/stripe',
    summary: 'Handle Stripe webhook events',
    tags: ['Webhooks'],
    description:
      'Endpoint for receiving Stripe webhook events. Uses signature verification instead of JWT authentication.',
    request: {
      headers: z.object({
        'stripe-signature': z.string().describe('Stripe webhook signature'),
      }),
      body: {
        content: {
          'application/json': {
            schema: webhookSchemas.StripeWebhookEvent,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Webhook processed successfully',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookResponse,
          },
        },
      },
      400: {
        description: 'Invalid webhook signature or payload',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookErrorResponse,
          },
        },
      },
      500: {
        description: 'Webhook processing error',
        content: {
          'application/json': {
            schema: webhookSchemas.WebhookErrorResponse,
          },
        },
      },
    },
  })

  // Support Problem routes
  registry.registerRoute({
    method: 'post',
    path: '/problems',
    summary: 'Create a new support problem',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: supportProblemSchemas.CreateSupportProblemRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Problem created successfully',
        content: {
          'application/json': {
            schema: supportProblemSchemas.SupportProblemResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/problems',
    summary: "Get user's support problems",
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      query: supportProblemSchemas.SupportProblemSearchParams,
    },
    responses: {
      200: {
        description: "List of user's problems",
        content: {
          'application/json': {
            schema: supportProblemSchemas.SupportProblemListResponse,
          },
        },
      },
    },
  })

  // Support Comment routes
  registry.registerRoute({
    method: 'post',
    path: '/comments',
    summary: 'Create a new comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: supportCommentSchemas.CreateSupportCommentRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Comment created successfully',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/comments/problem/{problemId}',
    summary: 'Get comments for a problem',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.ProblemIdForCommentsParam,
    },
    responses: {
      200: {
        description: 'List of comments',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(supportCommentSchemas.SupportCommentResponse),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/comments/{id}',
    summary: 'Get comment by ID',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.SupportCommentIdParam,
    },
    responses: {
      200: {
        description: 'Comment details',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/comments/{id}',
    summary: 'Update comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportCommentSchemas.SupportCommentIdParam,
      body: {
        content: {
          'application/json': {
            schema: supportCommentSchemas.UpdateSupportCommentRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Comment updated successfully',
        content: {
          'application/json': {
            schema: supportCommentSchemas.SupportCommentResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/comments/{id}',
    summary: 'Delete comment',
    tags: ['Support'],
    security: [{ bearerAuth: [] }],
    request: {
      params: supportParameterSchemas.SupportCommentIdParam,
    },
    responses: {
      204: {
        description: 'Comment deleted successfully',
      },
    },
  })

  // ============= PDF/Voucher Book Public Routes =============
  
  // Get all voucher books (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books',
    summary: 'List all published voucher books',
    tags: ['PDF'],
    request: {
      query: pdfVoucherBookSchemas.VoucherBookQueryParams,
    },
    responses: {
      200: {
        description: 'List of voucher books',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.VoucherBookListResponse,
          },
        },
      },
    },
  })

  // Get voucher book by ID (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books/{id}',
    summary: 'Get voucher book details',
    tags: ['PDF'],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'Voucher book details',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.VoucherBookDetailResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Download PDF (public, read-only)
  registry.registerRoute({
    method: 'get',
    path: '/voucher-books/{id}/download',
    summary: 'Download voucher book PDF',
    tags: ['PDF'],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'PDF download information',
        content: {
          'application/json': {
            schema: pdfVoucherBookSchemas.PdfDownloadResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found or PDF not available',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })
}
