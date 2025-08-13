/**
 * Communication and template-related types
 * Shared across all services that need to reference email templates
 */

/**
 * Email template keys - type-safe template identifiers
 * These correspond to file-based email templates in the communication service
 */
export enum EmailTemplateKey {
  // Authentication templates
  EMAIL_VERIFICATION = 'emailVerification',
  PASSWORD_RESET = 'passwordReset',
  PASSWORD_RESET_CONFIRMATION = 'passwordResetConfirmation',
  WELCOME = 'welcome',

  // Booking templates
  BOOKING_CONFIRMATION = 'bookingConfirmation',
  BOOKING_REMINDER = 'bookingReminder',
  BOOKING_CANCELLED = 'bookingCancelled',

  // Payment templates
  PAYMENT_SUCCESS = 'paymentSuccess',
  PAYMENT_FAILED = 'paymentFailed',
  SUBSCRIPTION_ACTIVATED = 'subscriptionActivated',
  SUBSCRIPTION_EXPIRING = 'subscriptionExpiring',
  SUBSCRIPTION_EXPIRED = 'subscriptionExpired',

  // Account status templates
  ACCOUNT_BANNED = 'accountBanned',
  ACCOUNT_UNBANNED = 'accountUnbanned',
}

/**
 * Email template variables interface
 * Common variables that most templates expect
 */
export interface BaseTemplateVariables {
  firstName?: string
  lastName?: string
  email?: string
  frontendUrl?: string
  unsubscribeUrl?: string
}

/**
 * Template-specific variable interfaces
 */
export interface EmailVerificationVariables extends BaseTemplateVariables {
  verificationUrl: string
}

export interface PasswordResetVariables extends BaseTemplateVariables {
  resetLink: string
  expirationHours: string
}

export interface WelcomeVariables extends BaseTemplateVariables {
  // No additional variables required
}

export interface BookingConfirmationVariables extends BaseTemplateVariables {
  sessionType: string
  trainerName: string
  sessionDate: string
  sessionTime: string
  gymName?: string
  sessionUrl?: string
}

export interface PaymentVariables extends BaseTemplateVariables {
  amount: string
  currency?: string
  transactionId?: string
  planName?: string
}

/**
 * Union type of all possible template variables
 */
export type TemplateVariables =
  | BaseTemplateVariables
  | EmailVerificationVariables
  | PasswordResetVariables
  | WelcomeVariables
  | BookingConfirmationVariables
  | PaymentVariables
