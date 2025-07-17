/**
 * @file Centralized sorting utilities for standardizing sort operations across the application
 */

import { camelCase, snakeCase } from 'lodash-es'

/**
 * Represents standard sort parameters in the application
 */
export interface SortParams {
  sortBy?: string | null
  sortOrder?: 'asc' | 'desc' | null
}

/**
 * Represents API sort parameters in snake_case format
 */
export interface ApiSortParams {
  sort?: string | null
  sort_by?: string | null
  sort_order?: 'asc' | 'desc' | null
}

/**
 * Default sort direction if not specified
 */
export const DEFAULT_SORT_DIRECTION = 'asc'

/**
 * Parse a combined sort string into separate sortBy and sortOrder parameters
 * @param sortString - Combined sort string in format 'field:direction'
 * @returns Parsed sort parameters
 */
export function parseSortString(sortString?: string | null): SortParams {
  if (!sortString) {
    return {}
  }

  const parts = sortString.split(':')

  if (parts.length === 1) {
    return {
      sortBy: parts[0],
      sortOrder: DEFAULT_SORT_DIRECTION,
    }
  }

  return {
    sortBy: parts[0],
    sortOrder: parts[1] === 'desc' ? 'desc' : 'asc',
  }
}

/**
 * Convert API sort parameters to standardized sort parameters
 * Handles both combined 'sort' parameter and separate 'sort_by'/'sort_order' parameters
 * Prioritizes sort_by/sort_order if both formats are provided
 *
 * @param params - API sort parameters
 * @returns Standardized sort parameters
 */
export function normalizeApiSortParams(params: ApiSortParams): SortParams {
  // Initialize with default empty result
  const result: SortParams = {}

  // First process the combined sort parameter if present
  if (params.sort) {
    const parsed = parseSortString(params.sort)

    result.sortBy = parsed.sortBy
    result.sortOrder = parsed.sortOrder
  }

  // Then override with explicit sort_by and sort_order if provided
  // This gives priority to the explicit parameters
  if (params.sort_by) {
    // Convert snake_case field names to camelCase
    result.sortBy = camelCase(params.sort_by)
  }

  if (params.sort_order) {
    result.sortOrder = params.sort_order
  }

  return result
}

/**
 * Converts SortParams to a format suitable for Prisma ORM
 * Handles converting field names from camelCase to snake_case if needed
 *
 * @param params - Sort parameters
 * @param defaultSortBy - Default field to sort by if none provided
 * @param defaultSortOrder - Default sort direction if none provided
 * @returns Sort object for Prisma
 */
export function toPrismaSort(
  params: SortParams,
  defaultSortBy?: string,
  defaultSortOrder: 'asc' | 'desc' = DEFAULT_SORT_DIRECTION,
): Record<string, 'asc' | 'desc'> {
  const sortBy = params.sortBy || defaultSortBy
  const sortOrder = params.sortOrder || defaultSortOrder

  if (!sortBy) {
    return {}
  }

  // Return an object with the field name as key and sort order as value
  return { [sortBy]: sortOrder }
}

/**
 * Converts SortParams to a format suitable for SQL queries
 * Handles converting field names from camelCase to snake_case
 *
 * @param params - Sort parameters
 * @param defaultSortBy - Default field to sort by if none provided
 * @param defaultSortOrder - Default sort direction if none provided
 * @returns SQL ORDER BY clause or empty string if no sorting
 */
export function toSqlOrderByClause(
  params: SortParams,
  defaultSortBy?: string,
  defaultSortOrder: 'asc' | 'desc' = DEFAULT_SORT_DIRECTION,
): string {
  const sortBy = params.sortBy || defaultSortBy
  const sortOrder = params.sortOrder || defaultSortOrder

  if (!sortBy) {
    return ''
  }

  // Convert to snake_case for SQL and uppercase the direction
  const field = snakeCase(sortBy)
  const direction = sortOrder.toUpperCase()

  return `ORDER BY ${field} ${direction}`
}

/**
 * Validates if a field is allowed for sorting
 *
 * @param field - Field name to validate
 * @param allowedFields - Array of allowed field names
 * @returns True if field is allowed, false otherwise
 */
export function isValidSortField(
  field?: string | null,
  allowedFields: string[] = [],
): boolean {
  if (!field || allowedFields.length === 0) {
    return false
  }

  return allowedFields.includes(field)
}

/**
 * Creates a sort validator function that can be used in route handlers
 *
 * @param allowedFields - Array of allowed field names
 * @returns Validator function
 */
export function createSortValidator(allowedFields: string[]) {
  return (params: ApiSortParams): boolean => {
    if (params.sort) {
      const { sortBy } = parseSortString(params.sort)

      return isValidSortField(sortBy, allowedFields)
    }

    return isValidSortField(params.sort_by, allowedFields)
  }
}
