/**
 * Business Settings Mapper
 * Handles transformations between database, domain, and DTO layers for business settings
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

import type {
  BusinessSettingsDomain,
  PartialBusinessSettingsDomain,
} from '../domain/businessSettings.js'
import type {
  BusinessSettingsDTO,
  UpdateBusinessSettingsDTO,
} from '../dto/businessSettings.dto.js'
import { formatDateToISO } from '../utils/dateUtils.js'

/**
 * Interface representing settings stored in database JSON field
 */
export interface BusinessSettingsDocument {
  version: '1.0'
  store: {
    timezone: string
    currency: string
    primaryLanguage: string
    refundPolicy: string
    paymentTerms: string
  }
  payment: {
    acceptsCash: boolean
    acceptsCard: boolean
    acceptsTransfer: boolean
    acceptsMobilePayment: boolean
    providesInvoice: boolean
  }
  voucher: {
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
  communication: {
    responseTimeCommitment: string
    autoReplyEnabled: boolean
    autoReplyMessage?: string
    acceptsWhatsApp: boolean
    acceptsSMS: boolean
  }
  analytics: {
    dashboardView: string
    defaultTimeRange: string
    emailReports: boolean
    reportFrequency?: string
  }
  branding: {
    voucherTemplate: string
    primaryColor?: string
    showLogoOnVouchers: boolean
  }
  notifications: {
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
  updatedAt: string | Date
}

/**
 * Business Settings mapper that handles all transformations
 */
export class BusinessSettingsMapper {
  /**
   * Maps a database JSON document to a domain entity
   */
  static fromDocument(
    doc: BusinessSettingsDocument | null,
  ): BusinessSettingsDomain | null {
    if (!doc) return null

    return {
      version: '1.0',
      store: {
        timezone: doc.store.timezone,
        currency: doc.store.currency as Currency,
        primaryLanguage: doc.store.primaryLanguage as Language,
        refundPolicy: doc.store.refundPolicy as RefundPolicy,
        paymentTerms: doc.store.paymentTerms as PaymentTerms,
      },
      payment: {
        acceptsCash: doc.payment.acceptsCash,
        acceptsCard: doc.payment.acceptsCard,
        acceptsTransfer: doc.payment.acceptsTransfer,
        acceptsMobilePayment: doc.payment.acceptsMobilePayment,
        providesInvoice: doc.payment.providesInvoice,
      },
      voucher: {
        autoApproveVouchers: doc.voucher.autoApproveVouchers,
        defaultValidityDays: doc.voucher.defaultValidityDays,
        maxActiveVouchers: doc.voucher.maxActiveVouchers,
        maxRedemptionsPerCustomer: doc.voucher.maxRedemptionsPerCustomer,
        requiresVerification: doc.voucher.requiresVerification,
        minimumPurchaseAmount: doc.voucher.minimumPurchaseAmount,
        showOnMarketplace: doc.voucher.showOnMarketplace,
        allowSharing: doc.voucher.allowSharing,
        platformCommissionAgreed: doc.voucher.platformCommissionAgreed,
        commissionModel: doc.voucher.commissionModel as
          | CommissionModel
          | undefined,
      },
      communication: {
        responseTimeCommitment: doc.communication
          .responseTimeCommitment as ResponseTimeCommitment,
        autoReplyEnabled: doc.communication.autoReplyEnabled,
        autoReplyMessage: doc.communication.autoReplyMessage,
        acceptsWhatsApp: doc.communication.acceptsWhatsApp,
        acceptsSMS: doc.communication.acceptsSMS,
      },
      analytics: {
        dashboardView: doc.analytics.dashboardView as DashboardView,
        defaultTimeRange: doc.analytics.defaultTimeRange as TimeRange,
        emailReports: doc.analytics.emailReports,
        reportFrequency: doc.analytics.reportFrequency as
          | ReportFrequency
          | undefined,
      },
      branding: {
        voucherTemplate: doc.branding.voucherTemplate as VoucherTemplate,
        primaryColor: doc.branding.primaryColor,
        showLogoOnVouchers: doc.branding.showLogoOnVouchers,
      },
      notifications: {
        notifyOnVoucherClaim: doc.notifications.notifyOnVoucherClaim,
        notifyOnVoucherRedeem: doc.notifications.notifyOnVoucherRedeem,
        notifyOnVoucherExpiring: doc.notifications.notifyOnVoucherExpiring,
        notifyOnNewReview: doc.notifications.notifyOnNewReview,
        dailySummary: doc.notifications.dailySummary,
        monthlySummary: doc.notifications.monthlySummary,
        emailNotifications: doc.notifications.emailNotifications,
        pushNotifications: doc.notifications.pushNotifications,
        inAppNotifications: doc.notifications.inAppNotifications,
      },
      updatedAt:
        typeof doc.updatedAt === 'string'
          ? new Date(doc.updatedAt)
          : doc.updatedAt,
    }
  }

  /**
   * Maps a domain entity to a database JSON document
   */
  static toDocument(domain: BusinessSettingsDomain): BusinessSettingsDocument {
    return {
      version: '1.0',
      store: {
        timezone: domain.store.timezone,
        currency: domain.store.currency,
        primaryLanguage: domain.store.primaryLanguage,
        refundPolicy: domain.store.refundPolicy,
        paymentTerms: domain.store.paymentTerms,
      },
      payment: {
        acceptsCash: domain.payment.acceptsCash,
        acceptsCard: domain.payment.acceptsCard,
        acceptsTransfer: domain.payment.acceptsTransfer,
        acceptsMobilePayment: domain.payment.acceptsMobilePayment,
        providesInvoice: domain.payment.providesInvoice,
      },
      voucher: {
        autoApproveVouchers: domain.voucher.autoApproveVouchers,
        defaultValidityDays: domain.voucher.defaultValidityDays,
        maxActiveVouchers: domain.voucher.maxActiveVouchers,
        maxRedemptionsPerCustomer: domain.voucher.maxRedemptionsPerCustomer,
        requiresVerification: domain.voucher.requiresVerification,
        minimumPurchaseAmount: domain.voucher.minimumPurchaseAmount,
        showOnMarketplace: domain.voucher.showOnMarketplace,
        allowSharing: domain.voucher.allowSharing,
        platformCommissionAgreed: domain.voucher.platformCommissionAgreed,
        commissionModel: domain.voucher.commissionModel,
      },
      communication: {
        responseTimeCommitment: domain.communication.responseTimeCommitment,
        autoReplyEnabled: domain.communication.autoReplyEnabled,
        autoReplyMessage: domain.communication.autoReplyMessage,
        acceptsWhatsApp: domain.communication.acceptsWhatsApp,
        acceptsSMS: domain.communication.acceptsSMS,
      },
      analytics: {
        dashboardView: domain.analytics.dashboardView,
        defaultTimeRange: domain.analytics.defaultTimeRange,
        emailReports: domain.analytics.emailReports,
        reportFrequency: domain.analytics.reportFrequency,
      },
      branding: {
        voucherTemplate: domain.branding.voucherTemplate,
        primaryColor: domain.branding.primaryColor,
        showLogoOnVouchers: domain.branding.showLogoOnVouchers,
      },
      notifications: {
        notifyOnVoucherClaim: domain.notifications.notifyOnVoucherClaim,
        notifyOnVoucherRedeem: domain.notifications.notifyOnVoucherRedeem,
        notifyOnVoucherExpiring: domain.notifications.notifyOnVoucherExpiring,
        notifyOnNewReview: domain.notifications.notifyOnNewReview,
        dailySummary: domain.notifications.dailySummary,
        monthlySummary: domain.notifications.monthlySummary,
        emailNotifications: domain.notifications.emailNotifications,
        pushNotifications: domain.notifications.pushNotifications,
        inAppNotifications: domain.notifications.inAppNotifications,
      },
      updatedAt: domain.updatedAt,
    }
  }

  /**
   * Maps a domain entity to a DTO for API responses
   */
  static toDTO(domain: BusinessSettingsDomain): BusinessSettingsDTO {
    return {
      version: '1.0',
      store: {
        timezone: domain.store.timezone,
        currency: domain.store.currency,
        primaryLanguage: domain.store.primaryLanguage,
        refundPolicy: domain.store.refundPolicy,
        paymentTerms: domain.store.paymentTerms,
      },
      payment: {
        acceptsCash: domain.payment.acceptsCash,
        acceptsCard: domain.payment.acceptsCard,
        acceptsTransfer: domain.payment.acceptsTransfer,
        acceptsMobilePayment: domain.payment.acceptsMobilePayment,
        providesInvoice: domain.payment.providesInvoice,
      },
      voucher: {
        autoApproveVouchers: domain.voucher.autoApproveVouchers,
        defaultValidityDays: domain.voucher.defaultValidityDays,
        maxActiveVouchers: domain.voucher.maxActiveVouchers,
        maxRedemptionsPerCustomer: domain.voucher.maxRedemptionsPerCustomer,
        requiresVerification: domain.voucher.requiresVerification,
        minimumPurchaseAmount: domain.voucher.minimumPurchaseAmount,
        showOnMarketplace: domain.voucher.showOnMarketplace,
        allowSharing: domain.voucher.allowSharing,
        platformCommissionAgreed: domain.voucher.platformCommissionAgreed,
        commissionModel: domain.voucher.commissionModel,
      },
      communication: {
        responseTimeCommitment: domain.communication.responseTimeCommitment,
        autoReplyEnabled: domain.communication.autoReplyEnabled,
        autoReplyMessage: domain.communication.autoReplyMessage,
        acceptsWhatsApp: domain.communication.acceptsWhatsApp,
        acceptsSMS: domain.communication.acceptsSMS,
      },
      analytics: {
        dashboardView: domain.analytics.dashboardView,
        defaultTimeRange: domain.analytics.defaultTimeRange,
        emailReports: domain.analytics.emailReports,
        reportFrequency: domain.analytics.reportFrequency,
      },
      branding: {
        voucherTemplate: domain.branding.voucherTemplate,
        primaryColor: domain.branding.primaryColor,
        showLogoOnVouchers: domain.branding.showLogoOnVouchers,
      },
      notifications: {
        notifyOnVoucherClaim: domain.notifications.notifyOnVoucherClaim,
        notifyOnVoucherRedeem: domain.notifications.notifyOnVoucherRedeem,
        notifyOnVoucherExpiring: domain.notifications.notifyOnVoucherExpiring,
        notifyOnNewReview: domain.notifications.notifyOnNewReview,
        dailySummary: domain.notifications.dailySummary,
        monthlySummary: domain.notifications.monthlySummary,
        emailNotifications: domain.notifications.emailNotifications,
        pushNotifications: domain.notifications.pushNotifications,
        inAppNotifications: domain.notifications.inAppNotifications,
      },
      updatedAt: formatDateToISO(domain.updatedAt),
    }
  }

  /**
   * Maps a DTO to a domain entity
   */
  static fromDTO(dto: BusinessSettingsDTO): BusinessSettingsDomain {
    return {
      version: '1.0',
      store: {
        timezone: dto.store.timezone,
        currency: dto.store.currency as Currency,
        primaryLanguage: dto.store.primaryLanguage as Language,
        refundPolicy: dto.store.refundPolicy as RefundPolicy,
        paymentTerms: dto.store.paymentTerms as PaymentTerms,
      },
      payment: {
        acceptsCash: dto.payment.acceptsCash,
        acceptsCard: dto.payment.acceptsCard,
        acceptsTransfer: dto.payment.acceptsTransfer,
        acceptsMobilePayment: dto.payment.acceptsMobilePayment,
        providesInvoice: dto.payment.providesInvoice,
      },
      voucher: {
        autoApproveVouchers: dto.voucher.autoApproveVouchers,
        defaultValidityDays: dto.voucher.defaultValidityDays,
        maxActiveVouchers: dto.voucher.maxActiveVouchers,
        maxRedemptionsPerCustomer: dto.voucher.maxRedemptionsPerCustomer,
        requiresVerification: dto.voucher.requiresVerification,
        minimumPurchaseAmount: dto.voucher.minimumPurchaseAmount,
        showOnMarketplace: dto.voucher.showOnMarketplace,
        allowSharing: dto.voucher.allowSharing,
        platformCommissionAgreed: dto.voucher.platformCommissionAgreed,
        commissionModel: dto.voucher.commissionModel as
          | CommissionModel
          | undefined,
      },
      communication: {
        responseTimeCommitment: dto.communication
          .responseTimeCommitment as ResponseTimeCommitment,
        autoReplyEnabled: dto.communication.autoReplyEnabled,
        autoReplyMessage: dto.communication.autoReplyMessage,
        acceptsWhatsApp: dto.communication.acceptsWhatsApp,
        acceptsSMS: dto.communication.acceptsSMS,
      },
      analytics: {
        dashboardView: dto.analytics.dashboardView as DashboardView,
        defaultTimeRange: dto.analytics.defaultTimeRange as TimeRange,
        emailReports: dto.analytics.emailReports,
        reportFrequency: dto.analytics.reportFrequency as
          | ReportFrequency
          | undefined,
      },
      branding: {
        voucherTemplate: dto.branding.voucherTemplate as VoucherTemplate,
        primaryColor: dto.branding.primaryColor,
        showLogoOnVouchers: dto.branding.showLogoOnVouchers,
      },
      notifications: {
        notifyOnVoucherClaim: dto.notifications.notifyOnVoucherClaim,
        notifyOnVoucherRedeem: dto.notifications.notifyOnVoucherRedeem,
        notifyOnVoucherExpiring: dto.notifications.notifyOnVoucherExpiring,
        notifyOnNewReview: dto.notifications.notifyOnNewReview,
        dailySummary: dto.notifications.dailySummary,
        monthlySummary: dto.notifications.monthlySummary,
        emailNotifications: dto.notifications.emailNotifications,
        pushNotifications: dto.notifications.pushNotifications,
        inAppNotifications: dto.notifications.inAppNotifications,
      },
      updatedAt: new Date(dto.updatedAt),
    }
  }

  /**
   * Maps an update DTO to a partial domain update
   */
  static fromUpdateDTO(
    dto: UpdateBusinessSettingsDTO,
  ): PartialBusinessSettingsDomain {
    const update: PartialBusinessSettingsDomain = {}

    if (dto.store) {
      update.store = {
        ...dto.store,
        currency: dto.store.currency as Currency | undefined,
        primaryLanguage: dto.store.primaryLanguage as Language | undefined,
        refundPolicy: dto.store.refundPolicy as RefundPolicy | undefined,
        paymentTerms: dto.store.paymentTerms as PaymentTerms | undefined,
      }
    }

    if (dto.payment) {
      update.payment = dto.payment
    }

    if (dto.voucher) {
      update.voucher = {
        ...dto.voucher,
        commissionModel: dto.voucher.commissionModel as
          | CommissionModel
          | undefined,
      }
    }

    if (dto.communication) {
      update.communication = {
        ...dto.communication,
        responseTimeCommitment: dto.communication.responseTimeCommitment as
          | ResponseTimeCommitment
          | undefined,
      }
    }

    if (dto.analytics) {
      update.analytics = {
        ...dto.analytics,
        dashboardView: dto.analytics.dashboardView as DashboardView | undefined,
        defaultTimeRange: dto.analytics.defaultTimeRange as
          | TimeRange
          | undefined,
        reportFrequency: dto.analytics.reportFrequency as
          | ReportFrequency
          | undefined,
      }
    }

    if (dto.branding) {
      update.branding = {
        ...dto.branding,
        voucherTemplate: dto.branding.voucherTemplate as
          | VoucherTemplate
          | undefined,
      }
    }

    if (dto.notifications) {
      update.notifications = dto.notifications
    }

    return update
  }
}
