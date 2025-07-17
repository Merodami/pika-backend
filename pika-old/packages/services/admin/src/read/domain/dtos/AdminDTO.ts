import { MultilingualText } from '@pika/types-core'

import { AdminPermission, AdminRole, AdminStatus } from '../entities/Admin.js'

/**
 * Data Transfer Object for Admins
 * Used for transferring admin data between application layers
 */
export interface AdminDTO {
  id: string
  user_id: string
  role: AdminRole
  permissions: AdminPermission[]
  status: AdminStatus
  name: MultilingualText
  email: string
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  metadata: Record<string, any> | null
  // Optional localized fields used for API responses
  localized_name?: string
}

/**
 * Admin creation DTO
 */
export interface AdminCreateDTO {
  user_id: string
  role: AdminRole
  permissions: AdminPermission[]
  name: MultilingualText
  email: string
  metadata?: Record<string, any>
}

/**
 * Admin update DTO
 */
export interface AdminUpdateDTO {
  role?: AdminRole
  permissions?: AdminPermission[]
  status?: AdminStatus
  name?: MultilingualText
  email?: string
  metadata?: Record<string, any>
}

/**
 * Admin list response structure
 * Includes pagination metadata
 */
export interface AdminListResponseDTO {
  data: AdminDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

/**
 * Admin search query DTO
 */
export interface AdminSearchQuery {
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'email' | 'last_login_at'
  sort_order?: 'asc' | 'desc'
  role?: AdminRole
  status?: AdminStatus
  search?: string
  permissions?: AdminPermission[]
}
