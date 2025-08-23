import {
  AccountFlag as AccountFlagEnum,
  AdminNoteCategory as AdminNoteCategoryEnum,
  AdminUserSortBy as AdminUserSortByEnum,
  FIELD_LENGTH,
  NUMERIC_CONSTRAINTS,
  SortOrder as SortOrderEnum,
  UserActivityCategory as UserActivityCategoryEnum,
  UserRole as UserRoleEnum,
  UserStatus as UserStatusEnum,
  VerificationType,
  VerificationType as VerificationTypeEnum,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { Email, UserId } from '../../shared/branded.js'
import { BinaryFile } from '../../shared/fileUpload.js'
import { withTimestamps } from '../../shared/metadata.js'
import {
  DateOnly,
  DateTime,
  LanguageCode,
  Password,
  PhoneNumber,
  UUID,
} from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { UserRoleSchema, UserStatusSchema } from '../common/enums.js'
import { AdminUserSortBySchema } from '../common/enums.js'

/**
 * Admin user management schemas
 */

// ============= Enums =============
// Note: UserRole and UserStatus are now imported from common/schemas/enums.ts

export const AccountFlagSchema = openapi(createZodEnum(AccountFlagEnum), {
  description: 'Account flags for special account states',
  example: AccountFlagEnum.VERIFIED,
})
export type AccountFlag = z.infer<typeof AccountFlagSchema>

// ============= Admin User View =============

/**
 * Detailed user information for admin (raw Zod)
 */
export const AdminUserDetailResponse = withTimestamps({
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
})

/**
 * Detailed user information for admin (OpenAPI documented)
 */
export const AdminUserDetailResponseSchema = AdminUserDetailResponse.openapi(
  'AdminUserDetailResponse',
  {
    description: 'Detailed user information for admin',
  },
)

export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponse>

// ============= User Search =============

/**
 * Admin user search parameters (raw Zod)
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
  sortOrder: createZodEnum(SortOrderEnum).default(SortOrderEnum.DESC),
})

/**
 * Admin user search parameters (OpenAPI documented)
 */
export const AdminUserQueryParamsSchema = AdminUserQueryParams.openapi(
  'AdminUserQueryParams',
  {
    description: 'Admin user search and filter parameters',
  },
)

export type AdminUserQueryParams = z.infer<typeof AdminUserQueryParams>

/**
 * Admin user list response (raw Zod)
 */
export const AdminUserListResponse = paginatedResponse(AdminUserDetailResponse)

/**
 * Admin user list response (OpenAPI documented)
 */
export const AdminUserListResponseSchema = AdminUserListResponse.openapi(
  'AdminUserListResponse',
  {
    description: 'Paginated list of users for admin management',
  },
)

export type AdminUserListResponse = z.infer<typeof AdminUserListResponse>

// ============= User Actions =============

/**
 * Update user status request (raw Zod)
 */
export const AdminUpdateUserStatusRequest = z.object({
  status: UserStatusSchema,
  reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX).optional(),
  duration: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Suspension duration in days'),
  notifyUser: z.boolean().default(true).optional(),
})

/**
 * Update user status request (OpenAPI documented)
 */
export const AdminUpdateUserStatusRequestSchema =
  AdminUpdateUserStatusRequest.openapi('AdminUpdateUserStatusRequest', {
    description: 'Update user account status',
  })

export type AdminUpdateUserStatusRequest = z.infer<
  typeof AdminUpdateUserStatusRequest
>

/**
 * Update user role request (raw Zod)
 */
export const AdminUpdateUserRoleRequest = z.object({
  role: UserRoleSchema,
  reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX),
})

/**
 * Update user role request (OpenAPI documented)
 */
export const AdminUpdateUserRoleRequestSchema =
  AdminUpdateUserRoleRequest.openapi('AdminUpdateUserRoleRequest', {
    description: 'Update user role',
  })

export type AdminUpdateUserRoleRequest = z.infer<
  typeof AdminUpdateUserRoleRequest
>

/**
 * Add user flag request (raw Zod)
 */
export const AdminAddUserFlagRequest = z.object({
  flag: createZodEnum(AccountFlagEnum),
  reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX).optional(),
})

/**
 * Add user flag request (OpenAPI documented)
 */
export const AdminAddUserFlagRequestSchema = AdminAddUserFlagRequest.openapi(
  'AdminAddUserFlagRequest',
  {
    description: 'Add flag to user account',
  },
)

export type AdminAddUserFlagRequest = z.infer<typeof AdminAddUserFlagRequest>

/**
 * Admin note request (raw Zod)
 */
export const AdminAddNoteRequest = z.object({
  note: z.string().max(2000),
  category: createZodEnum(AdminNoteCategoryEnum).optional(),
})

/**
 * Admin note request (OpenAPI documented)
 */
export const AdminAddNoteRequestSchema = AdminAddNoteRequest.openapi(
  'AdminAddNoteRequest',
  {
    description: 'Add admin note to user',
  },
)

export type AdminAddNoteRequest = z.infer<typeof AdminAddNoteRequest>

// ============= User Activity =============

/**
 * User activity log (raw Zod)
 */
export const UserActivityLog = z.object({
  id: UUID,
  userId: UserId,
  action: z.string(),
  category: createZodEnum(UserActivityCategoryEnum),
  details: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: DateTime,
})

/**
 * User activity log (OpenAPI documented)
 */
export const UserActivityLogSchema = UserActivityLog.openapi(
  'UserActivityLog',
  {
    description: 'User activity log entry',
  },
)

export type UserActivityLog = z.infer<typeof UserActivityLog>

/**
 * User activity response (raw Zod)
 */
export const AdminUserActivityResponse = paginatedResponse(UserActivityLog)

/**
 * User activity response (OpenAPI documented)
 */
export const AdminUserActivityResponseSchema =
  AdminUserActivityResponse.openapi('AdminUserActivityResponse', {
    description: 'Paginated list of user activity logs',
  })

export type AdminUserActivityResponse = z.infer<
  typeof AdminUserActivityResponse
>

// ============= Bulk Operations =============

/**
 * Bulk user update request (raw Zod)
 */
export const AdminBulkUserUpdateRequest = z.object({
  userIds: z.array(UserId).min(1).max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX),
  updates: z.object({
    status: UserStatusSchema.optional(),
    role: UserRoleSchema.optional(),
  }),
  reason: z.string().max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX),
})

/**
 * Bulk user update request (OpenAPI documented)
 */
export const AdminBulkUserUpdateRequestSchema =
  AdminBulkUserUpdateRequest.openapi('AdminBulkUserUpdateRequest', {
    description: 'Update multiple users at once',
  })

export type AdminBulkUserUpdateRequest = z.infer<
  typeof AdminBulkUserUpdateRequest
>

/**
 * Bulk operation response (raw Zod)
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

/**
 * Bulk operation response (OpenAPI documented)
 */
export const AdminBulkOperationResponseSchema =
  AdminBulkOperationResponse.openapi('AdminBulkOperationResponse', {
    description: 'Bulk user operation result',
  })

export type AdminBulkOperationResponse = z.infer<
  typeof AdminBulkOperationResponse
>

// Missing schemas for admin-api.ts
/**
 * Admin create user request (raw Zod)
 * Used for POST /users endpoint when called by admin
 * Allows admins to create users with specific roles and verification status
 */
export const AdminCreateUserRequest = z.object({
  // Required fields
  email: Email,
  firstName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.FIRST_NAME_MAX),
  lastName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.LAST_NAME_MAX),

  // Optional fields
  phoneNumber: PhoneNumber.optional(),
  dateOfBirth: DateOnly.optional(),
  password: Password.optional().describe(
    'Optional password - if not provided, user will set it on first login',
  ),

  // Admin-settable fields
  role: UserRoleSchema.default(UserRoleEnum.CUSTOMER),
  status: UserStatusSchema.default(UserStatusEnum.ACTIVE),
  emailVerified: z
    .boolean()
    .default(false)
    .describe('Admin can create pre-verified users'),
  phoneVerified: z.boolean().default(false),
  preferredLanguage: LanguageCode.optional(),
})

/**
 * Admin create user request (OpenAPI documented)
 */
export const AdminCreateUserRequestSchema = AdminCreateUserRequest.openapi(
  'AdminCreateUserRequest',
  {
    description: 'Create a new user (admin only)',
  },
)

export type AdminCreateUserRequest = z.infer<typeof AdminCreateUserRequest>

/**
 * Admin update user request (raw Zod)
 * Used for PATCH /users/{id} endpoint when called by admin
 * All fields are optional - only provided fields will be updated
 */
export const AdminUpdateUserRequest = z.object({
  // Basic user info
  firstName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.FIRST_NAME_MAX)
    .optional(),
  lastName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.LAST_NAME_MAX)
    .optional(),
  phoneNumber: PhoneNumber.optional(),
  dateOfBirth: DateOnly.optional(),
  preferredLanguage: LanguageCode.optional(),

  // Admin-only fields for user management
  email: Email.optional().describe('Admin can change user email'),
  role: UserRoleSchema.optional().describe('Change user role'),
  status: UserStatusSchema.optional().describe(
    'Change user status (active, suspended, etc.)',
  ),
  emailVerified: z
    .boolean()
    .optional()
    .describe('Manually verify/unverify email'),
  phoneVerified: z
    .boolean()
    .optional()
    .describe('Manually verify/unverify phone'),

  // Password reset
  password: Password.optional().describe('Admin can reset user password'),
})

/**
 * Admin update user request (OpenAPI documented)
 */
export const AdminUpdateUserRequestSchema = AdminUpdateUserRequest.openapi(
  'AdminUpdateUserRequest',
  {
    description: 'Update user information (admin)',
  },
)

export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequest>

/**
 * Admin ban user request (raw Zod)
 */
export const AdminBanUserRequest = z
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
  .default({})

/**
 * Admin ban user request (OpenAPI documented)
 */
export const AdminBanUserRequestSchema = AdminBanUserRequest.openapi(
  'AdminBanUserRequest',
  {
    description: 'Ban a user',
  },
)

export type AdminBanUserRequest = z.infer<typeof AdminBanUserRequest>

/**
 * Admin unban user request (raw Zod)
 */
export const AdminUnbanUserRequest = z
  .object({
    reason: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
      .optional(),
    notifyUser: z.boolean().default(true).optional(),
  })
  .optional()
  .default({})

/**
 * Admin unban user request (OpenAPI documented)
 */
export const AdminUnbanUserRequestSchema = AdminUnbanUserRequest.openapi(
  'AdminUnbanUserRequest',
  {
    description: 'Unban a user',
  },
)

export type AdminUnbanUserRequest = z.infer<typeof AdminUnbanUserRequest>

/**
 * Admin upload user avatar request (raw Zod)
 */
export const AdminUploadUserAvatarRequest = z.object({
  avatar: BinaryFile.openapi({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file (JPEG, PNG, or WebP)',
  }),
})

/**
 * Admin upload user avatar request (OpenAPI documented)
 */
export const AdminUploadUserAvatarRequestSchema =
  AdminUploadUserAvatarRequest.openapi('AdminUploadUserAvatarRequest', {
    description: 'Upload avatar for a user (admin only)',
  })

export type AdminUploadUserAvatarRequest = z.infer<
  typeof AdminUploadUserAvatarRequest
>

/**
 * Admin upload user avatar response (raw Zod)
 */
export const AdminUploadUserAvatarResponse = z.object({
  avatarUrl: z.string().url().describe('URL of the uploaded avatar'),
})

/**
 * Admin upload user avatar response (OpenAPI documented)
 */
export const AdminUploadUserAvatarResponseSchema =
  AdminUploadUserAvatarResponse.openapi('AdminUploadUserAvatarResponse', {
    description: 'Avatar upload response',
  })

export type AdminUploadUserAvatarResponse = z.infer<
  typeof AdminUploadUserAvatarResponse
>

/**
 * Update current admin user profile request (raw Zod)
 */
export const AdminUpdateProfileRequest = z.object({
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
})

/**
 * Update current admin user profile request (OpenAPI documented)
 */
export const AdminUpdateProfileRequestSchema =
  AdminUpdateProfileRequest.openapi('AdminUpdateProfileRequest', {
    description: 'Update current admin user profile',
  })

export type AdminUpdateProfileRequest = z.infer<
  typeof AdminUpdateProfileRequest
>

/**
 * Admin user stats response (raw Zod)
 */
export const AdminUserStatsResponse = z.object({
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
})

/**
 * Admin user stats response (OpenAPI documented)
 */
export const AdminUserStatsResponseSchema = AdminUserStatsResponse.openapi(
  'AdminUserStatsResponse',
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
 * User verification status response (raw Zod)
 */
export const AdminUserVerificationStatusResponse = z.object({
  userId: UserId,
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  verificationDate: DateTime.optional(),
})

/**
 * User verification status response (OpenAPI documented)
 */
export const AdminUserVerificationStatusResponseSchema =
  AdminUserVerificationStatusResponse.openapi(
    'AdminUserVerificationStatusResponse',
    {
      description: 'User verification status information',
    },
  )

export type AdminUserVerificationStatusResponse = z.infer<
  typeof AdminUserVerificationStatusResponse
>

// ============= Additional Missing Schemas =============

/**
 * Admin verification request (raw Zod)
 * Allows admin to verify any user account
 */
export const AdminVerificationRequest = z.object({
  type: createZodEnum(VerificationType),
  token: z.string().optional(),
  code: z.string().length(FIELD_LENGTH.VERIFICATION_CODE_LENGTH).optional(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

/**
 * Admin verification request (OpenAPI documented)
 */
export const AdminVerificationRequestSchema = AdminVerificationRequest.openapi(
  'AdminVerificationRequest',
  {
    description: 'Admin request to verify a user account',
  },
)

export type AdminVerificationRequest = z.infer<typeof AdminVerificationRequest>

/**
 * Admin resend verification request (raw Zod)
 * Allows admin to resend verification for any user
 */
export const AdminResendVerificationRequest = z.object({
  type: createZodEnum(VerificationTypeEnum).refine(
    (val) =>
      val === VerificationTypeEnum.EMAIL || val === VerificationTypeEnum.PHONE,
    { message: 'Only EMAIL and PHONE verification types are allowed' },
  ),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
})

/**
 * Admin resend verification request (OpenAPI documented)
 */
export const AdminResendVerificationRequestSchema =
  AdminResendVerificationRequest.openapi('AdminResendVerificationRequest', {
    description: 'Admin request to resend verification for a user',
  })

export type AdminResendVerificationRequest = z.infer<
  typeof AdminResendVerificationRequest
>

/**
 * Verify user response for admin operations (raw Zod)
 */
export const AdminVerifyUserResponse = z.object({
  success: z.boolean().default(true),
  message: z.string().optional(),
  user: AdminUserDetailResponse.optional(),
})

/**
 * Verify user response for admin operations (OpenAPI documented)
 */
export const AdminVerifyUserResponseSchema = AdminVerifyUserResponse.openapi(
  'AdminVerifyUserResponse',
  {
    description: 'User verification response',
  },
)

export type AdminVerifyUserResponse = z.infer<typeof AdminVerifyUserResponse>

/**
 * Resend verification response (raw Zod)
 */
export const AdminResendVerificationResponse = z.object({
  success: z.boolean().default(true),
  message: z.string().default('Verification email sent'),
})

/**
 * Resend verification response (OpenAPI documented)
 */
export const AdminResendVerificationResponseSchema =
  AdminResendVerificationResponse.openapi('AdminResendVerificationResponse', {
    description: 'Resend verification response',
  })

export type AdminResendVerificationResponse = z.infer<
  typeof AdminResendVerificationResponse
>
