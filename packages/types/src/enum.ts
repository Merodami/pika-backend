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
 * Days of the week
 * Used for scheduling and pricing
 */
export enum WeekDay {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

/**
 * Type definition for week day - use this for type annotations
 */
export type WeekDayType = `${WeekDay}`

/**
 * Subscription status in the system
 * Must match Prisma schema definitions and Stripe statuses
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incompleteExpired',
  PAST_DUE = 'pastDue',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

/**
 * Type definition for subscription status - use this for type annotations
 */
export type SubscriptionStatusType = `${SubscriptionStatus}`

/**
 * Billing interval for subscriptions
 * Used for recurring billing cycles
 */
export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Type definition for billing interval - use this for type annotations
 */
export type BillingIntervalType = `${BillingInterval}`

/**
 * Communication channels for notifications and messages
 * Used for multi-channel communication delivery
 */
export enum CommunicationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

/**
 * Type definition for communication channels - use this for type annotations
 */
export type CommunicationChannelType = `${CommunicationChannel}`

/**
 * User verification types for unified verification system
 * Used for email, phone, and account confirmation verification
 */
export enum VerificationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ACCOUNT_CONFIRMATION = 'ACCOUNT_CONFIRMATION',
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
  PENDING = 'PENDING',
  SENT = 'SENT',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Type definition for verification status - use this for type annotations
 */
export type VerificationStatusType = `${VerificationStatus}`

/**
 * Problem/Ticket status in the support system
 * Must match Prisma schema definitions
 */
export enum ProblemStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  WAITING_CUSTOMER = 'waiting_customer',
  WAITING_INTERNAL = 'waiting_internal',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * Type definition for problem status - use this for type annotations
 */
export type ProblemStatusType = `${ProblemStatus}`

/**
 * Problem/Ticket priority levels
 * Must match Prisma schema definitions
 */
export enum ProblemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

/**
 * Type definition for problem priority - use this for type annotations
 */
export type ProblemPriorityType = `${ProblemPriority}`

/**
 * Problem/Ticket types (categories)
 * Must match Prisma schema definitions
 */
export enum ProblemType {
  BILLING = 'billing',
  TECHNICAL = 'technical',
  ACCOUNT = 'account',
  GENERAL = 'general',
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
}

/**
 * Type definition for problem type - use this for type annotations
 */
export type ProblemTypeType = `${ProblemType}`

/**
 * Voucher states in the system
 * Must match Prisma schema definitions
 */
export enum VoucherState {
  draft = 'draft',
  published = 'published',
  claimed = 'claimed',
  redeemed = 'redeemed',
  expired = 'expired',
  suspended = 'suspended',
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
  camera = 'camera',
  gallery = 'gallery',
  link = 'link',
  share = 'share',
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
  qr = 'qr',
  short = 'short',
  static = 'static',
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
  percentage = 'percentage',
  fixed = 'fixed',
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
  claimed = 'claimed',
  redeemed = 'redeemed',
  expired = 'expired',
}

/**
 * Type definition for customer voucher status - use this for type annotations
 */
export type CustomerVoucherStatusType = `${CustomerVoucherStatus}`

/**
 * File types supported by the storage system
 * Must match Prisma schema definitions
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * Type definition for file type - use this for type annotations
 */
export type FileTypeType = `${FileType}`

/**
 * File status in the storage system
 * Must match Prisma schema definitions and storage operations
 */
export enum FileStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/**
 * Type definition for file status - use this for type annotations
 */
export type FileStatusType = `${FileStatus}`

/**
 * Storage providers supported by the system
 * Must match Prisma schema definitions
 */
export enum StorageProvider {
  AWS_S3 = 'aws_s3',
  LOCAL = 'local',
  MINIO = 'minio',
}

/**
 * Type definition for storage provider - use this for type annotations
 */
export type StorageProviderType = `${StorageProvider}`
