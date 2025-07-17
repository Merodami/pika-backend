/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import { convertApiSortParams } from '@pika/shared'

import type { UserSearchQuery } from '../use_cases/queries/UserSearchQuery.js'

/**
 * Type for API user search query parameters
 */
export interface ApiUserSearchQuery {
  // Filter parameters
  email?: string
  role?: string
  status?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  email_verified?: boolean
  phone_verified?: boolean

  // Time-based filters (as ISO strings in API)
  created_at_start?: string
  created_at_end?: string
  updated_at_start?: string
  updated_at_end?: string
  last_login_at_start?: string
  last_login_at_end?: string

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters (API format)
  sort?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'

  // Include relationships parameters
  include_addresses?: boolean
  include_payment_methods?: boolean
  include_customer_profile?: boolean
  include_provider_profile?: boolean
}

/**
 * Adapts API user search query to domain model UserSearchQuery
 * Handles transformation of sorting parameters and date conversions
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptUserSearchQuery(
  apiQuery: ApiUserSearchQuery,
): UserSearchQuery {
  // Convert sorting parameters using our type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    email: apiQuery.email,
    role: apiQuery.role as any, // Will be validated by the repository
    status: apiQuery.status as any, // Will be validated by the repository
    firstName: apiQuery.first_name,
    lastName: apiQuery.last_name,
    phoneNumber: apiQuery.phone_number,
    emailVerified: apiQuery.email_verified,
    phoneVerified: apiQuery.phone_verified,

    // Convert date strings to Date objects
    createdAtStart: apiQuery.created_at_start
      ? new Date(apiQuery.created_at_start)
      : undefined,
    createdAtEnd: apiQuery.created_at_end
      ? new Date(apiQuery.created_at_end)
      : undefined,
    updatedAtStart: apiQuery.updated_at_start
      ? new Date(apiQuery.updated_at_start)
      : undefined,
    updatedAtEnd: apiQuery.updated_at_end
      ? new Date(apiQuery.updated_at_end)
      : undefined,
    lastLoginAtStart: apiQuery.last_login_at_start
      ? new Date(apiQuery.last_login_at_start)
      : undefined,
    lastLoginAtEnd: apiQuery.last_login_at_end
      ? new Date(apiQuery.last_login_at_end)
      : undefined,

    // Pagination - convert strings to numbers
    page: apiQuery.page ? Number(apiQuery.page) : undefined,
    limit: apiQuery.limit ? Number(apiQuery.limit) : undefined,

    // Sorting parameters
    sortBy,
    sortOrder,

    // Include relationships
    includeAddresses: apiQuery.include_addresses,
    includePaymentMethods: apiQuery.include_payment_methods,
    includeCustomerProfile: apiQuery.include_customer_profile,
    includeProviderProfile: apiQuery.include_provider_profile,
  }
}
