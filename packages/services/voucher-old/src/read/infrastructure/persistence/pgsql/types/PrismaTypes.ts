/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

/**
 * WHERE input for Voucher queries
 */
export interface VoucherWhereInput {
  AND?: VoucherWhereInput | VoucherWhereInput[]
  OR?: VoucherWhereInput[]
  NOT?: VoucherWhereInput | VoucherWhereInput[]
  id?: string | StringFilter
  providerId?: string | StringFilter
  categoryId?: string | StringFilter
  state?: string | StringFilter
  title?: JsonFilter
  description?: JsonFilter
  terms?: JsonFilter
  discountType?: string | StringFilter
  discountValue?: number | DecimalFilter
  currency?: string | StringFilter
  imageUrl?: string | StringNullableFilter | null
  validFrom?: Date | DateTimeFilter
  expiresAt?: Date | DateTimeFilter
  maxRedemptions?: number | IntNullableFilter | null
  maxRedemptionsPerUser?: number | IntFilter
  currentRedemptions?: number | IntFilter
  metadata?: JsonFilter
  createdAt?: Date | DateTimeFilter
  updatedAt?: Date | DateTimeFilter
}

/**
 * INCLUDE input for Voucher queries
 */
export interface VoucherInclude {
  codes?: boolean | VoucherCodeIncludeOptions
  provider?: boolean
  category?: boolean
  redemptions?: boolean | VoucherRedemptionIncludeOptions
}

/**
 * Include options for nested Voucher relationships
 */
export interface VoucherCodeIncludeOptions {
  where?: any
  orderBy?: any
  select?: any
}

export interface VoucherRedemptionIncludeOptions {
  where?: any
  orderBy?: any
  select?: any
}

/**
 * ORDER BY input for Voucher queries
 */
export interface VoucherOrderByInput {
  id?: SortOrder
  providerId?: SortOrder
  categoryId?: SortOrder
  state?: SortOrder
  discountType?: SortOrder
  discountValue?: SortOrder
  currency?: SortOrder
  validFrom?: SortOrder
  expiresAt?: SortOrder
  maxRedemptions?: SortOrder
  maxRedemptionsPerUser?: SortOrder
  currentRedemptions?: SortOrder
  createdAt?: SortOrder
  updatedAt?: SortOrder
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

export interface IntNullableFilter {
  equals?: number | null
  in?: number[] | null
  notIn?: number[] | null
  lt?: number
  lte?: number
  gt?: number
  gte?: number
  not?: number | IntNullableFilter | null
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
