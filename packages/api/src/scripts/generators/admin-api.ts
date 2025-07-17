import { z } from 'zod'

import * as dashboardSchemas from '../../admin/schemas/dashboard.js'
import * as adminGymSchemas from '../../admin/schemas/gym/management.js'
import * as stuffSchemas from '../../admin/schemas/gym/stuff.js'
import * as adminPaymentSchemas from '../../admin/schemas/payment/transactions.js'
import * as adminSessionAnalyticsSchemas from '../../admin/schemas/session/analytics.js'
import * as adminSessionBookingStatsSchemas from '../../admin/schemas/session/bookingStats.js'
import * as adminSessionSchemas from '../../admin/schemas/session/management.js'
import * as adminSupportSchemas from '../../admin/schemas/support/tickets.js'
import * as adminUserSchemas from '../../admin/schemas/user/index.js'
import * as adminPdfSchemas from '../../admin/schemas/pdf/management.js'
import type { SimpleZodRegistry } from '../../common/registry/simple.js'
import { UserId } from '../../common/schemas/branded.js'
import * as pdfParameters from '../../common/schemas/pdf/parameters.js'
import { DateTime, UUID } from '../../common/schemas/primitives.js'
import {
  ErrorResponse,
  MessageResponse,
} from '../../common/schemas/responses.js'
import * as gymSchemas from '../../public/schemas/gym/gym.js'
import * as inductionSchemas from '../../public/schemas/gym/induction.js'
import * as userVerificationSchemas from '../../public/schemas/user/verification.js'

/**
 * Register all admin API schemas and routes
 */
export function registerAdminAPI(registry: SimpleZodRegistry): void {
  // ============= Dashboard Schemas =============
  registry.registerSchema(
    'DashboardStatsResponse',
    dashboardSchemas.DashboardStatsResponse,
  )
  registry.registerSchema(
    'RevenueChartResponse',
    dashboardSchemas.RevenueChartResponse,
  )
  registry.registerSchema(
    'UserGrowthResponse',
    dashboardSchemas.UserGrowthResponse,
  )
  registry.registerSchema(
    'DashboardDateRangeParams',
    dashboardSchemas.DashboardDateRangeParams,
  )

  // ============= Gym Management Schemas =============
  registry.registerSchema(
    'AdminGymListResponse',
    adminGymSchemas.AdminGymListResponse,
  )
  registry.registerSchema('AdminGymDetailResponse', adminGymSchemas.AdminGym)
  registry.registerSchema('NearbyGymsQuery', adminGymSchemas.NearbyGymsQuery)
  registry.registerSchema('NearestGymQuery', adminGymSchemas.NearestGymQuery)
  registry.registerSchema(
    'AdminGymQueryParams',
    adminGymSchemas.AdminGymSearchParams,
  )
  registry.registerSchema(
    'AdminCreateGymRequest',
    adminGymSchemas.CreateGymRequest,
  )
  registry.registerSchema(
    'AdminUpdateGymRequest',
    adminGymSchemas.UpdateGymRequest,
  )
  registry.registerSchema(
    'ApproveGymRequest',
    adminGymSchemas.ApproveGymRequest,
  )
  registry.registerSchema(
    'SuspendGymRequest',
    adminGymSchemas.SuspendGymRequest,
  )
  registry.registerSchema(
    'GymOwnerAssignmentRequest',
    adminGymSchemas.GymOwnerAssignmentRequest,
  )
  registry.registerSchema('GymStatsResponse', adminGymSchemas.GymStatsResponse)
  registry.registerSchema(
    'UpdateGymStatusRequest',
    adminGymSchemas.UpdateGymStatusRequest,
  )

  // Register gym relation schemas
  registry.registerSchema('GymMember', adminGymSchemas.GymMember)
  registry.registerSchema('GymTrainer', adminGymSchemas.GymTrainer)
  registry.registerSchema('GymReview', adminGymSchemas.GymReview)

  // Register gym enums
  registry.registerSchema(
    'GymVerificationStatus',
    adminGymSchemas.GymVerificationStatus,
  )
  registry.registerSchema('GymTier', adminGymSchemas.GymTier)
  registry.registerSchema(
    'GymSubscriptionStatus',
    adminGymSchemas.GymSubscriptionStatus,
  )
  registry.registerSchema('MemberStatus', adminGymSchemas.MemberStatus)
  registry.registerSchema('TrainerStatus', adminGymSchemas.TrainerStatus)

  // Additional gym schemas from public API needed for admin
  registry.registerSchema('CreateGymRequest', gymSchemas.CreateGymRequest)
  registry.registerSchema('GymHourlyPrice', gymSchemas.GymHourlyPrice)
  registry.registerSchema('GymSpecialPrice', gymSchemas.GymSpecialPrice)
  registry.registerSchema('UpdateGymRequest', gymSchemas.UpdateGymRequest)
  registry.registerSchema('GymDetailsResponse', gymSchemas.GymDetailsResponse)
  registry.registerSchema(
    'GymWithDetailsResponse',
    gymSchemas.GymWithDetailsResponse,
  )
  registry.registerSchema(
    'UploadGymPictureResponse',
    gymSchemas.UploadGymPictureResponse,
  )
  registry.registerSchema('GymIdParam', gymSchemas.GymIdParam)

  // Stuff management schemas
  registry.registerSchema('AdminStuff', stuffSchemas.AdminStuff)
  registry.registerSchema(
    'AdminStuffListResponse',
    stuffSchemas.AdminStuffListResponse,
  )
  registry.registerSchema('CreateStuffRequest', stuffSchemas.CreateStuffRequest)
  registry.registerSchema('UpdateStuffRequest', stuffSchemas.UpdateStuffRequest)
  registry.registerSchema('StuffIdParam', stuffSchemas.StuffIdParam)
  registry.registerSchema(
    'AdminStuffSearchParams',
    stuffSchemas.AdminStuffSearchParams,
  )
  registry.registerSchema(
    'BulkUpdateStuffRequest',
    stuffSchemas.BulkUpdateStuffRequest,
  )
  registry.registerSchema(
    'BulkDeleteStuffRequest',
    stuffSchemas.BulkDeleteStuffRequest,
  )

  // Induction management schemas
  registry.registerSchema(
    'InductionListResponse',
    inductionSchemas.InductionListResponse,
  )
  registry.registerSchema(
    'InductionSearchParams',
    inductionSchemas.InductionSearchParams,
  )
  registry.registerSchema(
    'InductionGymIdParam',
    inductionSchemas.InductionGymIdParam,
  )
  registry.registerSchema(
    'GetGymInductionsQuery',
    inductionSchemas.GetGymInductionsQuery,
  )
  registry.registerSchema(
    'UpdateInductionStatusRequest',
    inductionSchemas.UpdateInductionStatusRequest,
  )
  registry.registerSchema(
    'UpdateInductionStatusResponse',
    inductionSchemas.UpdateInductionStatusResponse,
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

  // ============= Session Management Schemas =============
  registry.registerSchema('AdminSession', adminSessionSchemas.AdminSession)
  registry.registerSchema(
    'AdminSessionListResponse',
    adminSessionSchemas.AdminSessionListResponse,
  )
  registry.registerSchema(
    'AdminSessionDetailResponse',
    adminSessionSchemas.AdminSessionDetailResponse,
  )
  registry.registerSchema('SessionIdParam', adminSessionSchemas.SessionIdParam)
  registry.registerSchema(
    'AdminSessionQueryParams',
    adminSessionSchemas.AdminSessionQueryParams,
  )
  registry.registerSchema(
    'AdminUpdateSessionRequest',
    adminSessionSchemas.AdminUpdateSessionRequest,
  )
  registry.registerSchema(
    'AdminCancelSessionRequest',
    adminSessionSchemas.AdminCancelSessionRequest,
  )
  registry.registerSchema(
    'AdminCreateSessionRequest',
    adminSessionSchemas.AdminCreateSessionRequest,
  )
  registry.registerSchema(
    'AdminBookSessionRequest',
    adminSessionSchemas.AdminBookSessionRequest,
  )
  registry.registerSchema(
    'BulkSessionActionRequest',
    adminSessionSchemas.BulkSessionActionRequest,
  )
  registry.registerSchema(
    'SessionConflictResponse',
    adminSessionSchemas.SessionConflictResponse,
  )
  registry.registerSchema(
    'ReassignSessionRequest',
    adminSessionSchemas.ReassignSessionRequest,
  )
  registry.registerSchema(
    'AdminAvailableSlotsRequest',
    adminSessionSchemas.AdminAvailableSlotsRequest,
  )
  registry.registerSchema(
    'AdminAvailableSlotsResponse',
    adminSessionSchemas.AdminAvailableSlotsResponse,
  )

  // ============= Session Analytics Schemas =============
  registry.registerSchema(
    'SessionAnalyticsResponse',
    adminSessionAnalyticsSchemas.SessionAnalyticsResponse,
  )
  registry.registerSchema(
    'SessionAnalyticsQuery',
    adminSessionAnalyticsSchemas.SessionAnalyticsQuery,
  )
  registry.registerSchema(
    'BookingTrendsResponse',
    adminSessionAnalyticsSchemas.BookingTrendsResponse,
  )
  registry.registerSchema(
    'ProfessionalPerformanceResponse',
    adminSessionAnalyticsSchemas.ProfessionalPerformanceResponse,
  )
  registry.registerSchema(
    'SessionTypeBreakdownResponse',
    adminSessionAnalyticsSchemas.SessionTypeBreakdownResponse,
  )
  registry.registerSchema(
    'CancellationAnalyticsResponse',
    adminSessionAnalyticsSchemas.CancellationAnalyticsResponse,
  )
  registry.registerSchema(
    'RevenueBySessionResponse',
    adminSessionAnalyticsSchemas.RevenueBySessionResponse,
  )
  registry.registerSchema(
    'UtilizationReportResponse',
    adminSessionAnalyticsSchemas.UtilizationReportResponse,
  )

  // ============= Session Booking Stats Schemas =============
  registry.registerSchema(
    'GetUserBookingStatsRequest',
    adminSessionBookingStatsSchemas.GetUserBookingStatsRequest,
  )
  registry.registerSchema(
    'UserBookingStats',
    adminSessionBookingStatsSchemas.UserBookingStats,
  )
  registry.registerSchema(
    'GetUserBookingStatsResponse',
    adminSessionBookingStatsSchemas.GetUserBookingStatsResponse,
  )

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
  registry.registerSchema('TicketIdParam', adminSupportSchemas.TicketIdParam)
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
    'UpdateVoucherBookStatusRequest',
    adminPdfSchemas.UpdateVoucherBookStatusRequest,
  )
  registry.registerSchema(
    'GeneratePDFRequest',
    adminPdfSchemas.GeneratePDFRequest,
  )
  registry.registerSchema(
    'GeneratePDFResponse',
    adminPdfSchemas.GeneratePDFResponse,
  )
  registry.registerSchema(
    'BulkArchiveVoucherBooksRequest',
    adminPdfSchemas.BulkArchiveVoucherBooksRequest,
  )
  registry.registerSchema(
    'AdminVoucherBookQueryParams',
    adminPdfSchemas.AdminVoucherBookQueryParams,
  )
  registry.registerSchema(
    'VoucherBookStatsQueryParams',
    adminPdfSchemas.VoucherBookStatsQueryParams,
  )
  registry.registerSchema(
    'VoucherBookStatisticsResponse',
    adminPdfSchemas.VoucherBookStatisticsResponse,
  )
  
  // PDF parameter schemas
  registry.registerSchema('VoucherBookIdParam', pdfParameters.VoucherBookIdParam)

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
function registerAdminRoutes(registry: SimpleZodRegistry): void {
  // Dashboard route
  registry.registerRoute({
    method: 'get',
    path: '/dashboard/stats',
    summary: 'Get dashboard statistics',
    tags: ['Dashboard'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Dashboard statistics',
        content: {
          'application/json': {
            schema: dashboardSchemas.DashboardStats,
          },
        },
      },
    },
  })

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

  // Gym Management routes
  registry.registerRoute({
    method: 'get',
    path: '/gyms',
    summary: 'List all gyms with admin details',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminGymSchemas.AdminGymSearchParams,
    },
    responses: {
      200: {
        description: 'List of gyms',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminGymSchemas.AdminGym),
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
    path: '/gyms/nearby',
    summary: 'Get nearby gyms',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminGymSchemas.NearbyGymsQuery,
    },
    responses: {
      200: {
        description: 'List of nearby gyms',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(
                adminGymSchemas.AdminGym.extend({
                  distance: z.number().describe('Distance in kilometers'),
                }),
              ),
              total: z.number(),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/gyms/nearest',
    summary: 'Get nearest gym',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminGymSchemas.NearestGymQuery,
    },
    responses: {
      200: {
        description: 'Nearest gym',
        content: {
          'application/json': {
            schema: adminGymSchemas.AdminGym.extend({
              distance: z.number().describe('Distance in kilometers'),
            }),
          },
        },
      },
      404: {
        description: 'No gyms found',
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
    path: '/gyms/{id}',
    summary: 'Get gym details',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      query: adminGymSchemas.AdminGymByIdQuery,
    },
    responses: {
      200: {
        description: 'Gym details',
        content: {
          'application/json': {
            schema: adminGymSchemas.AdminGym,
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

  registry.registerRoute({
    method: 'post',
    path: '/gyms/{id}/verify',
    summary: 'Verify gym registration',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.VerifyGymRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Gym verification updated',
        content: {
          'application/json': {
            schema: adminGymSchemas.AdminGym,
          },
        },
      },
    },
  })

  // Create gym route
  registry.registerRoute({
    method: 'post',
    path: '/gyms',
    summary: 'Create a new gym',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.CreateGymRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Gym created successfully',
        content: {
          'application/json': {
            schema: adminGymSchemas.AdminGym,
          },
        },
      },
      400: {
        description: 'Invalid gym data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update gym route
  registry.registerRoute({
    method: 'put',
    path: '/gyms/{id}',
    summary: 'Update gym information',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.UpdateGymRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Gym updated successfully',
        content: {
          'application/json': {
            schema: adminGymSchemas.AdminGym,
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

  // Delete gym route
  registry.registerRoute({
    method: 'delete',
    path: '/gyms/{id}',
    summary: 'Delete a gym',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      204: {
        description: 'Gym deleted successfully',
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

  // Update gym status route
  registry.registerRoute({
    method: 'patch',
    path: '/gyms/{id}/status',
    summary: 'Update gym operational status',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.UpdateGymStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Gym status updated successfully',
        content: {
          'application/json': {
            schema: z.object({
              id: adminGymSchemas.AdminGym.shape.id,
              name: z.string(),
              status: adminGymSchemas.AdminGym.shape.status,
              updatedAt: z.string(),
              statusChangeReason: z.string().optional(),
            }),
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

  // Get gym stats route
  registry.registerRoute({
    method: 'get',
    path: '/gyms/{id}/stats',
    summary: 'Get gym statistics',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Gym statistics',
        content: {
          'application/json': {
            schema: adminGymSchemas.GymStatsResponse,
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

  // Add gym equipment route
  registry.registerRoute({
    method: 'post',
    path: '/gyms/{id}/equipment',
    summary: 'Add equipment to gym',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.AddGymEquipmentRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Equipment added successfully',
        content: {
          'application/json': {
            schema: adminGymSchemas.GymEquipment,
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

  // Update gym pricing route
  registry.registerRoute({
    method: 'patch',
    path: '/gyms/{id}/pricing',
    summary: 'Update gym pricing',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.UpdateGymPricingRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Pricing updated successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
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

  // Set special hours route
  registry.registerRoute({
    method: 'post',
    path: '/gyms/{id}/special-hours',
    summary: 'Set special operating hours',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminGymSchemas.SetSpecialHoursRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Special hours set successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
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

  // Get gym analytics route
  registry.registerRoute({
    method: 'get',
    path: '/gyms/{id}/analytics',
    summary: 'Get gym analytics',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }),
    },
    responses: {
      200: {
        description: 'Gym analytics data',
        content: {
          'application/json': {
            schema: adminGymSchemas.GymAnalytics,
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

  // Upload gym picture route
  registry.registerRoute({
    method: 'post',
    path: '/gyms/{id}/pictures',
    summary: 'Upload gym pictures',
    tags: ['Gym Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: gymSchemas.GymIdParam,
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              pictures: z.array(z.instanceof(File)).min(1).max(10),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Pictures uploaded successfully',
        content: {
          'application/json': {
            schema: gymSchemas.UploadGymPictureResponse,
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

  // Stuff Management routes
  registry.registerRoute({
    method: 'get',
    path: '/stuff',
    summary: 'List all gym equipment/amenities',
    tags: ['Stuff Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: stuffSchemas.AdminStuffSearchParams,
    },
    responses: {
      200: {
        description: 'List of stuff',
        content: {
          'application/json': {
            schema: stuffSchemas.AdminStuffListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/stuff/{id}',
    summary: 'Get stuff details',
    tags: ['Stuff Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: stuffSchemas.StuffIdParam,
    },
    responses: {
      200: {
        description: 'Stuff details',
        content: {
          'application/json': {
            schema: stuffSchemas.AdminStuff,
          },
        },
      },
      404: {
        description: 'Stuff not found',
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
    path: '/stuff',
    summary: 'Create new equipment/amenity',
    tags: ['Stuff Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: stuffSchemas.CreateStuffRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Stuff created successfully',
        content: {
          'application/json': {
            schema: stuffSchemas.AdminStuff,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/stuff/{id}',
    summary: 'Update equipment/amenity',
    tags: ['Stuff Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: stuffSchemas.StuffIdParam,
      body: {
        content: {
          'application/json': {
            schema: stuffSchemas.UpdateStuffRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Stuff updated successfully',
        content: {
          'application/json': {
            schema: stuffSchemas.AdminStuff,
          },
        },
      },
      404: {
        description: 'Stuff not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/stuff/{id}',
    summary: 'Delete equipment/amenity',
    tags: ['Stuff Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: stuffSchemas.StuffIdParam,
    },
    responses: {
      200: {
        description: 'Stuff deleted successfully',
        content: {
          'application/json': {
            schema: stuffSchemas.AdminStuff,
          },
        },
      },
      404: {
        description: 'Stuff not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Induction Management routes (admin)
  registry.registerRoute({
    method: 'get',
    path: '/inductions',
    summary: 'List all induction requests',
    tags: ['Induction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: inductionSchemas.InductionSearchParams,
    },
    responses: {
      200: {
        description: 'List of inductions',
        content: {
          'application/json': {
            schema: inductionSchemas.InductionListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/inductions/gym/{gymId}',
    summary: 'Get inductions for a specific gym',
    tags: ['Induction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: inductionSchemas.InductionGymIdParam,
      query: inductionSchemas.GetGymInductionsQuery,
    },
    responses: {
      200: {
        description: 'Gym inductions',
        content: {
          'application/json': {
            schema: inductionSchemas.InductionListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/inductions/{id}/status',
    summary: 'Update induction status',
    tags: ['Induction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: inductionSchemas.InductionIdParam,
      body: {
        content: {
          'application/json': {
            schema: inductionSchemas.UpdateInductionStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Induction status updated',
        content: {
          'application/json': {
            schema: inductionSchemas.UpdateInductionStatusResponse,
          },
        },
      },
      404: {
        description: 'Induction not found',
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
    method: 'post',
    path: '/credits/adjustments',
    summary: 'Create manual credit adjustment',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.ManualAdjustmentRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Adjustment created',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminTransactionDetailResponse,
          },
        },
      },
      400: {
        description: 'Invalid adjustment data',
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

  // Session Management routes
  registry.registerRoute({
    method: 'post',
    path: '/admin/sessions',
    summary: 'Create a new session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminCreateSessionRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Session created successfully',
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminSessionDetailResponse,
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
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/admin/sessions/book',
    summary: 'Book a session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminBookSessionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session booked successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              bookingId: z.string().uuid(),
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
    path: '/admin/sessions/{id}/cancel',
    summary: 'Cancel a session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminSessionSchemas.SessionIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminCancelSessionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session cancelled successfully',
        content: {
          'application/json': {
            schema: MessageResponse,
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
    method: 'get',
    path: '/admin/sessions/analytics',
    summary: 'Get session analytics',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSessionAnalyticsSchemas.SessionAnalyticsQuery,
    },
    responses: {
      200: {
        description: 'Session analytics data',
        content: {
          'application/json': {
            schema: adminSessionAnalyticsSchemas.SessionAnalyticsResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/sessions',
    summary: 'List all sessions with admin details',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSessionSchemas.AdminGetAllSessionsQuery,
    },
    responses: {
      200: {
        description: 'List of sessions',
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminSessionListResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/sessions/{id}',
    summary: 'Get session details',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminSessionSchemas.SessionIdParam,
    },
    responses: {
      200: {
        description: 'Session details',
        content: {
          'application/json': {
            schema: z.any(), // TODO: Add proper session detail schema
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/admin/sessions/{id}',
    summary: 'Delete session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminSessionSchemas.SessionIdParam,
    },
    responses: {
      200: {
        description: 'Session deleted',
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
    path: '/admin/sessions/{id}/approve',
    summary: 'Approve content session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminSessionSchemas.SessionIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.ApproveContentSessionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session approved',
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
    path: '/admin/sessions/{id}/decline',
    summary: 'Decline content session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminSessionSchemas.SessionIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.DeclineContentSessionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Session declined',
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
    path: '/admin/sessions/force-checkin',
    summary: 'Force check-in user to session',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.ForceCheckInRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User checked in',
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
    path: '/admin/sessions/cleanup-expired-reservations',
    summary: 'Cleanup expired session reservations',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminSessionSchemas.CleanupExpiredReservationsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Cleanup result',
        content: {
          'application/json': {
            schema: z.object({
              cleaned: z.number(),
              message: z.string(),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/sessions/available-slots',
    summary: 'Get available session slots for admin',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSessionSchemas.AdminAvailableSlotsRequest,
    },
    responses: {
      200: {
        description: 'Available slots with duration options',
        content: {
          'application/json': {
            schema: adminSessionSchemas.AdminAvailableSlotsResponse,
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

  registry.registerRoute({
    method: 'post',
    path: '/admin/sessions/stats/bookings',
    summary: 'Get booking statistics for multiple users',
    tags: ['Session Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminSessionBookingStatsSchemas.GetUserBookingStatsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User booking statistics',
        content: {
          'application/json': {
            schema: adminSessionBookingStatsSchemas.GetUserBookingStatsResponse,
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
            schema: adminPdfSchemas.UpdateVoucherBookStatusRequest,
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
            schema: adminPdfSchemas.GeneratePDFRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'PDF generated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.GeneratePDFResponse,
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
            schema: adminPdfSchemas.BulkArchiveVoucherBooksRequest,
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
              failed: z.number().describe('Number of books that failed to archive'),
              errors: z.array(z.string()).describe('Error messages for failed operations'),
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
    request: {
      query: adminPdfSchemas.VoucherBookStatsQueryParams,
    },
    responses: {
      200: {
        description: 'Voucher book statistics',
        content: {
          'application/json': {
            schema: adminPdfSchemas.VoucherBookStatisticsResponse,
          },
        },
      },
    },
  })
}
