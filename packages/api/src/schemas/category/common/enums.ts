import { z } from 'zod'

import { createSortFieldMapper } from '../../../common/utils/sorting.js'

/**
 * Category-specific enum schemas
 */

// ============= Category Enums =============

/**
 * Category sort fields - shared across public and admin APIs
 */
export const CategorySortBy = z.enum([
  'name',
  'sortOrder',
  'createdAt',
  'updatedAt',
])

export type CategorySortBy = z.infer<typeof CategorySortBy>

/**
 * Category sort field mapper
 * Maps API sort fields to database column names
 */
export const categorySortFieldMapper = createSortFieldMapper(CategorySortBy, {
  name: 'nameKey',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
})
