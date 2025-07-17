/**
 * Custom type definitions for Prisma inputs
 * These mimic the Prisma generated types but are manually defined for stability
 */

import {
  PageLayoutType,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

/**
 * WHERE input for VoucherBook queries
 */
export interface VoucherBookWhereInput {
  AND?: VoucherBookWhereInput | VoucherBookWhereInput[]
  OR?: VoucherBookWhereInput[]
  NOT?: VoucherBookWhereInput | VoucherBookWhereInput[]
  id?: string | StringFilter
  title?: string | StringFilter
  edition?: string | StringNullableFilter | null
  bookType?: VoucherBookType | EnumVoucherBookTypeFilter
  month?: number | IntNullableFilter | null
  year?: number | IntFilter
  status?: VoucherBookStatus | EnumVoucherBookStatusFilter
  totalPages?: number | IntFilter
  publishedAt?: Date | DateTimeNullableFilter | null
  pdfUrl?: string | StringNullableFilter | null
  pdfGeneratedAt?: Date | DateTimeNullableFilter | null
  metadata?: JsonFilter
  createdAt?: Date | DateTimeFilter
  updatedAt?: Date | DateTimeFilter
  deletedAt?: Date | DateTimeNullableFilter | null
}

/**
 * INCLUDE input for VoucherBook queries
 */
export interface VoucherBookInclude {
  pages?: boolean | VoucherBookPageIncludeOptions
  distributions?: boolean | BookDistributionIncludeOptions
}

/**
 * Include options for nested VoucherBookPage relationships
 */
export interface VoucherBookPageIncludeOptions {
  where?: VoucherBookPageWhereInput
  orderBy?: any
  select?: any
  include?: VoucherBookPageInclude
}

/**
 * Include options for BookDistribution relationships
 */
export interface BookDistributionIncludeOptions {
  where?: any
  orderBy?: any
  select?: any
}

/**
 * WHERE input for VoucherBookPage queries
 */
export interface VoucherBookPageWhereInput {
  id?: string | StringFilter
  bookId?: string | StringFilter
  pageNumber?: number | IntFilter
  layoutType?: PageLayoutType | EnumPageLayoutTypeFilter
}

/**
 * INCLUDE input for VoucherBookPage queries
 */
export interface VoucherBookPageInclude {
  adPlacements?: boolean | AdPlacementIncludeOptions
}

/**
 * Include options for AdPlacement relationships
 */
export interface AdPlacementIncludeOptions {
  where?: any
  orderBy?: any
  select?: any
}

/**
 * ORDER BY input for VoucherBook queries
 */
export interface VoucherBookOrderByInput {
  id?: SortOrder
  title?: SortOrder
  edition?: SortOrder
  bookType?: SortOrder
  month?: SortOrder
  year?: SortOrder
  status?: SortOrder
  totalPages?: SortOrder
  publishedAt?: SortOrder
  pdfGeneratedAt?: SortOrder
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

export interface EnumVoucherBookStatusFilter {
  equals?: VoucherBookStatus
  in?: VoucherBookStatus[]
  notIn?: VoucherBookStatus[]
  not?: VoucherBookStatus | EnumVoucherBookStatusFilter
}

export interface EnumVoucherBookTypeFilter {
  equals?: VoucherBookType
  in?: VoucherBookType[]
  notIn?: VoucherBookType[]
  not?: VoucherBookType | EnumVoucherBookTypeFilter
}

export interface EnumPageLayoutTypeFilter {
  equals?: PageLayoutType
  in?: PageLayoutType[]
  notIn?: PageLayoutType[]
  not?: PageLayoutType | EnumPageLayoutTypeFilter
}
