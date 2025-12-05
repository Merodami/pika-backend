/**
 * Voucher-related enums
 */

/**
 * Voucher states in the system
 * Must match Prisma schema definitions
 */
export enum VoucherState {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

/**
 * Type definition for voucher state - use this for type annotations
 */
export type VoucherStateType = `${VoucherState}`

/**
 * Voucher types in the system
 * Must match Prisma schema definitions
 */
export enum VoucherType {
  discount = 'discount',
  fixedValue = 'fixedValue',
  freeItem = 'freeItem',
  bogo = 'bogo',
  experience = 'experience',
}

/**
 * Type definition for voucher type - use this for type annotations
 */
export type VoucherTypeType = `${VoucherType}`

/**
 * Voucher scan source types
 * Used to track how users discovered and scanned vouchers
 */
export enum VoucherScanSource {
  CAMERA = 'camera',
  GALLERY = 'gallery',
  LINK = 'link',
  SHARE = 'share',
  QR = 'qr',
  PRINT = 'print',
  DIGITAL = 'digital',
  WEB = 'web',
  EMAIL = 'email',
  SOCIAL = 'social',
}

/**
 * Type definition for voucher scan source - use this for type annotations
 */
export type VoucherScanSourceType = `${VoucherScanSource}`

/**
 * Voucher scan types
 * Used to distinguish between customer and business scans
 */
export enum VoucherScanType {
  customer = 'customer',
  business = 'business',
}

/**
 * Type definition for voucher scan type - use this for type annotations
 */
export type VoucherScanTypeType = `${VoucherScanType}`

/**
 * Voucher code types
 * Used for different voucher code generation methods
 */
export enum VoucherCodeType {
  QR = 'qr',
  SHORT = 'short',
  STATIC = 'static',
}

/**
 * Type definition for voucher code type - use this for type annotations
 */
export type VoucherCodeTypeType = `${VoucherCodeType}`

/**
 * Voucher discount types
 * Used to determine how discounts are calculated
 */
export enum VoucherDiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

/**
 * Type definition for voucher discount type - use this for type annotations
 */
export type VoucherDiscountTypeType = `${VoucherDiscountType}`

/**
 * Customer voucher status
 * Used to track voucher status in customer's wallet
 */
export enum CustomerVoucherStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

/**
 * Type definition for customer voucher status - use this for type annotations
 */
export type CustomerVoucherStatusType = `${CustomerVoucherStatus}`

/**
 * Customer voucher status filter
 * Extends the base statuses with 'all' option for filtering
 */
export enum CustomerVoucherStatusFilter {
  ALL = 'all',
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

/**
 * Type definition for customer voucher status filter
 */
export type CustomerVoucherStatusFilterType = `${CustomerVoucherStatusFilter}`

/**
 * Voucher book status - matches database VoucherBookStatus enum exactly
 */
export enum VoucherBookStatus {
  DRAFT = 'draft',
  READY_FOR_PRINT = 'readyForPrint',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Type definition for voucher book status - use this for type annotations
 */
export type VoucherBookStatusType = `${VoucherBookStatus}`

/**
 * Voucher book type - matches database VoucherBookType enum exactly
 */
export enum VoucherBookType {
  MONTHLY = 'monthly',
  SPECIAL_EDITION = 'specialEdition',
  REGIONAL = 'regional',
  SEASONAL = 'seasonal',
  PROMOTIONAL = 'promotional',
}

/**
 * Type definition for voucher book type - use this for type annotations
 */
export type VoucherBookTypeType = `${VoucherBookType}`

/**
 * Voucher sorting fields for public API
 */
export enum VoucherSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  EXPIRES_AT = 'expiresAt',
  DISCOUNT_VALUE = 'discountValue',
  TITLE = 'title',
}

/**
 * Type definition for voucher sort by - use this for type annotations
 */
export type VoucherSortByType = `${VoucherSortBy}`

/**
 * Admin voucher sorting fields (additional admin-only fields)
 */
export enum AdminVoucherSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATE = 'state',
  DISCOUNT_VALUE = 'discountValue',
  CURRENT_REDEMPTIONS = 'currentRedemptions',
  EXPIRES_AT = 'expiresAt',
  BUSINESS_ID = 'businessId',
}

/**
 * Type definition for admin voucher sort by - use this for type annotations
 */
export type AdminVoucherSortByType = `${AdminVoucherSortBy}`

/**
 * User voucher sorting fields (for user voucher queries)
 */
export enum UserVoucherSortBy {
  CLAIMED_AT = 'claimedAt',
  REDEEMED_AT = 'redeemedAt',
  EXPIRES_AT = 'expiresAt',
  CREATED_AT = 'createdAt',
}

/**
 * Type definition for user voucher sort by - use this for type annotations
 */
export type UserVoucherSortByType = `${UserVoucherSortBy}`

/**
 * User voucher status filter for API schemas
 * These are status filters that can be applied in voucher queries
 */
export enum UserVoucherStatusFilter {
  CLAIMED = 'claimed',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  AVAILABLE = 'available',
}

/**
 * Type definition for user voucher status filter
 */
export type UserVoucherStatusFilterType = `${UserVoucherStatusFilter}`

/**
 * Batch operation types for voucher management
 */
export enum BatchOperationType {
  PUBLISH = 'publish',
  EXPIRE = 'expire',
  SUSPEND = 'suspend',
  ACTIVATE = 'activate',
}

/**
 * Type definition for batch operation type
 */
export type BatchOperationTypeType = `${BatchOperationType}`

/**
 * Voucher redemption types
 * Used to track where/how vouchers are redeemed
 */
export enum VoucherRedemptionType {
  IN_STORE = 'in_store',
  ONLINE = 'online',
  APP = 'app',
}

/**
 * Type definition for voucher redemption type
 */
export type VoucherRedemptionTypeType = `${VoucherRedemptionType}`

/**
 * Voucher redemption methods
 * Used to track the method used for redemption
 */
export enum VoucherRedemptionMethod {
  QR_SCAN = 'qr_scan',
  MANUAL_CODE = 'manual_code',
  AUTOMATIC = 'automatic',
}

/**
 * Type definition for voucher redemption method
 */
export type VoucherRedemptionMethodType = `${VoucherRedemptionMethod}`

/**
 * Deep link generation modes
 * Used to determine which type of link to generate for QR codes
 */
export enum DeepLinkMode {
  JWT = 'jwt', // Legacy JWT-based QR codes
  UNIVERSAL_LINK = 'universal_link', // HTTPS universal links (recommended)
  CUSTOM_SCHEME = 'custom_scheme', // voucherbook:// scheme
  HYBRID = 'hybrid', // Both JWT and deep link
}

/**
 * Type definition for deep link mode
 */
export type DeepLinkModeType = `${DeepLinkMode}`

/**
 * Voucher validation code types
 * Used for URL-based QR code validation
 */
export enum VoucherValidationCodeType {
  SCAN = 'scan', // Short-lived code for QR scanning (5 min)
  PRINT = 'print', // Long-lived code for printed materials (1 year)
  DIGITAL = 'digital', // Medium-lived code for digital sharing (24 hours)
}

/**
 * Type definition for validation code type
 */
export type VoucherValidationCodeTypeType = `${VoucherValidationCodeType}`

/**
 * Deep link platforms
 * Used for tracking which platform opened the deep link
 */
export enum DeepLinkPlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  UNKNOWN = 'unknown',
}

/**
 * Type definition for deep link platform
 */
export type DeepLinkPlatformType = `${DeepLinkPlatform}`

/**
 * Analytics grouping period
 * Used for aggregating voucher analytics data
 */
export enum VoucherAnalyticsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Type definition for analytics group by
 */
export type VoucherAnalyticsGroupByType = `${VoucherAnalyticsGroupBy}`
