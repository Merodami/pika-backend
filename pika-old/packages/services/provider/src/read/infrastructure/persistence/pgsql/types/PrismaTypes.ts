/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

/**
 * WHERE input for Category queries
 */
export interface CategoryWhereInput {
  AND?: CategoryWhereInput | CategoryWhereInput[]
  OR?: CategoryWhereInput[]
  NOT?: CategoryWhereInput | CategoryWhereInput[]
  id?: string | StringFilter
  name?: JsonFilter
  description?: JsonFilter
  icon_url?: string | StringNullableFilter | null
  slug?: string | StringFilter
  parentId?: string | StringNullableFilter | null
  level?: number | IntFilter
  path?: string | StringFilter
  active?: boolean | BooleanFilter
  sort_order?: number | IntFilter
  created_at?: Date | DateTimeFilter
  updated_at?: Date | DateTimeFilter
  // Add other filter fields as needed
}

/**
 * INCLUDE input for Category queries
 */
export interface CategoryInclude {
  children?: boolean | CategoryIncludeOptions
}

/**
 * Include options for nested Category relationships
 */
export interface CategoryIncludeOptions {
  where?: CategoryWhereInput
  orderBy?: any
  select?: any
}

/**
 * ORDER BY input for Category queries
 */
export interface CategoryOrderByInput {
  id?: SortOrder
  name?: SortOrder
  slug?: SortOrder
  level?: SortOrder
  active?: SortOrder
  sort_order?: SortOrder
  created_at?: SortOrder
  updated_at?: SortOrder
  // Add other sortable fields as needed
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

export interface JsonFilter {
  equals?: any
  path?: string[]
  string_contains?: string
  array_contains?: any
  mode?: 'insensitive' | 'default'
}
