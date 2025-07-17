/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

/**
 * WHERE input for Campaign queries
 */
export interface CampaignWhereInput {
  AND?: CampaignWhereInput | CampaignWhereInput[]
  OR?: CampaignWhereInput[]
  NOT?: CampaignWhereInput | CampaignWhereInput[]
  id?: string | StringFilter
  name?: JsonFilter
  description?: JsonFilter
  start_date?: Date | DateTimeFilter
  end_date?: Date | DateTimeFilter
  budget?: number | DecimalFilter
  status?: string | StringFilter
  provider_id?: string | StringFilter
  active?: boolean | BooleanFilter
  created_at?: Date | DateTimeFilter
  updated_at?: Date | DateTimeFilter
  // Add other filter fields as needed
}

/**
 * ORDER BY input for Campaign queries
 */
export interface CampaignOrderByInput {
  id?: SortOrder
  name?: SortOrder
  start_date?: SortOrder
  end_date?: SortOrder
  budget?: SortOrder
  status?: SortOrder
  provider_id?: SortOrder
  active?: SortOrder
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

export interface DecimalFilter {
  equals?: number
  in?: number[]
  notIn?: number[]
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  not?: number | DecimalFilter
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
