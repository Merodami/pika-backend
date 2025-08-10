import {
  AdminUserSortBy as AdminUserSortByEnum,
  FIELD_LENGTH,
  NUMERIC_CONSTRAINTS,
  UserRole as UserRoleEnum,
  UserStatus as UserStatusEnum,
  VerificationType,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { Email, UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateOnly, DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { UserRoleSchema, UserStatusSchema } from '../common/enums.js'
import { AdminUserSortBySchema } from '../common/enums.js'

/**
 * Admin user management schemas
 */

// ============= Enums =============
// Note: UserRole and UserStatus are now imported from common/schemas/enums.ts

export const AccountFlag = z.enum([
  'VERIFIED',
  'PREMIUM',
  'SUSPICIOUS',
  'REPORTED',
  'VIP',
])
export type AccountFlag = z.infer<typeof AccountFlag>

// ============= Admin User View =============

/**
 * Detailed user information for admin
 */
export const AdminUserDetailResponse = openapi(
  withTimestamps({
    id: UserId,
    email: Email,
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    avatarUrl: z.string().url().optional(),
    status: UserStatusSchema,
    role: UserRoleSchema,

    // Verification info (only fields that exist in database)
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),

    // Account info (only fields that exist in database)
    lastLoginAt: DateTime.optional(),
  }),
  {
    description: 'Detailed user information for admin',
  },
)

export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponse>

// ============= User Search =============

/**
 * Admin user search parameters
 */
export const AdminUserQueryParams = z.object({
  search: z.string().optional().describe('Search in name, email, phone'),
  email: Email.optional(),
  status: UserStatusSchema.optional(),
  role: UserRoleSchema.optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  registeredFrom: DateTime.optional(),
  registeredTo: DateTime.optional(),
  lastLoginFrom: DateTime.optional(),
  lastLoginTo: DateTime.optional(),
  minSpent: z.number().nonnegative().optional(),
  maxSpent: z.number().nonnegative().optional(),
  hasReports: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX)
    .default(NUMERIC_CONSTRAINTS.PAGE_SIZE_DEFAULT),
  sortBy: AdminUserSortBySchema.default(AdminUserSortByEnum.CREATED_AT),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type AdminUserQueryParams = z.infer<typeof AdminUserQueryParams>

/**
 * Admin user list response
 */
export const AdminUserListResponse = paginatedResponse(AdminUserDetailResponse)

export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>

// ============= User Actions =============

/**
 * Update user status request
 */
export const AdminUpdateUserStatusRequest = openapi(
  z.object({
    status: UserStatusSchema,
    reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX).optional(),
    duration: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Suspension duration in days'),
    notifyUser: z.boolean().default(true).optional(),
  }),
  {
    description: 'Update user account status',
  },
)

export type AdminUpdateUserStatusRequest = z.infer<
  typeof AdminUpdateUserStatusRequest
>

/**
 * Update user role request
 */
export const AdminUpdateUserRoleRequest = openapi(
  z.object({
    role: UserRoleSchema,
    reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX),
  }),
  {
    description: 'Update user role',
  },
)

export type AdminUpdateUserRoleRequest = z.infer<
  typeof AdminUpdateUserRoleRequest
>

/**
 * Add user flag request
 */
export const AdminAddUserFlagRequest = openapi(
  z.object({
    flag: AccountFlag,
    reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX).optional(),
  }),
  {
    description: 'Add flag to user account',
  },
)

export type AdminAddUserFlagRequest = z.infer<typeof AdminAddUserFlagRequest>

/**
 * Admin note request
 */
export const AdminAddNoteRequest = openapi(
  z.object({
    note: z.string().max(2000),
    category: z.enum(['GENERAL', 'SECURITY', 'SUPPORT', 'BILLING']).optional(),
  }),
  {
    description: 'Add admin note to user',
  },
)

export type AdminAddNoteRequest = z.infer<typeof AdminAddNoteRequest>

// ============= User Activity =============

/**
 * User activity log
 */
export const UserActivityLog = z.object({
  id: UUID,
  userId: UserId,
  action: z.string(),
  category: z.enum(['AUTH', 'PROFILE', 'PAYMENT', 'OTHER']),
  details: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: DateTime,
})

export type UserActivityLog = z.infer<typeof UserActivityLog>

/**
 * User activity response
 */
export const AdminUserActivityResponse = paginatedResponse(UserActivityLog)

export type AdminUserActivityResponse = z.infer<
  typeof AdminUserActivityResponse
>

// ============= Bulk Operations =============

/**
 * Bulk user update request
 */
export const AdminBulkUserUpdateRequest = openapi(
  z.object({
    userIds: z.array(UserId).min(1).max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX),
    updates: z.object({
      status: UserStatusSchema.optional(),
      role: UserRoleSchema.optional(),
    }),
    reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX),
  }),
  {
    description: 'Update multiple users at once',
  },
)

export type AdminBulkUserUpdateRequest = z.infer<
  typeof AdminBulkUserUpdateRequest
>

/**
 * Bulk operation response
 */
export const AdminBulkOperationResponse = z.object({
  successful: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        userId: UserId,
        error: z.string(),
      }),
    )
    .optional(),
})

export type AdminBulkOperationResponse = z.infer<
  typeof AdminBulkOperationResponse
>

// Missing schemas for admin-api.ts
export const AdminCreateUserRequest = openapi(
  z.object({
    email: Email,
    firstName: z.string().min(FIELD_LENGTH.NAME_MIN).max(FIELD_LENGTH.CODE_MAX),
    lastName: z.string().min(FIELD_LENGTH.NAME_MIN).max(FIELD_LENGTH.CODE_MAX),
    phoneNumber: z.string().min(1),
    dateOfBirth: DateOnly.optional(),
    role: UserRoleSchema.default(UserRoleEnum.CUSTOMER),
    status: UserStatusSchema.default(UserStatusEnum.UNCONFIRMED),
    appVersion: z.string().optional(),
    alias: z.string().optional(),
  }),
  {
    description: 'Create a new user (admin only)',
  },
)

export type AdminCreateUserRequest = z.infer<typeof AdminCreateUserRequest>

export const AdminUpdateUserRequest = openapi(
  z.object({
    firstName: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.CODE_MAX)
      .optional(),
    lastName: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.CODE_MAX)
      .optional(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    appVersion: z.string().optional(),
    alias: z.string().optional(),
    activeMembership: z.boolean().optional(),
    // For PROFESSIONAL role
    description: z.string().optional(),
    specialties: z.array(z.string()).optional(),
  }),
  {
    description: 'Update user information (admin)',
  },
)

export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequest>

export const AdminBanUserRequest = openapi(
  z
    .object({
      reason: z
        .string()
        .min(FIELD_LENGTH.NAME_MIN)
        .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
        .optional(),
      duration: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Ban duration in days'),
      notifyUser: z.boolean().default(true).optional(),
    })
    .optional()
    .default({}),
  {
    description: 'Ban a user',
  },
)

export type AdminBanUserRequest = z.infer<typeof AdminBanUserRequest>

export const AdminUnbanUserRequest = openapi(
  z
    .object({
      reason: z
        .string()
        .min(FIELD_LENGTH.NAME_MIN)
        .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
        .optional(),
      notifyUser: z.boolean().default(true).optional(),
    })
    .optional()
    .default({}),
  {
    description: 'Unban a user',
  },
)

export type AdminUnbanUserRequest = z.infer<typeof AdminUnbanUserRequest>

export const AdminUploadUserAvatarRequest = openapi(
  z.object({
    file: z.any().describe('Avatar image file (multipart/form-data)'),
  }),
  {
    description: 'Upload avatar for a user (admin only)',
  },
)

export type AdminUploadUserAvatarRequest = z.infer<
  typeof AdminUploadUserAvatarRequest
>

export const AdminUploadUserAvatarResponse = openapi(
  z.object({
    avatarUrl: z.string().url().describe('URL of the uploaded avatar'),
  }),
  {
    description: 'Avatar upload response',
  },
)

export type AdminUploadUserAvatarResponse = z.infer<
  typeof AdminUploadUserAvatarResponse
>

/**
 * Update current admin user profile request
 */
export const AdminUpdateProfileRequest = openapi(
  z.object({
    firstName: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.CODE_MAX)
      .optional(),
    lastName: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.CODE_MAX)
      .optional(),
    phoneNumber: z.string().optional(),
    dateOfBirth: DateOnly.optional(),
    avatarUrl: z.string().url().optional(),
    // Admin-specific fields
  }),
  {
    description: 'Update current admin user profile',
  },
)

export type AdminUpdateProfileRequest = z.infer<
  typeof AdminUpdateProfileRequest
>

export const AdminUserStatsResponse = openapi(
  z.object({
    userId: UserId,
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    totalBookings: z.number().int().nonnegative(),
    creditsBalance: z.number().int().nonnegative(),
    friendsCount: z.number().int().nonnegative(),
    followersCount: z.number().int().nonnegative(),
    reportsCount: z.number().int().nonnegative(),
    activityScore: z
      .number()
      .min(NUMERIC_CONSTRAINTS.PERCENTAGE_MIN)
      .max(NUMERIC_CONSTRAINTS.PERCENTAGE_MAX),
    lastActiveDate: DateTime.optional(),
  }),
  {
    description: 'User statistics for admin view',
  },
)

export type AdminUserStatsResponse = z.infer<typeof AdminUserStatsResponse>

export const AdminBulkUserActionRequest = AdminBulkUserUpdateRequest
export type AdminBulkUserActionRequest = z.infer<
  typeof AdminBulkUserActionRequest
>

// ============= Verification Status =============

/**
 * User verification status response
 */
export const AdminUserVerificationStatusResponse = openapi(
  z.object({
    userId: UserId,
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    verificationDate: DateTime.optional(),
  }),
  {
    description: 'User verification status information',
  },
)

export type AdminUserVerificationStatusResponse = z.infer<
  typeof AdminUserVerificationStatusResponse
>

// ============= Additional Missing Schemas =============

/**
 * Admin verification request
 * Allows admin to verify any user account
 */
export const AdminVerificationRequest = openapi(
  z.object({
    type: createZodEnum(VerificationType),
    token: z.string().optional(),
    code: z.string().length(FIELD_LENGTH.VERIFICATION_CODE_LENGTH).optional(),
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
  }),
  {
    description: 'Admin request to verify a user account',
  },
)

export type AdminVerificationRequest = z.infer<typeof AdminVerificationRequest>

/**
 * Admin resend verification request
 * Allows admin to resend verification for any user
 */
export const AdminResendVerificationRequest = openapi(
  z.object({
    type: z.enum([VerificationType.EMAIL, VerificationType.PHONE]),
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
  }),
  {
    description: 'Admin request to resend verification for a user',
  },
)

export type AdminResendVerificationRequest = z.infer<
  typeof AdminResendVerificationRequest
>

/**
 * Verify user response for admin operations
 */
export const AdminVerifyUserResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().optional(),
    user: AdminUserDetailResponse.optional(),
  }),
  {
    description: 'User verification response',
  },
)

export type AdminVerifyUserResponse = z.infer<typeof AdminVerifyUserResponse>

/**
 * Resend verification response
 */
export const AdminResendVerificationResponse = openapi(
  z.object({
    success: z.boolean().default(true),
    message: z.string().default('Verification email sent'),
  }),
  {
    description: 'Resend verification response',
  },
)

export type AdminResendVerificationResponse = z.infer<
  typeof AdminResendVerificationResponse
>
