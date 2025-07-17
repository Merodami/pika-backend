import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { BusinessSortBy, BUSINESS_RELATIONS } from '../../../schemas/business/common/enums.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { SearchParams } from '../../../common/schemas/pagination.js'
import { UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public business schemas
 */

// ============= Business Response =============

/**
 * Public business response
 */
export const BusinessResponse: z.ZodType<any> = z.lazy(() =>
  openapi(
    withTimestamps({
      id: UUID,
      userId: UserId.describe('User who owns this business'),
      businessNameKey: z
        .string()
        .max(255)
        .describe('Translation key for business name'),
      businessDescriptionKey: z
        .string()
        .max(255)
        .optional()
        .describe('Translation key for business description'),
      categoryId: UUID.describe('Category this business belongs to'),
      verified: z
        .boolean()
        .default(false)
        .describe('Whether business is verified'),
      active: z
        .boolean()
        .default(true)
        .describe('Whether business is active'),
      avgRating: z
        .number()
        .min(0)
        .max(5)
        .default(0)
        .describe('Average rating of the business'),
      // Optional relations
      user: z
        .object({
          id: UUID,
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().email(),
        })
        .optional()
        .describe('User who owns this business'),
      category: z
        .object({
          id: UUID,
          nameKey: z.string(),
          descriptionKey: z.string().optional(),
          icon: z.string().optional(),
        })
        .optional()
        .describe('Category information'),
    }),
    {
      description: 'Business information for public view',
    },
  ),
)

export type BusinessResponse = z.infer<typeof BusinessResponse>

// ============= Search Businesses =============

/**
 * Business search/filter parameters
 */
export const BusinessQueryParams = SearchParams.extend({
  categoryId: UUID.optional().describe('Filter by category'),
  verified: z.boolean().optional().describe('Filter by verification status'),
  active: z.boolean().optional().describe('Filter by active status'),
  minRating: z.number().min(0).max(5).optional().describe('Minimum rating filter'),
  sortBy: BusinessSortBy.default('businessName'),
})

export type BusinessQueryParams = z.infer<typeof BusinessQueryParams>

/**
 * Business path parameters
 */
export const BusinessPathParams = z.object({
  id: UUID.describe('Business ID'),
})

export type BusinessPathParams = z.infer<typeof BusinessPathParams>

// ============= Response Types =============

/**
 * Paginated business list response
 */
export const BusinessListResponse = paginatedResponse(BusinessResponse)

export type BusinessListResponse = z.infer<typeof BusinessListResponse>

/**
 * Businesses by category response
 */
export const BusinessesByCategoryResponse = openapi(
  z.object({
    categoryId: UUID,
    categoryName: z.string(),
    businesses: z.array(BusinessResponse),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Businesses grouped by category',
  },
)

export type BusinessesByCategoryResponse = z.infer<typeof BusinessesByCategoryResponse>