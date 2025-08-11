/**
 * Pagination and filtering primitive types
 * Standardized query parameter types used across the platform
 */

import type { SortOrderType } from '../enums/common.js'

// Re-export existing pagination types for consistency
export type {
  PaginatedQuery,
  PaginatedResult,
  PaginationMetadata,
  SearchParams,
} from '../types.js'

/**
 * Geographic search parameters
 * Extends SearchParams with location-based filtering
 */
export interface GeoSearchParams {
  lat?: number
  lng?: number
  radius?: number // Search radius in kilometers
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrderType // This is 'asc' | 'desc'
}

/**
 * Date range filtering parameters
 * Use for filtering results by date range
 */
export interface DateRangeParams {
  startDate?: string // ISO 8601 date string
  endDate?: string // ISO 8601 date string
}

/**
 * Combined search with date range
 * Use for queries that need both pagination and date filtering
 */
export interface SearchParamsWithDateRange {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrderType
  startDate?: string
  endDate?: string
}

/**
 * Full-featured search parameters
 * Combines pagination, geographic, and date range filtering
 */
export interface AdvancedSearchParams {
  // Pagination
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrderType

  // Geographic
  lat?: number
  lng?: number
  radius?: number

  // Date range
  startDate?: string
  endDate?: string

  // Text search
  search?: string
  searchFields?: string[] // Which fields to search in
}
