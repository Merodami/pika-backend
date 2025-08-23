/**
 * Common enums used across multiple services
 */

/**
 * Sort order for queries
 * Used for ascending/descending sort operations
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
 * Common timestamp sort fields - used by entities that only sort by timestamps
 */
export enum TimestampSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for timestamp sort by - use this for type annotations
 */
export type TimestampSortByType = `${TimestampSortBy}`

/**
 * Async operation status for long-running operations
 */
export enum AsyncOperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Analytics grouping periods for time-based aggregations
 * Used for analytics queries across different services
 */
export enum AnalyticsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Type definition for analytics group by - use this for type annotations
 */
export type AnalyticsGroupByType = `${AnalyticsGroupBy}`

/**
 * Common status values used across entities
 * Addresses hardcoded status literals found in API schemas
 */
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

/**
 * Priority levels
 * Used in support tickets, tasks, and notifications
 */
export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

// TicketPriority is already defined in support.ts with different values
// Keep them separate as they may have different use cases

/**
 * Bulk operation types
 * Used for batch operations across services
 */
export enum BulkOperationType {
  DELETE = 'delete',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  ARCHIVE = 'archive',
  PUBLISH = 'publish',
  SUSPEND = 'suspend',
}

/**
 * Type definition for bulk operation type
 */
export type BulkOperationTypeType = `${BulkOperationType}`

/**
 * Service environment types
 */
export enum ServiceEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Type definition for service environment
 */
export type ServiceEnvironmentType = `${ServiceEnvironment}`

/**
 * Location types for geospatial data (GeoJSON)
 */
export enum LocationType {
  POINT = 'Point',
  POLYGON = 'Polygon',
  LINESTRING = 'LineString',
}

/**
 * Type definition for location type
 */
export type LocationTypeType = `${LocationType}`

/**
 * Address types
 */
export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  OTHER = 'other',
}

/**
 * Type definition for address type
 */
export type AddressTypeType = `${AddressType}`

/**
 * Log levels for system logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Supported languages for content
 */
export enum Language {
  ES = 'es',
  EN = 'en',
}
