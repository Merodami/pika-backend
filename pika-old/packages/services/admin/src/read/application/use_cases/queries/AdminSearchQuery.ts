import {
  AdminPermission,
  AdminRole,
  AdminStatus,
} from '@admin-read/domain/entities/Admin.js'

/**
 * Admin search query parameters
 * Used by application services to retrieve admins with filtering, sorting, and pagination
 */
export interface AdminSearchQuery {
  // Filter parameters
  role?: AdminRole
  status?: AdminStatus
  email?: string
  search?: string
  permissions?: AdminPermission[]
  created_by?: string

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include relationships parameters
  includePermissions?: boolean
}
