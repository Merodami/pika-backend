import {
  BusinessSortBy as BusinessSortByEnum,
  FIELD_LENGTH,
  NUMERIC_CONSTRAINTS,
} from '@pika/types'
import { z } from 'zod'

import { optionalBoolean } from '../../../common/utils/validators.js'
import { CategoryResponse } from '../../category/public/category.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createByIdQuerySchema } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { PublicUserProfile } from '../../user/public/profile.js'
import { BUSINESS_RELATIONS, BusinessSortBy } from '../common/enums.js'

/**
 * Public business schemas
 */

// ============= Business Response =============

/**
 * Public business response (raw Zod)
 */
export const BusinessResponse = withTimestamps({
  id: UUID,
  userId: UserId.describe('User who owns this business'),
  businessName: z
    .string()
    .max(FIELD_LENGTH.NAME_LONG_MAX)
    .describe('Business name in requested language'),
  businessDescription: z
    .string()
    .max(FIELD_LENGTH.DESCRIPTION_EXTRA_LONG_MAX)
    .optional()
    .describe('Business description in requested language'),
  categoryId: UUID.describe('Category this business belongs to'),
  verified: z.boolean().default(false).describe('Whether business is verified'),
  active: z.boolean().default(true).describe('Whether business is active'),
  approved: z.boolean().default(false).describe('Whether business is approved by admin'),
  avgRating: z
    .number()
    .min(NUMERIC_CONSTRAINTS.RATING_MIN)
    .max(NUMERIC_CONSTRAINTS.RATING_MAX)
    .default(0)
    .describe('Average rating of the business'),
  // Optional relations - industry standard pattern
  user: PublicUserProfile.optional().describe(
    'Business owner profile when ?include=user',
  ),
  category: CategoryResponse.optional().describe(
    'Category information when ?include=category',
  ),
})

/**
 * Public business response (OpenAPI documented)
 */
export const BusinessResponseSchema = BusinessResponse.openapi(
  'BusinessResponse',
  {
    description: 'Business information for public view',
  },
)

export type BusinessResponse = z.infer<typeof BusinessResponse>

// ============= Search Businesses =============

/**
 * Business search/filter parameters (raw Zod)
 */
export const BusinessQueryParams = SearchParams.extend({
  categoryId: UUID.optional().describe('Filter by category'),
  verified: optionalBoolean().describe('Filter by verification status'),
  active: optionalBoolean().describe('Filter by active status'),
  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Minimum rating filter'),
  sortBy: BusinessSortBy.default(BusinessSortByEnum.BUSINESS_NAME),
})

/**
 * Business search/filter parameters (OpenAPI documented)
 */
export const BusinessQueryParamsSchema = BusinessQueryParams.openapi(
  'BusinessQueryParams',
  {
    description: 'Business search and filter parameters',
  },
)

export type BusinessQueryParams = z.infer<typeof BusinessQueryParams>

/**
 * Business path parameters (raw Zod)
 */
export const BusinessPathParams = z.object({
  id: UUID.describe('Business ID'),
})

/**
 * Business path parameters (OpenAPI documented)
 */
export const BusinessPathParamsSchema = BusinessPathParams.openapi(
  'BusinessPathParams',
  {
    description: 'Business path parameters',
  },
)

export type BusinessPathParams = z.infer<typeof BusinessPathParams>

/**
 * Business detail query parameters (for single business endpoints) (raw Zod)
 */
export const BusinessDetailQueryParams =
  createByIdQuerySchema(BUSINESS_RELATIONS)

/**
 * Business detail query parameters (OpenAPI documented)
 */
export const BusinessDetailQueryParamsSchema =
  BusinessDetailQueryParams.openapi('BusinessDetailQueryParams', {
    description: 'Business detail query parameters',
  })

export type BusinessDetailQueryParams = z.infer<
  typeof BusinessDetailQueryParams
>

// ============= Response Types =============

/**
 * Paginated business list response (raw Zod)
 */
export const BusinessListResponse = paginatedResponse(BusinessResponse)

/**
 * Paginated business list response (OpenAPI documented)
 */
export const BusinessListResponseSchema = BusinessListResponse.openapi(
  'BusinessListResponse',
  {
    description: 'Paginated list of businesses',
  },
)

export type BusinessListResponse = z.infer<typeof BusinessListResponse>

/**
 * Businesses by category response (raw Zod)
 */
export const BusinessesByCategoryResponse = z.object({
  categoryId: UUID,
  categoryName: z.string(),
  businesses: z.array(BusinessResponse),
  totalCount: z.number().int().nonnegative(),
})

/**
 * Businesses by category response (OpenAPI documented)
 */
export const BusinessesByCategoryResponseSchema =
  BusinessesByCategoryResponse.openapi('BusinessesByCategoryResponse', {
    description: 'Businesses grouped by category',
  })

export type BusinessesByCategoryResponse = z.infer<
  typeof BusinessesByCategoryResponse
>

// ============= Create/Update Requests =============

/**
 * Create my business request (for business owners) (raw Zod)
 */
export const CreateMyBusinessRequest = z.object({
  businessName: z
    .string()
    .min(FIELD_LENGTH.NAME_MIN)
    .max(FIELD_LENGTH.NAME_MAX)
    .describe('Business name'),
  businessDescription: z
    .string()
    .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
    .optional()
    .describe('Business description'),
  categoryId: UUID.optional().describe(
    'Category ID (can be assigned later by admin)',
  ),
})

/**
 * Create my business request (OpenAPI documented)
 */
export const CreateMyBusinessRequestSchema = CreateMyBusinessRequest.openapi(
  'CreateMyBusinessRequest',
  {
    description: 'Create business data for business owners',
  },
)

export type CreateMyBusinessRequest = z.infer<typeof CreateMyBusinessRequest>

/**
 * Create my business response (raw Zod)
 */
export const CreateMyBusinessResponse = z.object({
  id: UUID.describe('Newly created business ID'),
  businessName: z.string().describe('Business name'),
  approved: z.boolean().default(false).describe('Business approval status'),
  message: z
    .string()
    .default('Business created successfully. Awaiting admin approval.'),
})

/**
 * Create my business response (OpenAPI documented)
 */
export const CreateMyBusinessResponseSchema = CreateMyBusinessResponse.openapi(
  'CreateMyBusinessResponse',
  {
    description: 'Business creation response',
  },
)

export type CreateMyBusinessResponse = z.infer<typeof CreateMyBusinessResponse>

/**
 * Update my business request (for business owners) (raw Zod)
 */
export const UpdateMyBusinessRequest = z.object({
  businessName: z
    .string()
    .min(1)
    .max(FIELD_LENGTH.NAME_MAX)
    .optional()
    .describe('Business name'),
  businessDescription: z
    .string()
    .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
    .optional()
    .describe('Business description'),
  categoryId: UUID.optional().describe('Category ID'),
})

/**
 * Update my business request (OpenAPI documented)
 */
export const UpdateMyBusinessRequestSchema = UpdateMyBusinessRequest.openapi(
  'UpdateMyBusinessRequest',
  {
    description: 'Update business data for business owners',
  },
)

export type UpdateMyBusinessRequest = z.infer<typeof UpdateMyBusinessRequest>
