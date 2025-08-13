import { CategorySortBy, FIELD_LENGTH } from '@pika/types'
import { z } from 'zod'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { CategorySortBySchema } from '../common/enums.js'
import { CATEGORY_RELATIONS } from '../common/enums.js'

/**
 * Public category schemas
 */

// ============= Category Response =============

/**
 * Base category response (non-recursive) (raw Zod)
 */
const BaseCategoryResponse = withTimestamps({
  id: UUID,
  nameKey: z
    .string()
    .max(FIELD_LENGTH.SLUG_MAX)
    .describe('Translation key for category name'),
  descriptionKey: z
    .string()
    .max(FIELD_LENGTH.SLUG_MAX)
    .optional()
    .describe('Translation key for category description'),
  icon: z
    .string()
    .max(FIELD_LENGTH.ICON_MAX)
    .optional()
    .describe('Category icon identifier'),
  parentId: UUID.optional().describe(
    'Parent category ID for hierarchical structure',
  ),
  isActive: z.boolean().default(true).describe('Whether category is active'),
  sortOrder: z.number().int().default(0).describe('Sort order for display'),
  slug: z
    .string()
    .max(FIELD_LENGTH.SLUG_MAX)
    .describe('URL-friendly category identifier'),
  level: z
    .number()
    .int()
    .describe('Hierarchy level (1 for root, 2+ for children)'),
  path: z.string().describe('Hierarchical path using parent IDs'),
  createdBy: UserId.describe('User who created the category'),
  updatedBy: UserId.optional().describe('User who last updated the category'),
})

/**
 * Base category response (OpenAPI documented)
 */
const BaseCategoryResponseSchema = BaseCategoryResponse.openapi(
  'BaseCategoryResponse',
  {
    description: 'Category information',
  },
)

/**
 * Public category response with optional children (raw Zod)
 * Note: Using manual $ref for recursive structure as z.lazy() is not supported in zod-to-openapi
 */
export const CategoryResponse = BaseCategoryResponse.extend({
  children: z
    .array(BaseCategoryResponse)
    .optional()
    .describe('Child categories for hierarchical display'),
})

/**
 * Public category response (OpenAPI documented)
 */
export const CategoryResponseSchema = CategoryResponse.openapi(
  'CategoryResponse',
  {
    description: 'Category information with hierarchical structure',
  },
)

export type CategoryResponse = z.infer<typeof CategoryResponse>

// ============= Search Categories =============

/**
 * Category search/filter parameters (raw Zod)
 */
export const CategoryQueryParams = SearchParams.extend({
  parentId: UUID.optional().describe('Filter by parent category'),
  isActive: optionalBoolean().describe('Filter by active status'),
  sortBy: CategorySortBySchema.default(CategorySortBy.SORT_ORDER),
}).merge(createIncludeParam(CATEGORY_RELATIONS))

/**
 * Category search/filter parameters (OpenAPI documented)
 */
export const CategoryQueryParamsSchema = CategoryQueryParams.openapi(
  'CategoryQueryParams',
  {
    description: 'Category search and filter parameters',
  },
)

export type CategoryQueryParams = z.infer<typeof CategoryQueryParams>

/**
 * Category hierarchy query parameters (raw Zod)
 */
export const CategoryHierarchyQuery = z.object({
  rootId: UUID.optional().describe('Root category ID for partial hierarchy'),
})

/**
 * Category hierarchy query parameters (OpenAPI documented)
 */
export const CategoryHierarchyQuerySchema = CategoryHierarchyQuery.openapi(
  'CategoryHierarchyQuery',
  {
    description: 'Category hierarchy query parameters',
  },
)

export type CategoryHierarchyQuery = z.infer<typeof CategoryHierarchyQuery>

/**
 * Category path parameters (raw Zod)
 */
export const CategoryPathParams = z.object({
  id: UUID.describe('Category ID'),
})

/**
 * Category path parameters (OpenAPI documented)
 */
export const CategoryPathParamsSchema = CategoryPathParams.openapi(
  'CategoryPathParams',
  {
    description: 'Category path parameters',
  },
)

export type CategoryPathParams = z.infer<typeof CategoryPathParams>

// ============= Response Types =============

/**
 * Paginated category list response (raw Zod)
 */
export const CategoryListResponse = paginatedResponse(CategoryResponse)

/**
 * Paginated category list response (OpenAPI documented)
 */
export const CategoryListResponseSchema = CategoryListResponse.openapi(
  'CategoryListResponse',
  {
    description: 'Paginated list of categories',
  },
)

export type CategoryListResponse = z.infer<typeof CategoryListResponse>

/**
 * Category hierarchy response (raw Zod)
 */
export const CategoryHierarchyResponse = z.object({
  data: z.array(CategoryResponse),
})

/**
 * Category hierarchy response (OpenAPI documented)
 */
export const CategoryHierarchyResponseSchema = CategoryHierarchyResponse.openapi(
  'CategoryHierarchyResponse',
  {
    description: 'Hierarchical category tree structure',
  },
)

export type CategoryHierarchyResponse = z.infer<
  typeof CategoryHierarchyResponse
>

/**
 * Category path response (raw Zod)
 */
export const CategoryPathResponse = z.object({
  data: z.array(CategoryResponse),
})

/**
 * Category path response (OpenAPI documented)
 */
export const CategoryPathResponseSchema = CategoryPathResponse.openapi(
  'CategoryPathResponse',
  {
    description: 'Category path from root to specified category',
  },
)

export type CategoryPathResponse = z.infer<typeof CategoryPathResponse>
