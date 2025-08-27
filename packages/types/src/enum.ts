/**
 * Common enums for the application
 */

/**
 * User roles in the system
 * Must match Prisma schema definitions
 */
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  BUSINESS = 'business',
}

/**
 * Type definition for user roles - use this for type annotations
 */
export type UserRoleType = `${UserRole}`

/**
 * User status in the system
 * Must match Prisma schema definitions
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  UNCONFIRMED = 'unconfirmed',
}

/**
 * Type definition for user status - use this for type annotations
 */
export type UserStatusType = `${UserStatus}`

/**
 * User verification types for unified verification system
 * Used for email, phone, and account confirmation verification
 */
export enum VerificationType {
  EMAIL = 'email',
  PHONE = 'phone',
  ACCOUNT_CONFIRMATION = 'accountConfirmation',
}

/**
 * Type definition for verification type - use this for type annotations
 */
export type VerificationTypeType = `${VerificationType}`

/**
 * User verification status tracking
 * Used to track the status of verification processes
 */
export enum VerificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * Type definition for verification status - use this for type annotations
 */
export type VerificationStatusType = `${VerificationStatus}`

/**
 * Business sort fields
 * Used for sorting business listings and admin panels
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
 * Admin business sort fields (includes additional admin-only fields)
 * Used for admin panel business management
 */
export enum AdminBusinessSortBy {
  BUSINESS_NAME = 'businessName',
  AVG_RATING = 'avgRating',
  VERIFIED = 'verified',
  ACTIVE = 'active',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  USER_ID = 'userId',
  CATEGORY_ID = 'categoryId',
}

/**
 * Type definition for admin business sort by - use this for type annotations
 */
export type AdminBusinessSortByType = `${AdminBusinessSortBy}`

/**
 * Business status filters
 * Used for filtering business listings by status
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
 * User sort fields
 * Used for sorting user listings and admin panels
 */
export enum UserSortBy {
  NAME = 'name',
  EMAIL = 'email',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_LOGIN = 'lastLogin',
}

/**
 * Type definition for user sort by - use this for type annotations
 */
export type UserSortByType = `${UserSortBy}`

/**
 * Admin user sort fields
 * Used for admin panel user management
 */
export enum AdminUserSortBy {
  CREATED_AT = 'createdAt',
  LAST_LOGIN_AT = 'lastLoginAt',
  EMAIL = 'email',
}

/**
 * Type definition for admin user sort by - use this for type annotations
 */
export type AdminUserSortByType = `${AdminUserSortBy}`

/**
 * Admin note categories
 * Used for categorizing admin notes on user accounts
 */
export enum AdminNoteCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  SUPPORT = 'support',
  BILLING = 'billing',
}

/**
 * Type definition for admin note category - use this for type annotations
 */
export type AdminNoteCategoryType = `${AdminNoteCategory}`

/**
 * User activity categories
 * Used for tracking and categorizing user activities
 */
export enum UserActivityCategory {
  AUTH = 'auth',
  PROFILE = 'profile',
  PAYMENT = 'payment',
  OTHER = 'other',
}

/**
 * Type definition for user activity category - use this for type annotations
 */
export type UserActivityCategoryType = `${UserActivityCategory}`

/**
 * Image formats supported by the system
 * Used for profile pictures and image uploads
 */
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}

/**
 * Type definition for image format - use this for type annotations
 */
export type ImageFormatType = `${ImageFormat}`

/**
 * Verification levels for user accounts
 * Used to track the level of account verification
 */
export enum VerificationLevel {
  NONE = 'none',
  EMAIL = 'email',
  PHONE = 'phone',
  FULL = 'full',
}

/**
 * Type definition for verification level - use this for type annotations
 */
export type VerificationLevelType = `${VerificationLevel}`

/**
 * Credit operations for user accounts
 * Used for credit balance adjustments
 */
export enum CreditOperation {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
}

/**
 * Type definition for credit operation - use this for type annotations
 */
export type CreditOperationType = `${CreditOperation}`

/**
 * Permission actions for access control
 * Used for role-based access control systems
 */
export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

/**
 * Type definition for permission action - use this for type annotations
 */
export type PermissionActionType = `${PermissionAction}`

/**
 * User status filter options for API queries
 * Includes composite filters for common use cases
 */
export enum UserStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pendingVerification',
}

/**
 * Card brands for payment methods
 */
export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
  UNKNOWN = 'unknown',
}

/**
 * Card funding types
 */
export enum CardFunding {
  CREDIT = 'credit',
  DEBIT = 'debit',
  PREPAID = 'prepaid',
  UNKNOWN = 'unknown',
}

/**
 * Digital wallet types
 */
export enum WalletType {
  APPLE_PAY = 'applePay',
  GOOGLE_PAY = 'googlePay',
  SAMSUNG_PAY = 'samsungPay',
}

/**
 * Payment verification status
 */
export enum PaymentVerificationStatus {
  SUCCEEDED = 'succeeded',
  REQUIRES_ACTION = 'requiresAction',
  FAILED = 'failed',
}

/**
 * Setup intent usage types
 */
export enum SetupIntentUsage {
  ON_SESSION = 'onSession',
  OFF_SESSION = 'offSession',
}

/**
 * Distance units for geospatial queries
 */
export enum DistanceUnit {
  KM = 'km',
  MI = 'mi',
}

/**
 * Account flags for user accounts
 * Used for marking special account states or properties
 */
export enum AccountFlag {
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  SUSPICIOUS = 'suspicious',
  REPORTED = 'reported',
  VIP = 'vip',
}

/**
 * Type definition for account flag - use this for type annotations
 */
export type AccountFlagType = `${AccountFlag}`

/**
 * Category sort fields
 * Used for sorting category listings and admin panels
 */
export enum CategorySortBy {
  NAME = 'name',
  SORT_ORDER = 'sortOrder',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * Type definition for category sort by - use this for type annotations
 */
export type CategorySortByType = `${CategorySortBy}`

// ============= Analytics & Reporting Enums =============

/**
 * Analytics entities that can be analyzed
 * Used in flexible analytics queries
 */
export enum AnalyticsEntity {
  USERS = 'users',
  BUSINESSES = 'businesses',
  VOUCHERS = 'vouchers',
  PAYMENTS = 'payments',
  CATEGORIES = 'categories',
}

/**
 * Type definition for analytics entity - use this for type annotations
 */
export type AnalyticsEntityType = `${AnalyticsEntity}`

/**
 * Analytics metrics that can be calculated
 * Used in flexible analytics queries
 */
export enum AnalyticsMetric {
  COUNT = 'count',
  GROWTH_RATE = 'growth_rate',
  RETENTION = 'retention',
  CONVERSION = 'conversion',
  REVENUE = 'revenue',
  ENGAGEMENT = 'engagement',
  SATISFACTION = 'satisfaction',
  CHURN_RATE = 'churn_rate',
  AVERAGE_VALUE = 'average_value',
}

/**
 * Type definition for analytics metric - use this for type annotations
 */
export type AnalyticsMetricType = `${AnalyticsMetric}`

/**
 * Analytics dimensions for data slicing and grouping
 * Used in flexible analytics queries
 */
export enum AnalyticsDimension {
  TIME = 'time',
  CATEGORY = 'category',
  REGION = 'region',
  USER_SEGMENT = 'user_segment',
  BUSINESS_TYPE = 'business_type',
  DEVICE = 'device',
  ACQUISITION_CHANNEL = 'acquisition_channel',
  USER_ROLE = 'user_role',
}

/**
 * Type definition for analytics dimension - use this for type annotations
 */
export type AnalyticsDimensionType = `${AnalyticsDimension}`

/**
 * Time granularity for analytics data aggregation
 * Used for time-based analytics and charts
 */
export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Type definition for time granularity - use this for type annotations
 */
export type TimeGranularityType = `${TimeGranularity}`

/**
 * Report types available in the admin analytics system
 * Used for pre-configured report templates
 */
export enum ReportType {
  OVERVIEW = 'overview',
  GROWTH = 'growth',
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
  HEALTH = 'health',
  REVENUE = 'revenue',
  RETENTION = 'retention',
  CONVERSION = 'conversion',
  SEGMENTATION = 'segmentation',
  FORECASTING = 'forecasting',
}

/**
 * Type definition for report type - use this for type annotations
 */
export type ReportTypeType = `${ReportType}`

/**
 * Chart types for data visualization
 * Used in reports and dashboard widgets
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DONUT = 'donut',
  TABLE = 'table',
  HEATMAP = 'heatmap',
  FUNNEL = 'funnel',
  SCATTER = 'scatter',
  AREA = 'area',
}

/**
 * Type definition for chart type - use this for type annotations
 */
export type ChartTypeType = `${ChartType}`

/**
 * Trend directions for metrics
 * Used to indicate whether metrics are improving or declining
 */
export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
  NO_DATA = 'no_data',
}

/**
 * Type definition for trend direction - use this for type annotations
 */
export type TrendDirectionType = `${TrendDirection}`

/**
 * Export formats for reports
 * Used when exporting analytics data and reports
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

/**
 * Type definition for export format - use this for type annotations
 */
export type ExportFormatType = `${ExportFormat}`

/**
 * Priority levels for insights and recommendations
 * Used for prioritizing actionable items from analytics
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Type definition for priority - use this for type annotations
 */
export type PriorityType = `${Priority}`
