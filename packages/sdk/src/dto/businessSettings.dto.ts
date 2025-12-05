/**
 * Business Settings DTOs
 * Data Transfer Objects for API communication
 */

// ============= Business Settings DTOs =============

export interface BusinessStoreSettingsDTO {
  timezone: string
  currency: string
  primaryLanguage: string
  refundPolicy: string
  paymentTerms: string
}

export interface BusinessPaymentSettingsDTO {
  acceptsCash: boolean
  acceptsCard: boolean
  acceptsTransfer: boolean
  acceptsMobilePayment: boolean
  providesInvoice: boolean
}

export interface BusinessVoucherSettingsDTO {
  autoApproveVouchers: boolean
  defaultValidityDays: number
  maxActiveVouchers: number
  maxRedemptionsPerCustomer: number
  requiresVerification: boolean
  minimumPurchaseAmount?: number
  showOnMarketplace: boolean
  allowSharing: boolean
  platformCommissionAgreed: boolean
  commissionModel?: string
}

export interface BusinessCommunicationSettingsDTO {
  responseTimeCommitment: string
  autoReplyEnabled: boolean
  autoReplyMessage?: string
  acceptsWhatsApp: boolean
  acceptsSMS: boolean
}

export interface BusinessAnalyticsSettingsDTO {
  dashboardView: string
  defaultTimeRange: string
  emailReports: boolean
  reportFrequency?: string
}

export interface BusinessBrandingSettingsDTO {
  voucherTemplate: string
  primaryColor?: string
  showLogoOnVouchers: boolean
}

export interface BusinessNotificationSettingsDTO {
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

// ============= Main Settings DTO =============

export interface BusinessSettingsDTO {
  version: '1.0'
  store: BusinessStoreSettingsDTO
  payment: BusinessPaymentSettingsDTO
  voucher: BusinessVoucherSettingsDTO
  communication: BusinessCommunicationSettingsDTO
  analytics: BusinessAnalyticsSettingsDTO
  branding: BusinessBrandingSettingsDTO
  notifications: BusinessNotificationSettingsDTO
  updatedAt: string
}

// ============= Update DTOs =============

export interface UpdateBusinessSettingsDTO {
  store?: Partial<BusinessStoreSettingsDTO>
  payment?: Partial<BusinessPaymentSettingsDTO>
  voucher?: Partial<BusinessVoucherSettingsDTO>
  communication?: Partial<BusinessCommunicationSettingsDTO>
  analytics?: Partial<BusinessAnalyticsSettingsDTO>
  branding?: Partial<BusinessBrandingSettingsDTO>
  notifications?: Partial<BusinessNotificationSettingsDTO>
}

// ============= Response DTOs =============

export interface BusinessSettingsResponseDTO {
  settings: BusinessSettingsDTO
  businessId: string
}
