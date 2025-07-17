/**
 * Campaign search query parameters
 * Used by application services to retrieve campaigns with filtering, sorting, and pagination
 */
export interface CampaignSearchQuery {
  // Filter parameters
  providerId?: string
  status?: string
  active?: boolean
  name?: string
  startDateFrom?: Date
  startDateTo?: Date
  endDateFrom?: Date
  endDateTo?: Date
  minBudget?: number
  maxBudget?: number

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
