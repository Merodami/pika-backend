/**
 * Business Settings Types for VoucherBook Platform
 * Settings stored in the Business.settings JSON field
 * Note: Contact info and operating hours are in BusinessDetails model
 */

// Import existing enums from the project
// Import business settings specific enums
import {
  CommissionModel,
  DashboardView,
  PaymentTerms,
  RefundPolicy,
  ReportFrequency,
  ResponseTimeCommitment,
  TimeRange,
  VoucherTemplate,
} from './enums/businessSettings.js'
import { Language } from './enums/common.js'
import { Currency } from './enums/payment.js'

// ============= Interface Definitions =============

/**
 * Basic store configuration
 */
export interface BusinessStoreSettings {
  // Localization
  timezone: string // IANA timezone
  currency: Currency
  primaryLanguage: Language

  // Business Policies
  refundPolicy: RefundPolicy
  paymentTerms: PaymentTerms
}

/**
 * Payment methods accepted
 */
export interface BusinessPaymentSettings {
  acceptsCash: boolean
  acceptsCard: boolean
  acceptsTransfer: boolean
  acceptsMobilePayment: boolean
  providesInvoice: boolean
}

/**
 * Voucher settings for the business
 */
export interface BusinessVoucherSettings {
  // Basic Configuration
  autoApproveVouchers: boolean
  defaultValidityDays: number // Default expiration in days
  maxActiveVouchers: number // Max concurrent active vouchers

  // Redemption Rules
  maxRedemptionsPerCustomer: number
  requiresVerification: boolean // QR code or code verification
  minimumPurchaseAmount?: number // Min purchase to use vouchers

  // Display Options
  showOnMarketplace: boolean // Show vouchers in public marketplace
  allowSharing: boolean // Allow customers to share vouchers

  // Commission
  platformCommissionAgreed: boolean
  commissionModel?: CommissionModel
}

/**
 * Communication preferences
 */
export interface BusinessCommunicationSettings {
  // Response Settings
  responseTimeCommitment: ResponseTimeCommitment
  autoReplyEnabled: boolean
  autoReplyMessage?: string

  // Communication Channels
  acceptsWhatsApp: boolean
  acceptsSMS: boolean
}

/**
 * Analytics preferences
 */
export interface BusinessAnalyticsSettings {
  dashboardView: DashboardView
  defaultTimeRange: TimeRange

  // Email Reports
  emailReports: boolean
  reportFrequency?: ReportFrequency
}

/**
 * Branding settings
 */
export interface BusinessBrandingSettings {
  voucherTemplate: VoucherTemplate
  primaryColor?: string // Hex color
  showLogoOnVouchers: boolean
}

/**
 * Notification settings
 */
export interface BusinessNotificationSettings {
  // Voucher Events
  notifyOnVoucherClaim: boolean
  notifyOnVoucherRedeem: boolean
  notifyOnVoucherExpiring: boolean

  // Customer Events
  notifyOnNewReview: boolean

  // Reports
  dailySummary: boolean
  monthlySummary: boolean

  // Channels
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
}

// ============= Main Settings Interface =============

/**
 * Complete business settings object
 * Version 1.0 - Stored in Business.settings JSON field
 */
export interface BusinessSettings {
  version: '1.0'
  store: BusinessStoreSettings
  payment: BusinessPaymentSettings
  voucher: BusinessVoucherSettings
  communication: BusinessCommunicationSettings
  analytics: BusinessAnalyticsSettings
  branding: BusinessBrandingSettings
  notifications: BusinessNotificationSettings
  updatedAt: Date
}

// ============= Default Settings =============

export const DEFAULT_STORE_SETTINGS: BusinessStoreSettings = {
  timezone: 'America/New_York',
  currency: Currency.USD,
  primaryLanguage: Language.EN,
  refundPolicy: RefundPolicy.STORE_CREDIT,
  paymentTerms: PaymentTerms.IMMEDIATE,
}

export const DEFAULT_PAYMENT_SETTINGS: BusinessPaymentSettings = {
  acceptsCash: true,
  acceptsCard: false,
  acceptsTransfer: false,
  acceptsMobilePayment: false,
  providesInvoice: false,
}

export const DEFAULT_VOUCHER_SETTINGS: BusinessVoucherSettings = {
  autoApproveVouchers: false,
  defaultValidityDays: 30,
  maxActiveVouchers: 10,
  maxRedemptionsPerCustomer: 1,
  requiresVerification: false,
  minimumPurchaseAmount: 0,
  showOnMarketplace: true,
  allowSharing: false,
  platformCommissionAgreed: false,
}

export const DEFAULT_COMMUNICATION_SETTINGS: BusinessCommunicationSettings = {
  responseTimeCommitment: ResponseTimeCommitment.TWENTY_FOUR_HOURS,
  autoReplyEnabled: false,
  acceptsWhatsApp: false,
  acceptsSMS: false,
}

export const DEFAULT_ANALYTICS_SETTINGS: BusinessAnalyticsSettings = {
  dashboardView: DashboardView.SIMPLE,
  defaultTimeRange: TimeRange.MONTH,
  emailReports: false,
}

export const DEFAULT_BRANDING_SETTINGS: BusinessBrandingSettings = {
  voucherTemplate: VoucherTemplate.STANDARD,
  showLogoOnVouchers: true,
}

export const DEFAULT_BUSINESS_NOTIFICATION_SETTINGS: BusinessNotificationSettings =
  {
    notifyOnVoucherClaim: true,
    notifyOnVoucherRedeem: true,
    notifyOnVoucherExpiring: true,
    notifyOnNewReview: true,
    dailySummary: false,
    monthlySummary: true,
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
  }

/**
 * Creates default business settings
 */
export function createDefaultBusinessSettings(): BusinessSettings {
  return {
    version: '1.0',
    store: { ...DEFAULT_STORE_SETTINGS },
    payment: { ...DEFAULT_PAYMENT_SETTINGS },
    voucher: { ...DEFAULT_VOUCHER_SETTINGS },
    communication: { ...DEFAULT_COMMUNICATION_SETTINGS },
    analytics: { ...DEFAULT_ANALYTICS_SETTINGS },
    branding: { ...DEFAULT_BRANDING_SETTINGS },
    notifications: { ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS },
    updatedAt: new Date(),
  }
}

// ============= Partial Update Types =============

/**
 * Deep partial type for settings updates
 */
export type PartialBusinessSettings = {
  store?: Partial<BusinessStoreSettings>
  payment?: Partial<BusinessPaymentSettings>
  voucher?: Partial<BusinessVoucherSettings>
  communication?: Partial<BusinessCommunicationSettings>
  analytics?: Partial<BusinessAnalyticsSettings>
  branding?: Partial<BusinessBrandingSettings>
  notifications?: Partial<BusinessNotificationSettings>
}

// ============= Settings Helpers =============

/**
 * Merge partial settings with current settings
 */
export function mergeBusinessSettings(
  current: BusinessSettings,
  update: PartialBusinessSettings,
): BusinessSettings {
  const merged: BusinessSettings = {
    ...current,
    updatedAt: new Date(),
  }

  // Deep merge each section with explicit handling
  if (update.store) {
    merged.store = { ...current.store, ...update.store }
  }
  if (update.payment) {
    merged.payment = { ...current.payment, ...update.payment }
  }
  if (update.voucher) {
    merged.voucher = { ...current.voucher, ...update.voucher }
  }
  if (update.communication) {
    merged.communication = { ...current.communication, ...update.communication }
  }
  if (update.analytics) {
    merged.analytics = { ...current.analytics, ...update.analytics }
  }
  if (update.branding) {
    merged.branding = { ...current.branding, ...update.branding }
  }
  if (update.notifications) {
    merged.notifications = { ...current.notifications, ...update.notifications }
  }

  return merged
}

// ============= Validation =============

/**
 * Validates hex color format
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/

  return hexRegex.test(color)
}

/**
 * Validates business settings update
 */
export function validateBusinessSettingsUpdate(
  update: PartialBusinessSettings,
): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  // Validate branding colors
  if (
    update.branding?.primaryColor &&
    !isValidHexColor(update.branding.primaryColor)
  ) {
    errors.push('Invalid hex color format for primary color')
  }

  // Validate numeric ranges
  if (update.voucher?.defaultValidityDays !== undefined) {
    if (
      update.voucher.defaultValidityDays < 1 ||
      update.voucher.defaultValidityDays > 365
    ) {
      errors.push('Default validity days must be between 1 and 365')
    }
  }

  if (update.voucher?.maxActiveVouchers !== undefined) {
    if (
      update.voucher.maxActiveVouchers < 1 ||
      update.voucher.maxActiveVouchers > 100
    ) {
      errors.push('Max active vouchers must be between 1 and 100')
    }
  }

  if (update.voucher?.minimumPurchaseAmount !== undefined) {
    if (update.voucher.minimumPurchaseAmount < 0) {
      errors.push('Minimum purchase amount must be positive')
    }
  }

  if (update.voucher?.maxRedemptionsPerCustomer !== undefined) {
    if (
      update.voucher.maxRedemptionsPerCustomer < 1 ||
      update.voucher.maxRedemptionsPerCustomer > 100
    ) {
      errors.push('Max redemptions per customer must be between 1 and 100')
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

// ============= Export Types =============

// Re-export enums for convenience
export {
  CommissionModel,
  DashboardView,
  PaymentTerms,
  RefundPolicy,
  ReportFrequency,
  ResponseTimeCommitment,
  TimeRange,
  VoucherTemplate,
} from './enums/businessSettings.js'
