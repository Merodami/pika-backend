/**
 * Business Settings specific enums for VoucherBook platform
 * Only contains enums that are unique to business settings
 * Reuses existing enums from common, payment, business, etc.
 */

/**
 * Business settings sections for partial updates
 */
export enum BusinessSettingsSection {
  STORE = 'store',
  PAYMENT = 'payment',
  VOUCHER = 'voucher',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  BRANDING = 'branding',
  NOTIFICATIONS = 'notifications',
}

/**
 * Refund policy types specific to business settings
 */
export enum RefundPolicy {
  FULL = 'full',
  PARTIAL = 'partial',
  STORE_CREDIT = 'store_credit',
  NO_REFUNDS = 'no_refunds',
}

/**
 * Payment terms for business transactions
 */
export enum PaymentTerms {
  IMMEDIATE = 'immediate',
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  CUSTOM = 'custom',
}

/**
 * Voucher template styles for branding
 */
export enum VoucherTemplate {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  FESTIVE = 'festive',
  MINIMAL = 'minimal',
  CUSTOM = 'custom',
}

/**
 * Business page template styles
 */
export enum BusinessPageTemplate {
  STANDARD = 'standard',
  SHOWCASE = 'showcase',
  MENU = 'menu',
  CATALOG = 'catalog',
}

/**
 * Dashboard view preferences
 */
export enum DashboardView {
  SIMPLE = 'simple',
  DETAILED = 'detailed',
  CUSTOM = 'custom',
}

/**
 * Time range for analytics (extending common AnalyticsGroupBy)
 */
export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Report frequency for automated reports
 */
export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

/**
 * Response time commitment for customer communication
 */
export enum ResponseTimeCommitment {
  INSTANT = 'instant',
  ONE_HOUR = '1h',
  TWENTY_FOUR_HOURS = '24h',
  FORTY_EIGHT_HOURS = '48h',
  CUSTOM = 'custom',
}

/**
 * Staff roles in business settings
 * Different from user roles - these are business-specific roles
 */
export enum StaffRole {
  MANAGER = 'manager',
  CASHIER = 'cashier',
  SERVICE = 'service',
  MARKETING = 'marketing',
}

/**
 * Commission models for platform fees
 */
export enum CommissionModel {
  PERCENTAGE = 'percentage',
  FLAT_FEE = 'flat_fee',
  HYBRID = 'hybrid',
}

/**
 * Logo position options for branding
 */
export enum LogoPosition {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

/**
 * Paraguay-specific mobile payment providers
 */
export enum MobilePaymentProvider {
  TIGO_MONEY = 'Tigo Money',
  PERSONAL_PAY = 'Personal Pay',
  BILLETERA_CLARO = 'Billetera Claro',
}

/**
 * Type definitions for enum usage
 */
export type BusinessSettingsSectionType = `${BusinessSettingsSection}`
export type RefundPolicyType = `${RefundPolicy}`
export type PaymentTermsType = `${PaymentTerms}`
export type VoucherTemplateType = `${VoucherTemplate}`
export type BusinessPageTemplateType = `${BusinessPageTemplate}`
export type DashboardViewType = `${DashboardView}`
export type TimeRangeType = `${TimeRange}`
export type ReportFrequencyType = `${ReportFrequency}`
export type ResponseTimeCommitmentType = `${ResponseTimeCommitment}`
export type StaffRoleType = `${StaffRole}`
export type CommissionModelType = `${CommissionModel}`
export type LogoPositionType = `${LogoPosition}`
export type MobilePaymentProviderType = `${MobilePaymentProvider}`
