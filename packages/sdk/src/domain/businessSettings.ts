/**
 * Business Settings Domain Models
 * These represent business configuration settings used internally
 */

import type {
  CommissionModel,
  Currency,
  DashboardView,
  Language,
  PaymentTerms,
  RefundPolicy,
  ReportFrequency,
  ResponseTimeCommitment,
  TimeRange,
  VoucherTemplate,
} from '@pika/types'

// ============= Business Settings Sections =============

export interface BusinessStoreSettingsDomain {
  timezone: string
  currency: Currency
  primaryLanguage: Language
  refundPolicy: RefundPolicy
  paymentTerms: PaymentTerms
}

export interface BusinessPaymentSettingsDomain {
  acceptsCash: boolean
  acceptsCard: boolean
  acceptsTransfer: boolean
  acceptsMobilePayment: boolean
  providesInvoice: boolean
}

export interface BusinessVoucherSettingsDomain {
  autoApproveVouchers: boolean
  defaultValidityDays: number
  maxActiveVouchers: number
  maxRedemptionsPerCustomer: number
  requiresVerification: boolean
  minimumPurchaseAmount?: number
  showOnMarketplace: boolean
  allowSharing: boolean
  platformCommissionAgreed: boolean
  commissionModel?: CommissionModel
}

export interface BusinessCommunicationSettingsDomain {
  responseTimeCommitment: ResponseTimeCommitment
  autoReplyEnabled: boolean
  autoReplyMessage?: string
  acceptsWhatsApp: boolean
  acceptsSMS: boolean
}

export interface BusinessAnalyticsSettingsDomain {
  dashboardView: DashboardView
  defaultTimeRange: TimeRange
  emailReports: boolean
  reportFrequency?: ReportFrequency
}

export interface BusinessBrandingSettingsDomain {
  voucherTemplate: VoucherTemplate
  primaryColor?: string
  showLogoOnVouchers: boolean
}

export interface BusinessNotificationSettingsDomain {
  notifyOnVoucherClaim: boolean
  notifyOnVoucherRedeem: boolean
  notifyOnVoucherExpiring: boolean
  notifyOnNewReview: boolean
  dailySummary: boolean
  monthlySummary: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
}

// ============= Main Settings Domain =============

export interface BusinessSettingsDomain {
  version: '1.0'
  store: BusinessStoreSettingsDomain
  payment: BusinessPaymentSettingsDomain
  voucher: BusinessVoucherSettingsDomain
  communication: BusinessCommunicationSettingsDomain
  analytics: BusinessAnalyticsSettingsDomain
  branding: BusinessBrandingSettingsDomain
  notifications: BusinessNotificationSettingsDomain
  updatedAt: Date
}

// ============= Partial Update Types =============

export type PartialBusinessSettingsDomain = {
  store?: Partial<BusinessStoreSettingsDomain>
  payment?: Partial<BusinessPaymentSettingsDomain>
  voucher?: Partial<BusinessVoucherSettingsDomain>
  communication?: Partial<BusinessCommunicationSettingsDomain>
  analytics?: Partial<BusinessAnalyticsSettingsDomain>
  branding?: Partial<BusinessBrandingSettingsDomain>
  notifications?: Partial<BusinessNotificationSettingsDomain>
}
