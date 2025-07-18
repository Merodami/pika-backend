import { z } from 'zod'

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
