import { z } from 'zod'

import { SortOrder } from './enums.js'
import { PaginationParams } from './pagination.js'

/**
 * Query parameter utilities for consistent API patterns
 */

// ============= Typed Sorting =============

/**
 * Creates a typed sort schema with specific sort fields
 */
export function createSortParams<T extends readonly string[]>(
  sortFields: T,
  defaultField: T[number] = sortFields[0],
) {
  return z.object({
    sortBy: z
      .enum(sortFields as unknown as [string, ...string[]])
      .default(defaultField),
    sortOrder: SortOrder.default(SortOrder.enum.desc),
  })
}

// ============= Include Relations =============

/**
 * Creates an include parameter for relation loading
 */
export function createIncludeParam<T extends readonly string[]>(
  allowedRelations: T,
) {
  return z.object({
    include: z
      .string()
      .optional()
      .describe(`Comma-separated relations: ${allowedRelations.join(',')}`),
  })
}

// ============= Combined Search Schemas =============

/**
 * Creates a complete search schema with pagination, sorting, and includes
 */
export function createSearchSchema<
  TSortFields extends readonly string[],
  TIncludeRelations extends readonly string[],
>(config: {
  sortFields: TSortFields
  includeRelations: TIncludeRelations
  defaultSortField?: TSortFields[number]
  additionalParams?: z.ZodRawShape
}) {
  const {
    sortFields,
    includeRelations,
    defaultSortField,
    additionalParams = {},
  } = config

  return z.object({
    ...PaginationParams.shape,
    ...createSortParams(sortFields, defaultSortField).shape,
    ...createIncludeParam(includeRelations).shape,
    search: z.string().optional(),
    ...additionalParams,
  })
}

/**
 * Creates a by-ID query schema with include support
 */
export function createByIdQuerySchema<T extends readonly string[]>(
  allowedRelations: T,
) {
  return createIncludeParam(allowedRelations)
}
