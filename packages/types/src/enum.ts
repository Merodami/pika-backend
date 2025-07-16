/**
 * Common enums for the application
 */

/**
 * User roles in the system
 * Must match Prisma schema definitions
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
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
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  UNCONFIRMED = 'UNCONFIRMED',
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
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
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
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
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
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  WAITING_INTERNAL = 'WAITING_INTERNAL',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
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
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
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
  BILLING = 'BILLING',
  TECHNICAL = 'TECHNICAL',
  ACCOUNT = 'ACCOUNT',
  GENERAL = 'GENERAL',
  BUG_REPORT = 'BUG_REPORT',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
}

/**
 * Type definition for problem type - use this for type annotations
 */
export type ProblemTypeType = `${ProblemType}`
