import { z } from 'zod'

import type { SimpleZodRegistry } from '../../common/registry/simple.js'
import {
  ErrorResponse,
  MessageResponse,
} from '../../common/schemas/responses.js'
import * as authLoginSchemas from '../../public/schemas/auth/login.js'
import * as authOauthSchemas from '../../public/schemas/auth/oauth.js'
import * as authPasswordSchemas from '../../public/schemas/auth/password.js'
import * as authRegisterSchemas from '../../public/schemas/auth/register.js'
import * as communicationNotificationSchemas from '../../public/schemas/communication/notification.js'
import * as paymentCreditSchemas from '../../public/schemas/payment/credit.js'
import * as webhookSchemas from '../../public/schemas/payment/webhooks.js'
import * as stuffSchemas from '../../public/schemas/stuff/index.js'
import * as subscriptionSchemas from '../../public/schemas/subscription/index.js'
import * as subscriptionPlanSchemas from '../../public/schemas/subscription/index.js'
import * as supportCommentSchemas from '../../public/schemas/support/comment.js'
import * as supportProblemSchemas from '../../public/schemas/support/problem.js'
import * as userAddressSchemas from '../../public/schemas/user/index.js'
import * as userParqSchemas from '../../public/schemas/user/parq.js'
import * as userPaymentMethodSchemas from '../../public/schemas/user/paymentMethod.js'
import * as userProfessionalSchemas from '../../public/schemas/user/professional.js'
import * as userProfileSchemas from '../../public/schemas/user/profile.js'

/**
 * Register all public API schemas and routes
 */
export function registerPublicAPI(registry: SimpleZodRegistry): void {
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


  // ============= Payment Schemas =============
  registry.registerSchema(
    'CreditBalanceResponse',
    paymentCreditSchemas.CreditBalanceResponse,
  )
  registry.registerSchema(
    'CreditTransactionListResponse',
    paymentCreditSchemas.CreditTransactionListResponse,
  )
  registry.registerSchema(
    'PurchaseCreditsRequest',
    paymentCreditSchemas.PurchaseCreditsRequest,
  )
  registry.registerSchema(
    'PurchaseCreditsResponse',
    paymentCreditSchemas.PurchaseCreditsResponse,
  )
  registry.registerSchema(
    'CreditPackageListResponse',
    paymentCreditSchemas.CreditPackageListResponse,
  )
  registry.registerSchema(
    'CreditTransactionQueryParams',
    paymentCreditSchemas.CreditTransactionQueryParams,
  )

  // ============= Webhook Schemas =============
  registry.registerSchema(
    'StripeWebhookEvent',
    webhookSchemas.StripeWebhookEvent,
  )
  registry.registerSchema('WebhookResponse', webhookSchemas.WebhookResponse)


  // ============= Stuff Schemas =============
  registry.registerSchema(
    'CategoryListResponse',
    stuffSchemas.CategoryListResponse,
  )
  registry.registerSchema(
    'CategoryDetailResponse',
    stuffSchemas.CategoryDetailResponse,
  )
  registry.registerSchema(
    'CategoryQueryParams',
    stuffSchemas.CategoryQueryParams,
  )
  registry.registerSchema(
    'CreateCategoryRequest',
    stuffSchemas.CreateCategoryRequest,
  )
  registry.registerSchema(
    'UpdateCategoryRequest',
    stuffSchemas.UpdateCategoryRequest,
  )
  registry.registerSchema('CategoryIdParam', stuffSchemas.CategoryIdParam)

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
    supportProblemSchemas.ProblemIdParam,
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
    supportCommentSchemas.SupportCommentIdParam,
  )
  registry.registerSchema(
    'ProblemIdForCommentsParam',
    supportCommentSchemas.ProblemIdForCommentsParam,
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

  registry.registerSchema('PARQSubmission', userParqSchemas.PARQSubmission)
  registry.registerSchema('PARQStatus', userParqSchemas.PARQStatus)
  registry.registerSchema('PARQResponse', userParqSchemas.PARQResponse)
  registry.registerSchema(
    'SubmitPARQRequest',
    userParqSchemas.SubmitPARQRequest,
  )
  registry.registerSchema(
    'CreatePARQRequest',
    userParqSchemas.CreatePARQRequest,
  )
  registry.registerSchema(
    'UpdatePARQRequest',
    userParqSchemas.UpdatePARQRequest,
  )

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

  registry.registerSchema(
    'ProfessionalProfile',
    userProfessionalSchemas.ProfessionalProfile,
  )
  registry.registerSchema(
    'CreateProfessionalProfileRequest',
    userProfessionalSchemas.CreateProfessionalProfileRequest,
  )
  registry.registerSchema(
    'UpdateProfessionalProfileRequest',
    userProfessionalSchemas.UpdateProfessionalProfileRequest,
  )

  // ============= Register Routes =============
  registerPublicRoutes(registry)
}

/**
 * Register all public API routes
 */
function registerPublicRoutes(registry: SimpleZodRegistry): void {
  // Additional schemas needed for routes
  registry.registerSchema(
    'UserCreditsResponse',
    paymentCreditSchemas.UserCreditsResponse,
  )
  registry.registerSchema('CreditPack', paymentCreditSchemas.CreditPack)
  registry.registerSchema(
    'PurchaseCreditPackRequest',
    paymentCreditSchemas.PurchaseCreditPackRequest,
  )
  registry.registerSchema(
    'PurchaseCreditPackResponse',
    paymentCreditSchemas.PurchaseCreditPackResponse,
  )
  registry.registerSchema(
    'GetUserCreditsResponse',
    paymentCreditSchemas.GetUserCreditsResponse,
  )
  registry.registerSchema(
    'GetCreditPacksResponse',
    paymentCreditSchemas.GetCreditPacksResponse,
  )
  registry.registerSchema('Subscription', subscriptionSchemas.Subscription)
  registry.registerSchema(
    'SubscriptionPlan',
    subscriptionPlanSchemas.SubscriptionPlan,
  )
  registry.registerSchema('Stuff', stuffSchemas.Stuff)
  registry.registerSchema('StuffListResponse', stuffSchemas.StuffListResponse)
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

  // Session routes
  registry.registerRoute({
    method: 'post',
    path: '/sessions/book',
    summary: 'Book a training session',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.CreateBookingRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Booking created',
        content: {
          'application/json': {
            schema: sessionSchemas.BookingConfirmationResponse,
          },
        },
      },
    },
  })

  // Create session route (trainers only)
  registry.registerRoute({
    method: 'post',
    path: '/sessions',
    summary: 'Create a training session',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.CreateSessionRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Session created',
        content: {
          'application/json': {
            schema: sessionSchemas.Session,
          },
        },
      },
      400: {
        description: 'Invalid session data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Cancel session route
  registry.registerRoute({
    method: 'delete',
    path: '/sessions/{sessionId}/cancel',
    summary: 'Cancel a session',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.CancelSessionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session cancelled',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
      404: {
        description: 'Session not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Add session review route
  registry.registerRoute({
    method: 'post',
    path: '/sessions/{sessionId}/reviews',
    summary: 'Add a session review',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.CreateSessionReviewRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Review added',
        content: {
          'application/json': {
            schema: sessionSchemas.SessionReview,
          },
        },
      },
      400: {
        description: 'Invalid review data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Waiting list routes
  registry.registerRoute({
    method: 'post',
    path: '/sessions/{sessionId}/waiting-list',
    summary: 'Join session waiting list',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: waitingListSchemas.JoinWaitingListRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Joined waiting list',
        content: {
          'application/json': {
            schema: waitingListSchemas.JoinWaitingListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/sessions/waiting-list/{id}',
    summary: 'Update waiting list preferences',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: waitingListSchemas.UpdateWaitingListRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Preferences updated',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/sessions/waiting-list/{id}',
    summary: 'Leave waiting list',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: waitingListSchemas.LeaveWaitingListRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Left waiting list',
        content: {
          'application/json': {
            schema: waitingListSchemas.LeaveWaitingListResponse,
          },
        },
      },
    },
  })

  // Extra time request
  registry.registerRoute({
    method: 'put',
    path: '/sessions/{sessionId}/extra-time',
    summary: 'Request extra time for session',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.RequestExtraTimeRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Extra time request processed',
        content: {
          'application/json': {
            schema: sessionSchemas.RequestExtraTimeResponse,
          },
        },
      },
    },
  })

  // Session invitee routes
  registry.registerRoute({
    method: 'post',
    path: '/sessions/{sessionId}/invite',
    summary: 'Invite guests to session',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.InviteGuestRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Invitations sent',
        content: {
          'application/json': {
            schema: sessionSchemas.InviteGuestResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/sessions/{sessionId}/invitees',
    summary: 'Get session invitees',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      query: sessionSchemas.SessionInviteesParams,
    },
    responses: {
      200: {
        description: 'List of invitees',
        content: {
          'application/json': {
            schema: sessionSchemas.SessionInviteesResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/sessions/invitations/{id}',
    summary: 'Update invitation',
    tags: ['Sessions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: sessionSchemas.UpdateInvitationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Invitation updated',
        content: {
          'application/json': {
            schema: sessionSchemas.UpdateInvitationResponse,
          },
        },
      },
    },
  })

  // Gym routes
  registry.registerRoute({
    method: 'get',
    path: '/gyms',
    summary: 'Search gyms',
    tags: ['Gyms'],
    request: {
      query: gymSchemas.SearchGymsRequest,
    },
    responses: {
      200: {
        description: 'List of gyms',
        content: {
          'application/json': {
            schema: gymSchemas.SearchGymsResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/gyms/{gymId}',
    summary: 'Get gym details',
    tags: ['Gyms'],
    request: {
      params: z.object({
        gymId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Gym details',
        content: {
          'application/json': {
            schema: gymSchemas.GymDetailsResponse,
          },
        },
      },
      404: {
        description: 'Gym not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Additional gym routes
  registry.registerRoute({
    method: 'get',
    path: '/gyms/search',
    summary: 'Search gyms by name',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      query: gymSchemas.SearchGymsRequest,
    },
    responses: {
      200: {
        description: 'Search results',
        content: {
          'application/json': {
            schema: gymSchemas.GymSearchResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/gyms/nearby',
    summary: 'Find gyms near a location',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      query: gymSchemas.SearchNearbyGymsQuery,
    },
    responses: {
      200: {
        description: 'Nearby gyms with distance',
        content: {
          'application/json': {
            schema: gymSchemas.NearbyGymsResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/gyms/nearest',
    summary: 'Find the nearest gym to a location',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      query: gymSchemas.FindNearestGymQuery,
    },
    responses: {
      200: {
        description: 'Nearest gym',
        content: {
          'application/json': {
            schema: gymSchemas.GymWithDetailsResponse,
          },
        },
      },
      404: {
        description: 'No gym found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Favorite gym routes
  registry.registerRoute({
    method: 'get',
    path: '/favorites',
    summary: 'Get user favorite gyms',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      query: gymSchemas.GetFavoritesQuery,
    },
    responses: {
      200: {
        description: 'List of favorite gyms',
        content: {
          'application/json': {
            schema: gymSchemas.FavoriteGymsResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/favorites/{gymId}',
    summary: 'Add gym to favorites',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      params: gymSchemas.FavoriteGymIdParam,
    },
    responses: {
      200: {
        description: 'Gym added to favorites',
        content: {
          'application/json': {
            schema: gymSchemas.SuccessResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/favorites/{gymId}',
    summary: 'Remove gym from favorites',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      params: gymSchemas.FavoriteGymIdParam,
    },
    responses: {
      200: {
        description: 'Gym removed from favorites',
        content: {
          'application/json': {
            schema: gymSchemas.SuccessResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/favorites/{gymId}/check',
    summary: 'Check if gym is a favorite',
    tags: ['Gyms'],
    security: [{ bearerAuth: [] }],
    request: {
      params: gymSchemas.FavoriteGymIdParam,
    },
    responses: {
      200: {
        description: 'Favorite status',
        content: {
          'application/json': {
            schema: gymSchemas.CheckFavoriteResponse,
          },
        },
      },
    },
  })

  // Induction routes (user's own)
  registry.registerRoute({
    method: 'get',
    path: '/inductions/my',
    summary: 'Get my induction requests',
    tags: ['Inductions'],
    security: [{ bearerAuth: [] }],
    request: {
      query: inductionSchemas.GetMyInductionsQuery,
    },
    responses: {
      200: {
        description: 'List of user inductions',
        content: {
          'application/json': {
            schema: inductionSchemas.InductionListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/inductions',
    summary: 'Request a gym induction',
    tags: ['Inductions'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: inductionSchemas.CreateInductionRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Induction request created',
        content: {
          'application/json': {
            schema: inductionSchemas.CreateInductionResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/inductions/{id}',
    summary: 'Get induction details',
    tags: ['Inductions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: inductionSchemas.InductionIdParam,
    },
    responses: {
      200: {
        description: 'Induction details',
        content: {
          'application/json': {
            schema: inductionSchemas.InductionResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/inductions/{id}/cancel',
    summary: 'Cancel induction request',
    tags: ['Inductions'],
    security: [{ bearerAuth: [] }],
    request: {
      params: inductionSchemas.InductionIdParam,
    },
    responses: {
      200: {
        description: 'Induction cancelled',
        content: {
          'application/json': {
            schema: inductionSchemas.CancelInductionResponse,
          },
        },
      },
    },
  })

  // Payment routes
  registry.registerRoute({
    method: 'get',
    path: '/credits',
    summary: 'Get user credits',
    tags: ['Payments'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User credits',
        content: {
          'application/json': {
            schema: paymentCreditSchemas.GetUserCreditsResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/credits/packs',
    summary: 'Get available credit packs',
    tags: ['Payments'],
    responses: {
      200: {
        description: 'Available credit packs',
        content: {
          'application/json': {
            schema: paymentCreditSchemas.GetCreditPacksResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/credits/purchase',
    summary: 'Purchase credit pack',
    tags: ['Payments'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: paymentCreditSchemas.PurchaseCreditPackRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Purchase successful',
        content: {
          'application/json': {
            schema: paymentCreditSchemas.PurchaseCreditPackResponse,
          },
        },
      },
      400: {
        description: 'Payment failed',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
      params: supportCommentSchemas.ProblemIdForCommentsParam,
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
      params: supportCommentSchemas.SupportCommentIdParam,
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
      params: supportCommentSchemas.SupportCommentIdParam,
    },
    responses: {
      204: {
        description: 'Comment deleted successfully',
      },
    },
  })
}
