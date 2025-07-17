/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

import {
  AdminPermission,
  AdminRole,
  AdminStatus,
} from '@admin-read/domain/entities/Admin.js'

/**
 * WHERE input for Admin queries
 */
export interface AdminWhereInput {
  AND?: AdminWhereInput | AdminWhereInput[]
  OR?: AdminWhereInput[]
  NOT?: AdminWhereInput | AdminWhereInput[]
  id?: string | StringFilter
  user_id?: string | StringFilter
  role?: AdminRole | AdminRoleFilter
  permissions?: AdminPermission[] | AdminPermissionFilter
  status?: AdminStatus | AdminStatusFilter
  name?: JsonFilter
  email?: string | StringFilter
  last_login_at?: Date | DateTimeNullableFilter | null
  created_at?: Date | DateTimeFilter
  updated_at?: Date | DateTimeFilter
  created_by?: string | StringNullableFilter | null
  metadata?: JsonNullableFilter
}

/**
 * INCLUDE input for Admin queries
 */
export interface AdminInclude {
  user?: boolean | AdminUserIncludeOptions
}

/**
 * Include options for nested Admin relationships
 */
export interface AdminUserIncludeOptions {
  where?: any
  orderBy?: any
  select?: any
}

/**
 * ORDER BY input for Admin queries
 */
export interface AdminOrderByInput {
  id?: SortOrder
  user_id?: SortOrder
  role?: SortOrder
  status?: SortOrder
  name?: SortOrder
  email?: SortOrder
  last_login_at?: SortOrder
  created_at?: SortOrder
  updated_at?: SortOrder
  created_by?: SortOrder
}

// Common filter types
export type SortOrder = 'asc' | 'desc'

export interface StringFilter {
  equals?: string
  in?: string[]
  notIn?: string[]
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  contains?: string
  startsWith?: string
  endsWith?: string
  mode?: 'default' | 'insensitive'
  not?: string | StringFilter
}

export interface StringNullableFilter {
  equals?: string | null
  in?: string[] | null
  notIn?: string[] | null
  lt?: string
  lte?: string
  gt?: string
  gte?: string
  contains?: string
  startsWith?: string
  endsWith?: string
  mode?: 'default' | 'insensitive'
  not?: string | StringNullableFilter | null
}

export interface IntFilter {
  equals?: number
  in?: number[]
  notIn?: number[]
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  not?: number | IntFilter
}

export interface BooleanFilter {
  equals?: boolean
  not?: boolean | BooleanFilter
}

export interface DateTimeFilter {
  equals?: Date
  in?: Date[]
  notIn?: Date[]
  lt?: Date
  lte?: Date
  gt?: Date
  gte?: Date
  not?: Date | DateTimeFilter
}

export interface DateTimeNullableFilter {
  equals?: Date | null
  in?: Date[] | null
  notIn?: Date[] | null
  lt?: Date
  lte?: Date
  gt?: Date
  gte?: Date
  not?: Date | DateTimeNullableFilter | null
}

export interface JsonFilter {
  equals?: any
  path?: string[]
  string_contains?: string
  array_contains?: any
  mode?: 'insensitive' | 'default'
}

export interface JsonNullableFilter {
  equals?: any | null
  path?: string[]
  string_contains?: string
  array_contains?: any
  mode?: 'insensitive' | 'default'
  not?: any | JsonNullableFilter | null
}

export interface AdminRoleFilter {
  equals?: AdminRole
  in?: AdminRole[]
  notIn?: AdminRole[]
  not?: AdminRole | AdminRoleFilter
}

export interface AdminStatusFilter {
  equals?: AdminStatus
  in?: AdminStatus[]
  notIn?: AdminStatus[]
  not?: AdminStatus | AdminStatusFilter
}

export interface AdminPermissionFilter {
  equals?: AdminPermission[]
  has?: AdminPermission
  hasEvery?: AdminPermission[]
  hasSome?: AdminPermission[]
  isEmpty?: boolean
}
