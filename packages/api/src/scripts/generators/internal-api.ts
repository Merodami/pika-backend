import { z } from 'zod'

import type { SimpleZodRegistry } from '../../common/registry/simple.js'
import {
  ErrorResponse,
  MessageResponse,
} from '../../common/schemas/responses.js'
import * as internalAuthSchemas from '../../internal/schemas/auth/service.js'
import * as internalCommunicationSchemas from '../../internal/schemas/communication/service.js'
import * as internalDiscoverySchemas from '../../internal/schemas/discovery/service.js'
import * as healthSchemas from '../../internal/schemas/health.js'
import * as internalSessionSchemas from '../../internal/schemas/session/service.js'
import * as internalSubscriptionSchemas from '../../internal/schemas/subscription/service.js'
import * as internalUserSchemas from '../../internal/schemas/user/service.js'

/**
 * Register all internal API schemas and routes
 */
export function registerInternalAPI(registry: SimpleZodRegistry): void {
  // ============= Health & Discovery Schemas =============
  registry.registerSchema('ServiceHealth', healthSchemas.ServiceHealth)
  registry.registerSchema(
    'ServiceRegistryQuery',
    internalDiscoverySchemas.ServiceRegistryQuery,
  )
  registry.registerSchema(
    'ServiceRegistryResponse',
    internalDiscoverySchemas.ServiceRegistryResponse,
  )
  registry.registerSchema(
    'RegisterServiceRequest',
    internalDiscoverySchemas.RegisterServiceRequest,
  )
  registry.registerSchema(
    'RegisterServiceResponse',
    internalDiscoverySchemas.RegisterServiceResponse,
  )
  registry.registerSchema(
    'ServiceEndpointsResponse',
    internalDiscoverySchemas.ServiceEndpointsResponse,
  )
  registry.registerSchema(
    'DeregisterServiceRequest',
    internalDiscoverySchemas.DeregisterServiceRequest,
  )
  registry.registerSchema(
    'DeregisterServiceResponse',
    internalDiscoverySchemas.DeregisterServiceResponse,
  )
  registry.registerSchema(
    'ServiceConfigResponse',
    internalDiscoverySchemas.ServiceConfigResponse,
  )

  // ============= Auth Service Schemas =============
  registry.registerSchema(
    'ValidateTokenRequest',
    internalAuthSchemas.ValidateTokenRequest,
  )
  registry.registerSchema(
    'TokenValidationResponse',
    internalAuthSchemas.TokenValidationResponse,
  )
  registry.registerSchema(
    'GetUserByEmailRequest',
    internalAuthSchemas.GetUserByEmailRequest,
  )
  registry.registerSchema(
    'AuthUserResponse',
    internalAuthSchemas.AuthUserResponse,
  )
  registry.registerSchema(
    'InitiatePasswordResetRequest',
    internalAuthSchemas.InitiatePasswordResetRequest,
  )
  registry.registerSchema(
    'PasswordResetResponse',
    internalAuthSchemas.PasswordResetResponse,
  )
  registry.registerSchema(
    'ConfirmPasswordResetRequest',
    internalAuthSchemas.ConfirmPasswordResetRequest,
  )
  registry.registerSchema(
    'VerifyAccountRequest',
    internalAuthSchemas.VerifyAccountRequest,
  )
  registry.registerSchema(
    'AccountVerificationResponse',
    internalAuthSchemas.AccountVerificationResponse,
  )
  registry.registerSchema(
    'CreateServiceSessionRequest',
    internalAuthSchemas.CreateServiceSessionRequest,
  )
  registry.registerSchema(
    'ServiceSessionResponse',
    internalAuthSchemas.ServiceSessionResponse,
  )
  registry.registerSchema(
    'CheckUserRoleRequest',
    internalAuthSchemas.CheckUserRoleRequest,
  )
  registry.registerSchema(
    'RoleCheckResponse',
    internalAuthSchemas.RoleCheckResponse,
  )
  registry.registerSchema(
    'ValidateServiceKeyRequest',
    internalAuthSchemas.ValidateServiceKeyRequest,
  )
  registry.registerSchema(
    'ServiceKeyValidationResponse',
    internalAuthSchemas.ServiceKeyValidationResponse,
  )

  // ============= Communication Service Schemas =============
  registry.registerSchema(
    'SendSystemNotificationRequest',
    internalCommunicationSchemas.SendSystemNotificationRequest,
  )
  registry.registerSchema(
    'SendSystemNotificationResponse',
    internalCommunicationSchemas.SendSystemNotificationResponse,
  )
  registry.registerSchema(
    'SendTransactionalEmailRequest',
    internalCommunicationSchemas.SendTransactionalEmailRequest,
  )
  registry.registerSchema(
    'SendTransactionalEmailResponse',
    internalCommunicationSchemas.SendTransactionalEmailResponse,
  )
  registry.registerSchema(
    'SendSMSRequest',
    internalCommunicationSchemas.SendSMSRequest,
  )
  registry.registerSchema(
    'SendSMSResponse',
    internalCommunicationSchemas.SendSMSResponse,
  )
  registry.registerSchema(
    'SendPushNotificationRequest',
    internalCommunicationSchemas.SendPushNotificationRequest,
  )
  registry.registerSchema(
    'SendPushNotificationResponse',
    internalCommunicationSchemas.SendPushNotificationResponse,
  )
  registry.registerSchema(
    'GetUserCommunicationPreferencesRequest',
    internalCommunicationSchemas.GetUserCommunicationPreferencesRequest,
  )
  registry.registerSchema(
    'UserCommunicationPreferencesResponse',
    internalCommunicationSchemas.UserCommunicationPreferencesResponse,
  )
  registry.registerSchema(
    'SendEmailRequest',
    internalCommunicationSchemas.SendEmailRequest,
  )
  registry.registerSchema(
    'SendEmailResponse',
    internalCommunicationSchemas.SendEmailResponse,
  )
  registry.registerSchema(
    'BulkEmailRequest',
    internalCommunicationSchemas.BulkEmailRequest,
  )
  registry.registerSchema(
    'BulkEmailResponse',
    internalCommunicationSchemas.BulkEmailResponse,
  )
  registry.registerSchema(
    'CreateNotificationRequest',
    internalCommunicationSchemas.CreateNotificationRequest,
  )
  registry.registerSchema(
    'CreateNotificationResponse',
    internalCommunicationSchemas.CreateNotificationResponse,
  )
  registry.registerSchema(
    'BatchUpdateNotificationStatusRequest',
    internalCommunicationSchemas.BatchUpdateNotificationStatusRequest,
  )
  registry.registerSchema(
    'BatchUpdateResponse',
    internalCommunicationSchemas.BatchUpdateResponse,
  )

  // ============= Session Service Schemas =============
  registry.registerSchema(
    'InternalSessionData',
    internalSessionSchemas.InternalSessionData,
  )
  registry.registerSchema(
    'ValidateSessionRequest',
    internalSessionSchemas.ValidateSessionRequest,
  )
  registry.registerSchema(
    'SessionValidationResponse',
    internalSessionSchemas.SessionValidationResponse,
  )
  registry.registerSchema(
    'CheckBookingEligibilityRequest',
    internalSessionSchemas.CheckBookingEligibilityRequest,
  )
  registry.registerSchema(
    'BookingEligibilityResponse',
    internalSessionSchemas.BookingEligibilityResponse,
  )
  registry.registerSchema(
    'ProcessBookingRequest',
    internalSessionSchemas.ProcessBookingRequest,
  )
  registry.registerSchema(
    'ProcessBookingResponse',
    internalSessionSchemas.ProcessBookingResponse,
  )
  registry.registerSchema(
    'BatchSessionStatusUpdateRequest',
    internalSessionSchemas.BatchSessionStatusUpdateRequest,
  )
  registry.registerSchema(
    'BatchUpdateResponse',
    internalSessionSchemas.SessionBatchUpdateResponse,
  )
  registry.registerSchema(
    'GetUserBookingsRequest',
    internalSessionSchemas.GetUserBookingsRequest,
  )
  registry.registerSchema(
    'UserBookingsResponse',
    internalSessionSchemas.UserBookingsResponse,
  )
  registry.registerSchema(
    'GetProfessionalScheduleRequest',
    internalSessionSchemas.GetProfessionalScheduleRequest,
  )
  registry.registerSchema(
    'ProfessionalScheduleResponse',
    internalSessionSchemas.ProfessionalScheduleResponse,
  )
  registry.registerSchema(
    'SessionConflictCheckRequest',
    internalSessionSchemas.SessionConflictCheckRequest,
  )
  registry.registerSchema(
    'SessionConflictResponse',
    internalSessionSchemas.SessionConflictResponse,
  )
  registry.registerSchema(
    'SessionStatsRequest',
    internalSessionSchemas.SessionStatsRequest,
  )
  registry.registerSchema(
    'SessionStatsResponse',
    internalSessionSchemas.SessionStatsResponse,
  )

  // ============= User Service Schemas =============
  registry.registerSchema(
    'InternalUserData',
    internalUserSchemas.InternalUserData,
  )
  registry.registerSchema(
    'VerifyUserRequest',
    internalUserSchemas.VerifyUserRequest,
  )
  registry.registerSchema(
    'VerifyUserResponse',
    internalUserSchemas.VerifyUserResponse,
  )
  registry.registerSchema(
    'GetUsersRequest',
    internalUserSchemas.GetUsersRequest,
  )
  registry.registerSchema(
    'GetUsersResponse',
    internalUserSchemas.GetUsersResponse,
  )
  registry.registerSchema(
    'UpdateUserCreditsRequest',
    internalUserSchemas.UpdateUserCreditsRequest,
  )
  registry.registerSchema(
    'UpdateUserCreditsResponse',
    internalUserSchemas.UpdateUserCreditsResponse,
  )
  registry.registerSchema(
    'CheckUserPermissionRequest',
    internalUserSchemas.CheckUserPermissionRequest,
  )
  registry.registerSchema(
    'CheckUserPermissionResponse',
    internalUserSchemas.CheckUserPermissionResponse,
  )
  registry.registerSchema(
    'GetUserSubscriptionStatusRequest',
    internalUserSchemas.GetUserSubscriptionStatusRequest,
  )
  registry.registerSchema(
    'UserSubscriptionStatusResponse',
    internalUserSchemas.UserSubscriptionStatusResponse,
  )
  registry.registerSchema(
    'GetUserAuthDataByEmailRequest',
    internalUserSchemas.GetUserAuthDataByEmailRequest,
  )
  registry.registerSchema('UserAuthData', internalUserSchemas.UserAuthData)
  registry.registerSchema(
    'CreateUserRequest',
    internalUserSchemas.CreateUserRequest,
  )
  registry.registerSchema(
    'UpdateLastLoginRequest',
    internalUserSchemas.UpdateLastLoginRequest,
  )
  registry.registerSchema(
    'CreatePasswordResetTokenRequest',
    internalUserSchemas.CreatePasswordResetTokenRequest,
  )
  registry.registerSchema(
    'PasswordResetTokenResponse',
    internalUserSchemas.PasswordResetTokenResponse,
  )
  registry.registerSchema(
    'ValidatePasswordResetTokenRequest',
    internalUserSchemas.ValidatePasswordResetTokenRequest,
  )
  registry.registerSchema(
    'UpdatePasswordRequest',
    internalUserSchemas.UpdatePasswordRequest,
  )
  registry.registerSchema(
    'CreateEmailVerificationTokenRequest',
    internalUserSchemas.CreateEmailVerificationTokenRequest,
  )
  registry.registerSchema(
    'EmailVerificationTokenResponse',
    internalUserSchemas.EmailVerificationTokenResponse,
  )
  registry.registerSchema(
    'ValidateEmailVerificationTokenRequest',
    internalUserSchemas.ValidateEmailVerificationTokenRequest,
  )
  registry.registerSchema(
    'VerifyEmailRequest',
    internalUserSchemas.VerifyEmailRequest,
  )
  registry.registerSchema(
    'CheckEmailExistsRequest',
    internalUserSchemas.CheckEmailExistsRequest,
  )
  registry.registerSchema(
    'CheckPhoneExistsRequest',
    internalUserSchemas.CheckPhoneExistsRequest,
  )
  registry.registerSchema('ExistsResponse', internalUserSchemas.ExistsResponse)
  registry.registerSchema('UserIdParam', internalUserSchemas.UserIdParam)
  registry.registerSchema('EmailParam', internalUserSchemas.EmailParam)
  registry.registerSchema('PhoneParam', internalUserSchemas.PhoneParam)

  // ============= Subscription Service Schemas =============
  registry.registerSchema(
    'InternalSubscriptionData',
    internalSubscriptionSchemas.InternalSubscriptionData,
  )
  registry.registerSchema(
    'CheckSubscriptionRequest',
    internalSubscriptionSchemas.CheckSubscriptionRequest,
  )
  registry.registerSchema(
    'SubscriptionCheckResponse',
    internalSubscriptionSchemas.SubscriptionCheckResponse,
  )
  registry.registerSchema(
    'ProcessSubscriptionUsageRequest',
    internalSubscriptionSchemas.ProcessSubscriptionUsageRequest,
  )
  registry.registerSchema(
    'UsageProcessingResponse',
    internalSubscriptionSchemas.UsageProcessingResponse,
  )
  registry.registerSchema(
    'CreateStripeSubscriptionRequest',
    internalSubscriptionSchemas.CreateStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'UpdateStripeSubscriptionRequest',
    internalSubscriptionSchemas.UpdateStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'CancelStripeSubscriptionRequest',
    internalSubscriptionSchemas.CancelStripeSubscriptionRequest,
  )
  registry.registerSchema(
    'StripeSubscriptionResponse',
    internalSubscriptionSchemas.StripeSubscriptionResponse,
  )
  registry.registerSchema(
    'GetUserSubscriptionsRequest',
    internalSubscriptionSchemas.GetUserSubscriptionsRequest,
  )
  registry.registerSchema(
    'UserSubscriptionsResponse',
    internalSubscriptionSchemas.UserSubscriptionsResponse,
  )
  registry.registerSchema(
    'SubscriptionWebhookEvent',
    internalSubscriptionSchemas.SubscriptionWebhookEvent,
  )
  registry.registerSchema(
    'ProcessWebhookResponse',
    internalSubscriptionSchemas.ProcessWebhookResponse,
  )

  // ============= Payment Service Schemas =============
  // TODO: Add payment service schemas when available

  // ============= Register Routes =============
  registerInternalRoutes(registry)
}

/**
 * Register all internal API routes
 */
function registerInternalRoutes(registry: SimpleZodRegistry): void {
  // Health check route
  registry.registerRoute({
    method: 'get',
    path: '/health',
    summary: 'Service health check',
    tags: ['Health'],
    security: [{ 'x-api-key': [] }],
    responses: {
      200: {
        description: 'Service is healthy',
        content: {
          'application/json': {
            schema: healthSchemas.ServiceHealth,
          },
        },
      },
    },
  })

  // Service Registry route
  registry.registerRoute({
    method: 'get',
    path: '/services/registry',
    summary: 'Get service registry',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      query: internalDiscoverySchemas.ServiceRegistryQuery,
    },
    responses: {
      200: {
        description: 'Service registry',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceRegistryResponse,
          },
        },
      },
    },
  })

  // Register service route
  registry.registerRoute({
    method: 'post',
    path: '/services/register',
    summary: 'Register service instance',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.RegisterServiceRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Service registered',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.RegisterServiceResponse,
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

  // Deregister service route
  registry.registerRoute({
    method: 'delete',
    path: '/services/{instanceId}/deregister',
    summary: 'Deregister service instance',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        instanceId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.DeregisterServiceRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Service deregistered',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.DeregisterServiceResponse,
          },
        },
      },
      404: {
        description: 'Service instance not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get service endpoints route
  registry.registerRoute({
    method: 'get',
    path: '/services/{serviceName}/endpoints',
    summary: 'Get service endpoints',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        serviceName: z.string(),
      }),
      query: z.object({
        environment: internalDiscoverySchemas.EnvironmentType.optional(),
        healthyOnly: z.boolean().default(true),
      }),
    },
    responses: {
      200: {
        description: 'Service endpoints',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceEndpointsResponse,
          },
        },
      },
      404: {
        description: 'Service not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get service configuration route
  registry.registerRoute({
    method: 'get',
    path: '/config/{serviceName}',
    summary: 'Get service configuration',
    tags: ['Service Discovery'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        serviceName: z.string(),
      }),
      query: internalDiscoverySchemas.ServiceConfigRequest,
    },
    responses: {
      200: {
        description: 'Service configuration',
        content: {
          'application/json': {
            schema: internalDiscoverySchemas.ServiceConfigResponse,
          },
        },
      },
      404: {
        description: 'Service configuration not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Auth Service Internal Routes
  registry.registerRoute({
    method: 'post',
    path: '/auth/validate-token',
    summary: 'Validate JWT token',
    tags: ['Auth Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalAuthSchemas.ValidateTokenRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token validation result',
        content: {
          'application/json': {
            schema: internalAuthSchemas.TokenValidationResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/auth/user-by-email',
    summary: 'Get user by email',
    tags: ['Auth Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalAuthSchemas.GetUserByEmailRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: internalAuthSchemas.AuthUserResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Communication Service Internal Routes
  registry.registerRoute({
    method: 'post',
    path: '/notifications/system',
    summary: 'Send system notification',
    tags: ['Communication Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendSystemNotificationRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Notification sent',
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendSystemNotificationResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/emails/transactional',
    summary: 'Send transactional email',
    tags: ['Communication Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendTransactionalEmailRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Email sent',
        content: {
          'application/json': {
            schema: internalCommunicationSchemas.SendTransactionalEmailResponse,
          },
        },
      },
    },
  })

  // Session Service Internal Routes
  registry.registerRoute({
    method: 'get',
    path: '/sessions/{id}',
    summary: 'Get session by ID',
    tags: ['Session Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Session details',
        content: {
          'application/json': {
            schema: internalSessionSchemas.SessionResponse,
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

  registry.registerRoute({
    method: 'post',
    path: '/sessions/conflicts',
    summary: 'Check for scheduling conflicts',
    tags: ['Session Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalSessionSchemas.ConflictCheckRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Conflict check result',
        content: {
          'application/json': {
            schema: internalSessionSchemas.ConflictCheckResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/sessions/by-user/{userId}',
    summary: 'Get sessions by user',
    tags: ['Session Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        userId: z.string().uuid(),
      }),
      query: z.object({
        status: z.string().optional(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'User sessions',
        content: {
          'application/json': {
            schema: z.array(internalSessionSchemas.SessionResponse),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/sessions/{id}/status',
    summary: 'Update session status',
    tags: ['Session Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: internalSessionSchemas.UpdateSessionStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session updated',
        content: {
          'application/json': {
            schema: internalSessionSchemas.SessionResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/sessions/batch/status',
    summary: 'Batch update session statuses',
    tags: ['Session Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalSessionSchemas.BatchUpdateSessionStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Sessions updated',
        content: {
          'application/json': {
            schema: z.object({
              updated: z.number(),
              failed: z.number(),
            }),
          },
        },
      },
    },
  })

  // User Service Internal Routes
  registry.registerRoute({
    method: 'get',
    path: '/users/{id}',
    summary: 'Get user details',
    tags: ['User Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: internalUserSchemas.InternalUserData,
          },
        },
      },
      404: {
        description: 'User not found',
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
    path: '/users/batch',
    summary: 'Get multiple users',
    tags: ['User Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: internalUserSchemas.GetUsersRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User list',
        content: {
          'application/json': {
            schema: z.array(internalUserSchemas.InternalUserData),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/users/{id}',
    summary: 'Update user internally',
    tags: ['User Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: internalUserSchemas.UpdateUserCreditsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User updated',
        content: {
          'application/json': {
            schema: internalUserSchemas.InternalUserData,
          },
        },
      },
    },
  })

  // Subscription Service Internal Routes
  registry.registerRoute({
    method: 'post',
    path: '/subscriptions/process-credits',
    summary: 'Process subscription credits',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.AllocateSubscriptionCreditsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Credits processed',
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
    path: '/subscriptions/user-membership',
    summary: 'Update user membership status',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.UpdateSubscriptionFromPaymentRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Membership updated',
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
    path: '/subscriptions/from-stripe',
    summary: 'Create subscription from Stripe',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.GetSubscriptionByStripeIdRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Subscription created',
        content: {
          'application/json': {
            schema: z.object({
              id: z.string(),
              status: z.string(),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/subscriptions/status',
    summary: 'Update subscription status',
    tags: ['Subscription Service'],
    security: [{ 'x-api-key': [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema:
              internalSubscriptionSchemas.ProcessSubscriptionWebhookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Status updated',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })
}
