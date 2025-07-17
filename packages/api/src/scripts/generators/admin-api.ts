import { z } from 'zod'

// Updated imports to use @api paths
import type { ZodRegistry } from '@api/common/registry/base.js'
import * as adminBusinessSchemas from '@api/schemas/business/admin/management.js'
import * as adminPaymentSchemas from '@api/schemas/payment/admin/transactions.js'
import * as adminPdfSchemas from '@api/schemas/pdf/admin/voucher-book.js'
import * as pdfParameters from '@api/schemas/pdf/common/parameters.js'
import { UserId } from '@api/schemas/shared/branded.js'
import { ErrorResponse } from '@api/schemas/shared/errors.js'
import { DateTime, UUID } from '@api/schemas/shared/primitives.js'
import { MessageResponse } from '@api/schemas/shared/responses.js'
import * as adminSupportSchemas from '@api/schemas/support/admin/tickets.js'
import * as supportParameterSchemas from '@api/schemas/support/common/parameters.js'
import * as adminUserSchemas from '@api/schemas/user/admin/index.js'
import * as userVerificationSchemas from '@api/schemas/user/public/verification.js'

/**
 * Register all admin API schemas and routes
 */
export function registerAdminAPI(registry: ZodRegistry): void {
  // ============= Business Management Schemas =============
  registry.registerSchema(
    'AdminBusinessListResponse',
    adminBusinessSchemas.AdminBusinessListResponse,
  )

  // ============= Payment/Transaction Schemas =============
  registry.registerSchema(
    'AdminTransactionListResponse',
    adminPaymentSchemas.AdminTransactionListResponse,
  )
  registry.registerSchema(
    'AdminTransactionDetailResponse',
    adminPaymentSchemas.AdminTransactionDetailResponse,
  )
  registry.registerSchema(
    'AdminTransactionQueryParams',
    adminPaymentSchemas.AdminTransactionQueryParams,
  )
  registry.registerSchema(
    'RefundTransactionRequest',
    adminPaymentSchemas.RefundTransactionRequest,
  )
  registry.registerSchema(
    'PaymentStatsResponse',
    adminPaymentSchemas.PaymentStatsResponse,
  )
  registry.registerSchema(
    'PayoutListResponse',
    adminPaymentSchemas.PayoutListResponse,
  )
  registry.registerSchema(
    'CreatePayoutRequest',
    adminPaymentSchemas.CreatePayoutRequest,
  )
  registry.registerSchema('PayoutIdParam', adminPaymentSchemas.PayoutIdParam)

  // ============= Support/Ticket Schemas =============
  registry.registerSchema(
    'AdminTicketListResponse',
    adminSupportSchemas.AdminTicketListResponse,
  )
  registry.registerSchema(
    'AdminTicketDetailResponse',
    adminSupportSchemas.AdminTicketDetailResponse,
  )
  registry.registerSchema(
    'AdminTicketQueryParams',
    adminSupportSchemas.AdminTicketQueryParams,
  )
  registry.registerSchema(
    'AssignTicketRequest',
    adminSupportSchemas.AssignTicketRequest,
  )
  registry.registerSchema(
    'UpdateTicketStatusRequest',
    adminSupportSchemas.UpdateTicketStatusRequest,
  )
  registry.registerSchema(
    'TicketStatsResponse',
    adminSupportSchemas.TicketStatsResponse,
  )
  registry.registerSchema(
    'AgentPerformanceResponse',
    adminSupportSchemas.AgentPerformanceResponse,
  )
  registry.registerSchema(
    'TicketIdParam',
    supportParameterSchemas.TicketIdParam,
  )
  registry.registerSchema(
    'AdminUpdateProblemRequest',
    adminSupportSchemas.AdminUpdateProblemRequest,
  )

  // ============= User Management Schemas =============
  registry.registerSchema(
    'AdminUserListResponse',
    adminUserSchemas.AdminUserListResponse,
  )
  registry.registerSchema(
    'AdminUserDetailResponse',
    adminUserSchemas.AdminUserDetailResponse,
  )
  registry.registerSchema(
    'AdminUserQueryParams',
    adminUserSchemas.AdminUserQueryParams,
  )
  registry.registerSchema(
    'AdminCreateUserRequest',
    adminUserSchemas.AdminCreateUserRequest,
  )
  registry.registerSchema(
    'AdminUpdateUserRequest',
    adminUserSchemas.AdminUpdateUserRequest,
  )
  registry.registerSchema('BanUserRequest', adminUserSchemas.BanUserRequest)
  registry.registerSchema('UnbanUserRequest', adminUserSchemas.UnbanUserRequest)
  registry.registerSchema(
    'AdminUploadUserAvatarRequest',
    adminUserSchemas.AdminUploadUserAvatarRequest,
  )
  registry.registerSchema(
    'AdminUploadUserAvatarResponse',
    adminUserSchemas.AdminUploadUserAvatarResponse,
  )
  registry.registerSchema(
    'UpdateAdminProfileRequest',
    adminUserSchemas.UpdateAdminProfileRequest,
  )
  registry.registerSchema(
    'UserActivityResponse',
    adminUserSchemas.UserActivityResponse,
  )
  registry.registerSchema(
    'UserStatsResponse',
    adminUserSchemas.UserStatsResponse,
  )
  registry.registerSchema(
    'BulkUserActionRequest',
    adminUserSchemas.BulkUserActionRequest,
  )
  registry.registerSchema('UserIdParam', adminUserSchemas.UserIdParam)

  // ============= PDF/Voucher Book Management Schemas =============
  registry.registerSchema(
    'AdminVoucherBookResponse',
    adminPdfSchemas.AdminVoucherBookResponse,
  )
  registry.registerSchema(
    'AdminVoucherBookListResponse',
    adminPdfSchemas.AdminVoucherBookListResponse,
  )
  registry.registerSchema(
    'CreateVoucherBookRequest',
    adminPdfSchemas.CreateVoucherBookRequest,
  )
  registry.registerSchema(
    'UpdateVoucherBookRequest',
    adminPdfSchemas.UpdateVoucherBookRequest,
  )
  registry.registerSchema(
    'PublishVoucherBookRequest',
    adminPdfSchemas.PublishVoucherBookRequest,
  )
  registry.registerSchema(
    'ArchiveVoucherBookRequest',
    adminPdfSchemas.ArchiveVoucherBookRequest,
  )
  registry.registerSchema(
    'GeneratePdfRequest',
    adminPdfSchemas.GeneratePdfRequest,
  )
  registry.registerSchema(
    'GeneratePdfResponse',
    adminPdfSchemas.GeneratePdfResponse,
  )
  registry.registerSchema(
    'BulkVoucherBookOperationRequest',
    adminPdfSchemas.BulkVoucherBookOperationRequest,
  )
  registry.registerSchema(
    'BulkVoucherBookOperationResponse',
    adminPdfSchemas.BulkVoucherBookOperationResponse,
  )
  registry.registerSchema(
    'AdminVoucherBookQueryParams',
    adminPdfSchemas.AdminVoucherBookQueryParams,
  )

  // PDF parameter schemas
  registry.registerSchema(
    'VoucherBookIdParam',
    pdfParameters.VoucherBookIdParam,
  )

  // User Verification Schemas (Admin)
  registry.registerSchema(
    'UnifiedVerificationRequest',
    userVerificationSchemas.UnifiedVerificationRequest,
  )
  registry.registerSchema(
    'UnifiedResendVerificationRequest',
    userVerificationSchemas.UnifiedResendVerificationRequest,
  )
  registry.registerSchema(
    'UnifiedVerificationResponse',
    userVerificationSchemas.UnifiedVerificationResponse,
  )

  // ============= Register Routes =============
  registerAdminRoutes(registry)
}

/**
 * Register all admin API routes
 */
function registerAdminRoutes(registry: ZodRegistry): void {
  // User Management routes
  registry.registerRoute({
    method: 'get',
    path: '/users',
    summary: 'List all users with admin details',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminUserSchemas.AdminUserQueryParams,
    },
    responses: {
      200: {
        description: 'List of users',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminUserSchemas.AdminUserDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/users/{id}',
    summary: 'Get user details',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
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
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/users/{id}/status',
    summary: 'Update user status',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.UpdateUserStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User status updated',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/users/{id}/ban',
    summary: 'Ban user',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              reason: z.string(),
              duration: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User banned',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/users/{id}/unban',
    summary: 'Unban user',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User unbanned',
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
    path: '/users',
    summary: 'Create a new user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminCreateUserRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User created successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      400: {
        description: 'Invalid user data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      409: {
        description: 'User already exists',
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
    path: '/users/{id}',
    summary: 'Update user information (admin)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUpdateUserRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User updated successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
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

  // Delete user route
  registry.registerRoute({
    method: 'delete',
    path: '/users/{id}',
    summary: 'Delete user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      204: {
        description: 'User deleted successfully',
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
    method: 'get',
    path: '/users/email/{email}',
    summary: 'Get user by email',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        email: z.string().email(),
      }),
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
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

  // User Verification routes (Admin)
  registry.registerRoute({
    method: 'post',
    path: '/admin/users/verify',
    summary: 'Admin verifies user email, phone, or account',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userVerificationSchemas.UnifiedVerificationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              user: adminUserSchemas.AdminUserDetailResponse,
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
    path: '/admin/users/resend-verification',
    summary: 'Admin resends verification email or SMS',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userVerificationSchemas.UnifiedResendVerificationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification resent',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
    method: 'get',
    path: '/admin/users/{id}/verification-status',
    summary: 'Get user verification status',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminUserSchemas.UserIdParam,
    },
    responses: {
      200: {
        description: 'User verification status retrieved successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.UserVerificationStatusResponse,
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
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      403: {
        description: 'Forbidden - Admin access required',
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
    path: '/admin/users/{id}/avatar',
    summary: 'Upload avatar for a user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminUserSchemas.UserIdParam,
      body: {
        content: {
          'multipart/form-data': {
            schema: adminUserSchemas.AdminUploadUserAvatarRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Avatar uploaded successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUploadUserAvatarResponse,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
    method: 'get',
    path: '/admin/users/me',
    summary: 'Get current admin user profile',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Admin user profile',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
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
      403: {
        description: 'Forbidden - Admin access required',
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
    path: '/admin/users/me',
    summary: 'Update current admin user profile',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.UpdateAdminProfileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated admin user profile',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
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
      403: {
        description: 'Forbidden - Admin access required',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Transaction Management routes
  registry.registerRoute({
    method: 'get',
    path: '/transactions',
    summary: 'List all transactions',
    tags: ['Transaction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.AdminTransactionQueryParams,
    },
    responses: {
      200: {
        description: 'List of transactions',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminPaymentSchemas.AdminTransactionDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/transactions/{id}',
    summary: 'Get transaction details',
    tags: ['Transaction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Transaction details',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminTransactionDetailResponse,
          },
        },
      },
    },
  })

  // Financial Management routes

  registry.registerRoute({
    method: 'get',
    path: '/payments/reports',
    summary: 'Generate financial reports',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.FinancialReportRequest,
    },
    responses: {
      200: {
        description: 'Financial report data',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.FinancialReportResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/transactions/{id}/refund',
    summary: 'Refund a transaction',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.RefundTransactionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Refund processed',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminTransactionDetailResponse,
          },
        },
      },
      404: {
        description: 'Transaction not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Promo Code Management routes
  registry.registerRoute({
    method: 'post',
    path: '/promo-codes',
    summary: 'Create promo code',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.CreatePromoCodeRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Promo code created',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminPromoCodeDetail,
          },
        },
      },
      400: {
        description: 'Invalid promo code data',
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
    path: '/promo-codes/{id}',
    summary: 'Update promo code',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.UpdatePromoCodeRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Promo code updated',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminPromoCodeDetail,
          },
        },
      },
      404: {
        description: 'Promo code not found',
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
    path: '/promo-codes',
    summary: 'List promo codes',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.PromoCodeSearchParams,
    },
    responses: {
      200: {
        description: 'List of promo codes',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.PromoCodeListResponse,
          },
        },
      },
    },
  })

  // Subscription Plan Management routes
  registry.registerRoute({
    method: 'get',
    path: '/subscriptions',
    summary: 'List all subscriptions',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
        planId: z.string().uuid().optional(),
        userId: UserId.optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    },
    responses: {
      200: {
        description: 'List of subscriptions',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(
                z.object({
                  id: UUID,
                  userId: UserId,
                  planId: UUID,
                  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']),
                  startDate: DateTime,
                  endDate: DateTime.optional(),
                  nextBillingDate: DateTime.optional(),
                }),
              ),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/subscriptions/plans',
    summary: 'Create subscription plan',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.CreateSubscriptionPlanRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Subscription plan created',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminSubscriptionPlanDetail,
          },
        },
      },
      400: {
        description: 'Invalid plan data',
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
    path: '/subscriptions/plans/{id}',
    summary: 'Update subscription plan',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.UpdateSubscriptionPlanRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Subscription plan updated',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminSubscriptionPlanDetail,
          },
        },
      },
      404: {
        description: 'Plan not found',
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
    path: '/subscriptions/plans',
    summary: 'List subscription plans',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.SubscriptionPlanSearchParams,
    },
    responses: {
      200: {
        description: 'List of subscription plans',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.SubscriptionPlanListResponse,
          },
        },
      },
    },
  })

  // Support Ticket Management routes
  registry.registerRoute({
    method: 'get',
    path: '/support/tickets',
    summary: 'List support tickets',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSupportSchemas.AdminTicketQueryParams,
    },
    responses: {
      200: {
        description: 'List of support tickets',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminSupportSchemas.AdminTicketDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/support/tickets/{id}',
    summary: 'Get support ticket details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Support ticket details',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  // Additional Support Management routes
  registry.registerRoute({
    method: 'put',
    path: '/support/tickets/{id}/status',
    summary: 'Update ticket status',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Ticket ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.UpdateTicketStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ticket status updated successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/support/tickets/{id}/assign',
    summary: 'Assign ticket to agent',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Ticket ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.AssignTicketRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ticket assigned successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  // Admin Problem Management routes
  registry.registerRoute({
    method: 'get',
    path: '/admin/problems',
    summary: 'List all problems with admin details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSupportSchemas.AdminTicketQueryParams,
    },
    responses: {
      200: {
        description: 'List of problems',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminSupportSchemas.AdminTicketDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
                hasNext: z.boolean(),
                hasPrevious: z.boolean(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/problems/{id}',
    summary: 'Get problem details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      200: {
        description: 'Problem details',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/admin/problems/{id}',
    summary: 'Update problem',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminUpdateProblemRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Problem updated successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/admin/problems/{id}',
    summary: 'Delete problem',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      204: {
        description: 'Problem deleted successfully',
      },
    },
  })

  // Admin Comment Management routes
  registry.registerRoute({
    method: 'get',
    path: '/admin/comments',
    summary: 'List all comments',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['ASC', 'DESC']).optional(),
      }),
    },
    responses: {
      200: {
        description: 'List of comments',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()), // Should be SupportCommentResponse schema
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
                hasNext: z.boolean(),
                hasPrevious: z.boolean(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/comments/problem/{problemId}',
    summary: 'Get comments by problem ID',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        problemId: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      200: {
        description: 'List of comments for the problem',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()), // Should be SupportCommentResponse schema
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/admin/comments',
    summary: 'Create internal comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              problemId: UUID,
              content: z.string().min(1).max(5000),
              isInternal: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Comment created successfully',
        content: {
          'application/json': {
            schema: z.any(), // Should be SupportCommentResponse schema
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/admin/comments/{id}',
    summary: 'Update any comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Comment ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              content: z.string().min(1).max(5000),
              isInternal: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Comment updated successfully',
        content: {
          'application/json': {
            schema: z.any(), // Should be SupportCommentResponse schema
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/admin/comments/{id}',
    summary: 'Delete any comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Comment ID'),
      }),
    },
    responses: {
      204: {
        description: 'Comment deleted successfully',
      },
    },
  })

  // Communication Management routes
  registry.registerRoute({
    method: 'post',
    path: '/templates/seed',
    summary: 'Seed default email/SMS templates',
    tags: ['Communication Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: 'Templates seeded successfully',
        content: {
          'application/json': {
            schema: z.object({
              created: z.number(),
              message: z.string(),
            }),
          },
        },
      },
    },
  })

  // ============= PDF/Voucher Book Management Routes =============

  // Get all voucher books
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books',
    summary: 'List all voucher books with admin details',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPdfSchemas.AdminVoucherBookQueryParams,
    },
    responses: {
      200: {
        description: 'List of voucher books',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookListResponse,
          },
        },
      },
    },
  })

  // Get voucher book by ID
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books/{id}',
    summary: 'Get voucher book details',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'Voucher book details',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
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

  // Create voucher book
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books',
    summary: 'Create a new voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.CreateVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Voucher book created successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
          },
        },
      },
      400: {
        description: 'Invalid voucher book data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update voucher book
  registry.registerRoute({
    method: 'put',
    path: '/admin/voucher-books/{id}',
    summary: 'Update voucher book information',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.UpdateVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher book updated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
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

  // Delete voucher book
  registry.registerRoute({
    method: 'delete',
    path: '/admin/voucher-books/{id}',
    summary: 'Delete a voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      204: {
        description: 'Voucher book deleted successfully',
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

  // Update voucher book status
  registry.registerRoute({
    method: 'patch',
    path: '/admin/voucher-books/{id}/status',
    summary: 'Update voucher book status',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.PublishVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher book status updated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
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

  // Generate PDF
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books/{id}/generate-pdf',
    summary: 'Generate PDF for voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.GeneratePdfRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'PDF generated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.GeneratePdfResponse,
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

  // Bulk archive voucher books
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books/bulk-archive',
    summary: 'Archive multiple voucher books',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.BulkVoucherBookOperationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher books archived successfully',
        content: {
          'application/json': {
            schema: z.object({
              archived: z.number().describe('Number of books archived'),
              failed: z
                .number()
                .describe('Number of books that failed to archive'),
              errors: z
                .array(z.string())
                .describe('Error messages for failed operations'),
            }),
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get voucher book statistics
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books/statistics',
    summary: 'Get voucher book statistics',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {},
    responses: {
      200: {
        description: 'Voucher book statistics',
        content: {
          'application/json': {
            schema: adminPdfSchemas.BulkVoucherBookOperationResponse,
          },
        },
      },
    },
  })
}
