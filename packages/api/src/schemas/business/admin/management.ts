import { BusinessSortBy as BusinessSortByEnum } from '@pika/types'
import { FIELD_LENGTH, NUMERIC_CONSTRAINTS } from '@pika/types'
import { z } from 'zod'

import { optionalBoolean } from '../../../common/utils/validators.js'
import { CategoryResponse } from '../../category/public/category.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { AdminUserDetailResponse } from '../../user/admin/management.js'
import {
  BUSINESS_RELATIONS,
  BusinessSortBy,
  BusinessStatusFilter,
} from '../common/enums.js'

/**
 * Admin business management schemas
 */

// ============= Admin Business Response =============

/**
 * Admin business response (includes all fields for management) (raw Zod)
 */
export const AdminBusinessResponse = withTimestamps({
  id: UUID,
  userId: UserId.describe('User who owns this business'),
  businessName: z
    .string()
    .max(FIELD_LENGTH.SLUG_MAX)
    .describe('Business name (resolved translation)'),
  businessDescription: z
    .string()
    .max(FIELD_LENGTH.SLUG_MAX)
    .optional()
    .describe('Business description (resolved translation)'),
  categoryId: UUID.nullable().describe('Category this business belongs to'),
  verified: z.boolean().default(false).describe('Whether business is verified'),
  active: z.boolean().default(true).describe('Whether business is active'),
  approved: z
    .boolean()
    .default(false)
    .describe('Whether business is approved by admin'),
  approvedBy: UserId.nullable()
    .optional()
    .describe('Admin who approved the business'),
  approvedAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('When the business was approved'),
  avgRating: z
    .number()
    .min(0)
    .max(5)
    .default(0)
    .describe('Average rating of the business'),
  logoUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('URL of the business logo'),
  deletedAt: z
    .string()
    .datetime()
    .nullable()
    .describe('Soft deletion timestamp'),
  // Optional relations - industry standard pattern
  user: AdminUserDetailResponse.optional().describe(
    'Business owner details when ?include=user',
  ),
  category: CategoryResponse.optional().describe(
    'Category information when ?include=category',
  ),
  businessRegistration: z
    .object({
      id: UUID.describe('Registration ID'),
      registrationStatus: z.string().describe('Registration status'),
      currentStep: z.number().describe('Current registration step'),
    })
    .optional()
    .describe('Business registration info when ?include=businessRegistration'),
})

/**
 * Admin business response (OpenAPI documented)
 */
export const AdminBusinessResponseSchema = AdminBusinessResponse.openapi(
  'AdminBusinessResponse',
  {
    description: 'Business information for admin management',
  },
)

export type AdminBusinessResponse = z.infer<typeof AdminBusinessResponse>

// ============= Create Business =============

/**
 * Create business request (raw Zod)
 */
export const AdminCreateBusinessRequest = z.object({
  userId: UserId.describe('User who will own this business'),
  businessName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.SLUG_MAX)
    .describe('Business name'),
  businessDescription: z
    .string()
    .max(65535)
    .optional()
    .describe('Business description'),
  categoryId: UUID.describe('Category this business belongs to'),
  verified: z.boolean().default(false).describe('Whether business is verified'),
  active: z.boolean().default(true).describe('Whether business is active'),
})

/**
 * Create business request (OpenAPI documented)
 */
export const AdminCreateBusinessRequestSchema =
  AdminCreateBusinessRequest.openapi('AdminCreateBusinessRequest', {
    description: 'Create a new business',
  })

export type AdminCreateBusinessRequest = z.infer<
  typeof AdminCreateBusinessRequest
>

// ============= Update Business =============

/**
 * Update business request (raw Zod)
 */
export const AdminUpdateBusinessRequest = z.object({
  businessName: z
    .string()
    .min(1)
    .max(FIELD_LENGTH.SLUG_MAX)
    .optional()
    .describe('Business name'),
  businessDescription: z
    .string()
    .max(65535)
    .optional()
    .describe('Business description'),
  categoryId: UUID.optional().describe('Category this business belongs to'),
  verified: z.boolean().optional().describe('Whether business is verified'),
  active: z.boolean().optional().describe('Whether business is active'),
})

/**
 * Update business request (OpenAPI documented)
 */
export const AdminUpdateBusinessRequestSchema =
  AdminUpdateBusinessRequest.openapi('AdminUpdateBusinessRequest', {
    description: 'Update business information',
  })

export type AdminUpdateBusinessRequest = z.infer<
  typeof AdminUpdateBusinessRequest
>

// ============= Admin Search Businesses =============

/**
 * Admin business search/filter parameters (raw Zod)
 */
export const AdminBusinessQueryParams = SearchParams.extend({
  userId: UserId.optional().describe('Filter by owner'),
  categoryId: UUID.optional().describe('Filter by category'),
  status: BusinessStatusFilter.optional().describe('Filter by status'),
  verified: optionalBoolean().describe('Filter by verification status'),
  active: optionalBoolean().describe('Filter by active status'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Minimum rating filter'),
  maxRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Maximum rating filter'),
  includeDeleted: optionalBoolean().describe('Include soft deleted businesses'),
  createdFrom: z.string().datetime().optional().describe('Created date from'),
  createdTo: z.string().datetime().optional().describe('Created date to'),
  updatedFrom: z.string().datetime().optional().describe('Updated date from'),
  updatedTo: z.string().datetime().optional().describe('Updated date to'),
  sortBy: BusinessSortBy.default(BusinessSortByEnum.BUSINESS_NAME),
}).merge(createIncludeParam(BUSINESS_RELATIONS))

/**
 * Admin business search/filter parameters (OpenAPI documented)
 */
export const AdminBusinessQueryParamsSchema = AdminBusinessQueryParams.openapi(
  'AdminBusinessQueryParams',
  {
    description: 'Admin business search and filter parameters',
  },
)

export type AdminBusinessQueryParams = z.infer<typeof AdminBusinessQueryParams>

// ============= Response Types =============

/**
 * Admin paginated business list response (raw Zod)
 */
export const AdminBusinessListResponse = paginatedResponse(
  AdminBusinessResponse,
)

/**
 * Admin paginated business list response (OpenAPI documented)
 */
export const AdminBusinessListResponseSchema =
  AdminBusinessListResponse.openapi('AdminBusinessListResponse', {
    description: 'Paginated list of businesses for admin management',
  })

export type AdminBusinessListResponse = z.infer<
  typeof AdminBusinessListResponse
>

// ============= Business Management Actions =============

/**
 * Toggle business verification request (raw Zod)
 */
export const AdminToggleBusinessVerificationRequest = z.object({
  verified: z.boolean().describe('New verification status'),
})

/**
 * Toggle business verification request (OpenAPI documented)
 */
export const AdminToggleBusinessVerificationRequestSchema =
  AdminToggleBusinessVerificationRequest.openapi(
    'AdminToggleBusinessVerificationRequest',
    {
      description: 'Toggle business verification status',
    },
  )

export type AdminToggleBusinessVerificationRequest = z.infer<
  typeof AdminToggleBusinessVerificationRequest
>

/**
 * Toggle business activation request (raw Zod)
 */
export const AdminToggleBusinessActivationRequest = z.object({
  active: z.boolean().describe('New activation status'),
})

/**
 * Toggle business activation request (OpenAPI documented)
 */
export const AdminToggleBusinessActivationRequestSchema =
  AdminToggleBusinessActivationRequest.openapi(
    'AdminToggleBusinessActivationRequest',
    {
      description: 'Toggle business activation status',
    },
  )

export type AdminToggleBusinessActivationRequest = z.infer<
  typeof AdminToggleBusinessActivationRequest
>

/**
 * Bulk business update request (raw Zod)
 */
export const AdminBulkBusinessUpdateRequest = z.object({
  businessIds: z.array(UUID).min(1).max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX),
  updates: z.object({
    active: z.boolean().optional(),
    verified: z.boolean().optional(),
    categoryId: UUID.optional(),
  }),
})

/**
 * Bulk business update request (OpenAPI documented)
 */
export const AdminBulkBusinessUpdateRequestSchema =
  AdminBulkBusinessUpdateRequest.openapi('AdminBulkBusinessUpdateRequest', {
    description: 'Update multiple businesses at once',
  })

export type AdminBulkBusinessUpdateRequest = z.infer<
  typeof AdminBulkBusinessUpdateRequest
>

/**
 * Bulk operation response (raw Zod)
 */
export const AdminBulkBusinessOperationResponse = z.object({
  successful: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        businessId: UUID,
        error: z.string(),
      }),
    )
    .optional(),
})

/**
 * Bulk operation response (OpenAPI documented)
 */
export const AdminBulkBusinessOperationResponseSchema =
  AdminBulkBusinessOperationResponse.openapi(
    'AdminBulkBusinessOperationResponse',
    {
      description: 'Bulk business operation result',
    },
  )

export type AdminBulkBusinessOperationResponse = z.infer<
  typeof AdminBulkBusinessOperationResponse
>

// ============= Bulk Delete Businesses =============

/**
 * Bulk delete businesses request (raw Zod)
 */
export const AdminBulkDeleteBusinessesRequest = z.object({
  businessIds: z.array(UUID).min(1).max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX),
})

/**
 * Bulk delete businesses request (OpenAPI documented)
 */
export const AdminBulkDeleteBusinessesRequestSchema =
  AdminBulkDeleteBusinessesRequest.openapi('AdminBulkDeleteBusinessesRequest', {
    description: 'Delete multiple businesses',
  })

export type AdminBulkDeleteBusinessesRequest = z.infer<
  typeof AdminBulkDeleteBusinessesRequest
>

/**
 * Update business rating request (raw Zod)
 */
export const AdminUpdateBusinessRatingRequest = z.object({
  rating: z
    .number()
    .min(0)
    .max(5)
    .describe('New rating value for the business'),
})

/**
 * Update business rating request (OpenAPI documented)
 */
export const AdminUpdateBusinessRatingRequestSchema =
  AdminUpdateBusinessRatingRequest.openapi('AdminUpdateBusinessRatingRequest', {
    description: 'Update business rating data',
  })

export type AdminUpdateBusinessRatingRequest = z.infer<
  typeof AdminUpdateBusinessRatingRequest
>

// ============= Business Verification Management =============

/**
 * Business verification update request for PATCH endpoint (raw Zod)
 */
export const AdminPatchBusinessVerificationRequest = z.object({
  verified: z.boolean().describe('New verification status'),
})

/**
 * Business verification update request for PATCH endpoint (OpenAPI documented)
 */
export const AdminPatchBusinessVerificationRequestSchema =
  AdminPatchBusinessVerificationRequest.openapi(
    'AdminPatchBusinessVerificationRequest',
    {
      description: 'Update business verification status via PATCH',
    },
  )

export type AdminPatchBusinessVerificationRequest = z.infer<
  typeof AdminPatchBusinessVerificationRequest
>

/**
 * Business verification update response (raw Zod)
 */
export const PatchBusinessVerificationResponse = AdminBusinessResponse

/**
 * Business verification update response (OpenAPI documented)
 */
export const PatchBusinessVerificationResponseSchema =
  PatchBusinessVerificationResponse.openapi(
    'PatchBusinessVerificationResponse',
    {
      description: 'Business verification update result',
    },
  )

export type PatchBusinessVerificationResponse = z.infer<
  typeof PatchBusinessVerificationResponse
>

// ============= Business Approval Management =============

/**
 * Business approval request (raw Zod)
 */
const BusinessApprovalRequest = z.object({
  approved: z.boolean().describe('Approval status'),
  reason: z
    .string()
    .max(500)
    .optional()
    .describe('Reason for approval/rejection'),
})

/**
 * Business approval request (OpenAPI documented)
 */
export const AdminBusinessApprovalRequestSchema =
  BusinessApprovalRequest.openapi('AdminBusinessApprovalRequest', {
    description: 'Approve or reject a business',
  })

export const AdminBusinessApprovalRequest = BusinessApprovalRequest

export type AdminBusinessApprovalRequest = z.infer<
  typeof AdminBusinessApprovalRequest
>

/**
 * Business approval response (raw Zod)
 */
const BusinessApprovalResponse = AdminBusinessResponse

/**
 * Business approval response (OpenAPI documented)
 */
export const AdminBusinessApprovalResponseSchema =
  BusinessApprovalResponse.openapi('AdminBusinessApprovalResponse', {
    description: 'Business approval result',
  })

export const AdminBusinessApprovalResponse = BusinessApprovalResponse

export type AdminBusinessApprovalResponse = z.infer<
  typeof AdminBusinessApprovalResponse
>

// ============= Business Registration Reset =============

/**
 * Reset business registration request (raw Zod)
 */
const ResetBusinessRegistrationRequest = z.object({
  reason: z
    .string()
    .min(1)
    .max(500)
    .describe('Reason for resetting the registration'),
  notifyUser: z
    .boolean()
    .default(true)
    .describe('Whether to notify the user about the reset'),
})

/**
 * Reset business registration request (OpenAPI documented)
 */
export const AdminResetBusinessRegistrationRequestSchema =
  ResetBusinessRegistrationRequest.openapi(
    'AdminResetBusinessRegistrationRequest',
    {
      description: 'Reset a business registration to allow user to restart',
    },
  )

export const AdminResetBusinessRegistrationRequest =
  ResetBusinessRegistrationRequest

export type AdminResetBusinessRegistrationRequest = z.infer<
  typeof AdminResetBusinessRegistrationRequest
>

/**
 * Reset business registration response (raw Zod)
 */
const ResetBusinessRegistrationResponse = z.object({
  success: z.boolean().describe('Whether the reset was successful'),
  message: z.string().describe('Status message'),
  registrationId: UUID.describe('Registration ID that was reset'),
  userId: UserId.describe('User ID associated with the registration'),
})

/**
 * Reset business registration response (OpenAPI documented)
 */
export const AdminResetBusinessRegistrationResponseSchema =
  ResetBusinessRegistrationResponse.openapi(
    'AdminResetBusinessRegistrationResponse',
    {
      description: 'Business registration reset result',
    },
  )

export const AdminResetBusinessRegistrationResponse =
  ResetBusinessRegistrationResponse

export type AdminResetBusinessRegistrationResponse = z.infer<
  typeof AdminResetBusinessRegistrationResponse
>
