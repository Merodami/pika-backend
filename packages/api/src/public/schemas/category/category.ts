import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { CategorySortBy, SortOrder } from '../../../common/schemas/enums.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public category schemas
 */

// ============= Category Response =============

/**
 * Public category response
 */
export const CategoryResponse: z.ZodType<any> = z.lazy(() =>
  openapi(
    withTimestamps({
      id: UUID,
      nameKey: z
        .string()
        .max(255)
        .describe('Translation key for category name'),
      descriptionKey: z
        .string()
        .max(255)
        .optional()
        .describe('Translation key for category description'),
      icon: z.string().max(255).optional().describe('Category icon identifier'),
      parentId: UUID.optional().describe(
        'Parent category ID for hierarchical structure',
      ),
      isActive: z
        .boolean()
        .default(true)
        .describe('Whether category is active'),
      sortOrder: z.number().int().default(0).describe('Sort order for display'),
      createdBy: UserId.describe('User who created the category'),
      updatedBy: UserId.optional().describe(
        'User who last updated the category',
      ),
      children: z
        .array(CategoryResponse)
        .optional()
        .describe('Child categories for hierarchical display'),
    }),
    {
      description: 'Category information',
    },
  ),
)

export type CategoryResponse = z.infer<typeof CategoryResponse>

// ============= Search Categories =============

/**
 * Category search/filter parameters
 */
export const CategorySearchParams = z.object({
  search: z.string().optional().describe('Search in category name/description'),
  parentId: UUID.optional().describe('Filter by parent category'),
  isActive: z.boolean().optional().describe('Filter by active status'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: CategorySortBy.default('SORT_ORDER'),
  sortOrder: SortOrder.default('ASC'),
})

export type CategorySearchParams = z.infer<typeof CategorySearchParams>

// ============= Response Types =============

/**
 * Paginated category list response
 */
export const CategoryListResponse = paginatedResponse(CategoryResponse)

export type CategoryListResponse = z.infer<typeof CategoryListResponse>

/**
 * Category tree response (hierarchical structure)
 */
export const CategoryTreeResponse = openapi(
  z.object({
    categories: z.array(CategoryResponse),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Hierarchical category tree structure',
  },
)

export type CategoryTreeResponse = z.infer<typeof CategoryTreeResponse>

// ============= Parameters =============

/**
 * Category ID parameter
 */
export const CategoryIdParam = z.object({
  id: UUID.describe('Category ID'),
})

export type CategoryIdParam = z.infer<typeof CategoryIdParam>
