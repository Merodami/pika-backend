/**
 * Sorting adapter module
 * Provides functions to convert between API query parameters and domain model types
 */

import type { CampaignSearchQuery } from '@campaign-read/application/use_cases/queries/CampaignSearchQuery.js'
import type { schemas } from '@pika/api'
import { convertApiSortParams } from '@pika/shared'

/**
 * Adapts API campaign search query to domain model CampaignSearchQuery
 * Handles transformation of sorting parameters
 *
 * @param apiQuery - API query parameters from request
 * @returns Domain model compatible search query
 */
export function adaptCampaignSearchQuery(
  apiQuery: schemas.CampaignSearchQuery,
): Omit<CampaignSearchQuery, 'name'> {
  // Convert sorting parameters using our enhanced type-safe utility
  const { sortBy, sortOrder } = convertApiSortParams({
    sort: typeof apiQuery.sort === 'string' ? apiQuery.sort : undefined,
    sort_by:
      typeof apiQuery.sort_by === 'string' ? apiQuery.sort_by : undefined,
    sort_order: apiQuery.sort_order as 'asc' | 'desc' | undefined,
  })

  return {
    // Map API snake_case to domain camelCase
    providerId: apiQuery.provider_id,
    status: apiQuery.status,
    active:
      apiQuery.active !== undefined ? apiQuery.active === true : undefined,
    startDateFrom: apiQuery.start_date_from
      ? new Date(apiQuery.start_date_from)
      : undefined,
    startDateTo: apiQuery.start_date_to
      ? new Date(apiQuery.start_date_to)
      : undefined,
    endDateFrom: apiQuery.end_date_from
      ? new Date(apiQuery.end_date_from)
      : undefined,
    endDateTo: apiQuery.end_date_to
      ? new Date(apiQuery.end_date_to)
      : undefined,
    minBudget: apiQuery.budget_min,
    maxBudget: apiQuery.budget_max,

    // Pagination
    page: apiQuery.page,
    limit: apiQuery.limit,

    // Sorting parameters
    sortBy,
    sortOrder,
  }
}
