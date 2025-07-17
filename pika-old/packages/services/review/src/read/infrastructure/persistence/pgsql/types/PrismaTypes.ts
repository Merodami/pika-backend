/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

/**
 * WHERE input for Review queries
 */
export interface ReviewWhereInput {
  AND?: ReviewWhereInput | ReviewWhereInput[]
  OR?: ReviewWhereInput[]
  NOT?: ReviewWhereInput | ReviewWhereInput[]
  id?: string | StringFilter
  provider_id?: string | StringFilter
  customer_id?: string | StringFilter
  rating?: number | IntFilter
  review?: string | StringNullableFilter | null
  response?: string | StringNullableFilter | null
  response_at?: Date | DateTimeNullableFilter | null
  created_at?: Date | DateTimeNullableFilter | null
  updated_at?: Date | DateTimeNullableFilter | null
  deleted_at?: Date | DateTimeNullableFilter | null
}

/**
 * INCLUDE input for Review queries
 */
export interface ReviewInclude {
  provider?: boolean | ReviewProviderIncludeOptions
  customer?: boolean | ReviewCustomerIncludeOptions
}

/**
 * Include options for provider relationships
 */
export interface ReviewProviderIncludeOptions {
  select?: {
    id?: boolean
    businessName?: boolean
  }
}

/**
 * Include options for customer relationships
 */
export interface ReviewCustomerIncludeOptions {
  select?: {
    id?: boolean
    firstName?: boolean
    lastName?: boolean
  }
}

/**
 * ORDER BY input for Review queries
 */
export interface ReviewOrderByInput {
  id?: SortOrder
  provider_id?: SortOrder
  customer_id?: SortOrder
  rating?: SortOrder
  created_at?: SortOrder
  updated_at?: SortOrder
  response_at?: SortOrder
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
