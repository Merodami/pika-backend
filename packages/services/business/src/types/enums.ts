/**
 * Business service enums
 */

/**
 * Business sort fields
 */
export enum BusinessSortBy {
  BUSINESS_NAME = 'businessName',
  AVG_RATING = 'avgRating',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for business sort by - use this for type annotations
 */
export type BusinessSortByType = `${BusinessSortBy}`

/**
 * Sort order for queries
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Type definition for sort order - use this for type annotations
 */
export type SortOrderType = `${SortOrder}`

/**
 * Business status filters for admin queries
 */
export enum BusinessStatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
}

/**
 * Type definition for business status filter - use this for type annotations
 */
export type BusinessStatusFilterType = `${BusinessStatusFilter}`

/**
 * Business relations that can be included in queries
 */
export enum BusinessRelations {
  USER = 'user',
  CATEGORY = 'category',
}

/**
 * Type definition for business relations - use this for type annotations
 */
export type BusinessRelationsType = `${BusinessRelations}`