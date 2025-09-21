/**
 * Business settings schemas
 * For business owners to manage their own configuration and preferences
 */

import {
  CommissionModel as CommissionModelEnum,
  Currency as CurrencyEnum,
  DashboardView as DashboardViewEnum,
  Language as LanguageEnum,
  PaymentTerms as PaymentTermsEnum,
  RefundPolicy as RefundPolicyEnum,
  ReportFrequency as ReportFrequencyEnum,
  ResponseTimeCommitment as ResponseTimeCommitmentEnum,
  TimeRange as TimeRangeEnum,
  VoucherTemplate as VoucherTemplateEnum,
} from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { DateTimeString } from '../../shared/primitives.js'
import { BusinessIdParam } from '../common/parameters.js'

// ============= Path Parameters =============

/**
 * Business settings path parameters
 * For routes like /businesses/:id/settings
 */
export const BusinessSettingsPathParams = BusinessIdParam
export type BusinessSettingsPathParams = z.infer<
  typeof BusinessSettingsPathParams
>

// ============= Enums as Zod Schemas =============

const Currency = createZodEnum(CurrencyEnum)
const Language = createZodEnum(LanguageEnum)
const RefundPolicy = createZodEnum(RefundPolicyEnum)
const PaymentTerms = createZodEnum(PaymentTermsEnum)
const VoucherTemplate = createZodEnum(VoucherTemplateEnum)
const DashboardView = createZodEnum(DashboardViewEnum)
const TimeRange = createZodEnum(TimeRangeEnum)
const ReportFrequency = createZodEnum(ReportFrequencyEnum)
const ResponseTimeCommitment = createZodEnum(ResponseTimeCommitmentEnum)
const CommissionModel = createZodEnum(CommissionModelEnum)

// ============= Settings Sections =============

/**
 * Business store settings schema (raw Zod)
 */
const BusinessStoreSettings = z.object({
  timezone: z.string().describe('IANA timezone identifier'),
  currency: Currency.describe('Accepted currency'),
  primaryLanguage: Language.describe('Primary business language'),
  refundPolicy: RefundPolicy.describe('Refund policy'),
  paymentTerms: PaymentTerms.describe('Payment terms'),
})

/**
 * Business payment settings schema (raw Zod)
 */
const BusinessPaymentSettings = z.object({
  acceptsCash: z.boolean().describe('Accepts cash payments'),
  acceptsCard: z.boolean().describe('Accepts card payments'),
  acceptsTransfer: z.boolean().describe('Accepts bank transfers'),
  acceptsMobilePayment: z.boolean().describe('Accepts mobile payments'),
  providesInvoice: z.boolean().describe('Provides invoices'),
})

/**
 * Business voucher settings schema (raw Zod)
 */
const BusinessVoucherSettings = z.object({
  autoApproveVouchers: z.boolean().describe('Auto-approve voucher claims'),
  defaultValidityDays: z
    .number()
    .min(1)
    .max(365)
    .describe('Default voucher validity in days'),
  maxActiveVouchers: z
    .number()
    .min(1)
    .max(100)
    .describe('Maximum concurrent active vouchers'),
  maxRedemptionsPerCustomer: z
    .number()
    .min(1)
    .max(100)
    .describe('Max redemptions per customer'),
  requiresVerification: z
    .boolean()
    .describe('Requires verification for redemption'),
  minimumPurchaseAmount: z
    .number()
    .min(0)
    .optional()
    .describe('Minimum purchase amount to use vouchers'),
  showOnMarketplace: z
    .boolean()
    .describe('Show vouchers in public marketplace'),
  allowSharing: z.boolean().describe('Allow customers to share vouchers'),
  platformCommissionAgreed: z
    .boolean()
    .describe('Agreed to platform commission'),
  commissionModel: CommissionModel.optional().describe('Commission model'),
})

/**
 * Business communication settings schema (raw Zod)
 */
const BusinessCommunicationSettings = z.object({
  responseTimeCommitment: ResponseTimeCommitment.describe(
    'Response time commitment',
  ),
  autoReplyEnabled: z.boolean().describe('Auto-reply enabled'),
  autoReplyMessage: z
    .string()
    .max(500)
    .optional()
    .describe('Auto-reply message'),
  acceptsWhatsApp: z.boolean().describe('Accepts WhatsApp messages'),
  acceptsSMS: z.boolean().describe('Accepts SMS messages'),
})

/**
 * Business analytics settings schema (raw Zod)
 */
const BusinessAnalyticsSettings = z.object({
  dashboardView: DashboardView.describe('Dashboard view preference'),
  defaultTimeRange: TimeRange.describe('Default time range'),
  emailReports: z.boolean().describe('Receive email reports'),
  reportFrequency: ReportFrequency.optional().describe('Report frequency'),
})

/**
 * Business branding settings schema (raw Zod)
 */
const BusinessBrandingSettings = z.object({
  voucherTemplate: VoucherTemplate.describe('Voucher template style'),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .describe('Primary brand color (hex)'),
  showLogoOnVouchers: z.boolean().describe('Show logo on vouchers'),
})

/**
 * Business notification settings schema (raw Zod)
 */
const BusinessNotificationSettings = z.object({
  notifyOnVoucherClaim: z.boolean().describe('Notify on voucher claim'),
  notifyOnVoucherRedeem: z.boolean().describe('Notify on voucher redemption'),
  notifyOnVoucherExpiring: z.boolean().describe('Notify on voucher expiring'),
  notifyOnNewReview: z.boolean().describe('Notify on new review'),
  dailySummary: z.boolean().describe('Receive daily summary'),
  monthlySummary: z.boolean().describe('Receive monthly summary'),
  emailNotifications: z.boolean().describe('Email notifications enabled'),
  pushNotifications: z.boolean().describe('Push notifications enabled'),
  inAppNotifications: z.boolean().describe('In-app notifications enabled'),
})

// ============= Main Settings Schema =============

/**
 * Complete business settings schema (raw Zod)
 */
export const BusinessSettings = z.object({
  version: z.literal('1.0').describe('Settings schema version'),
  store: BusinessStoreSettings,
  payment: BusinessPaymentSettings,
  voucher: BusinessVoucherSettings,
  communication: BusinessCommunicationSettings,
  analytics: BusinessAnalyticsSettings,
  branding: BusinessBrandingSettings,
  notifications: BusinessNotificationSettings,
  updatedAt: DateTimeString.describe('Last update timestamp'),
})

/**
 * Business settings response (raw Zod)
 */
export const BusinessSettingsResponse = z.object({
  settings: BusinessSettings.describe('Business settings'),
})

/**
 * Business settings response (OpenAPI documented)
 */
export const BusinessSettingsResponseSchema = BusinessSettingsResponse.openapi(
  'BusinessSettingsResponse',
  {
    description:
      'Business settings configuration for the authenticated business',
  },
)

export type BusinessSettingsResponse = z.infer<typeof BusinessSettingsResponse>

// ============= Update Settings =============

/**
 * Update business settings request (raw Zod)
 */
export const UpdateBusinessSettingsRequest = z.object({
  store: BusinessStoreSettings.partial().optional(),
  payment: BusinessPaymentSettings.partial().optional(),
  voucher: BusinessVoucherSettings.partial().optional(),
  communication: BusinessCommunicationSettings.partial().optional(),
  analytics: BusinessAnalyticsSettings.partial().optional(),
  branding: BusinessBrandingSettings.partial().optional(),
  notifications: BusinessNotificationSettings.partial().optional(),
})

/**
 * Update business settings request (OpenAPI documented)
 */
export const UpdateBusinessSettingsRequestSchema =
  UpdateBusinessSettingsRequest.openapi('UpdateBusinessSettingsRequest', {
    description: 'Update business settings',
  })

export type UpdateBusinessSettingsRequest = z.infer<
  typeof UpdateBusinessSettingsRequest
>

// ============= Reset Settings =============

/**
 * Reset business settings request (raw Zod)
 */
export const ResetBusinessSettingsRequest = z.object({
  sections: z
    .array(
      z.enum([
        'store',
        'payment',
        'voucher',
        'communication',
        'analytics',
        'branding',
        'notifications',
      ]),
    )
    .optional()
    .describe('Sections to reset (all if not specified)'),
})

/**
 * Reset business settings request (OpenAPI documented)
 */
export const ResetBusinessSettingsRequestSchema =
  ResetBusinessSettingsRequest.openapi('ResetBusinessSettingsRequest', {
    description: 'Reset business settings to defaults',
  })

export type ResetBusinessSettingsRequest = z.infer<
  typeof ResetBusinessSettingsRequest
>

/**
 * Reset business settings response (raw Zod)
 */
export const ResetBusinessSettingsResponse = z.object({
  success: z.boolean().describe('Whether reset was successful'),
  message: z.string().describe('Status message'),
  settings: BusinessSettings.describe('New settings after reset'),
})

/**
 * Reset business settings response (OpenAPI documented)
 */
export const ResetBusinessSettingsResponseSchema =
  ResetBusinessSettingsResponse.openapi('ResetBusinessSettingsResponse', {
    description: 'Business settings reset result',
  })

export type ResetBusinessSettingsResponse = z.infer<
  typeof ResetBusinessSettingsResponse
>

// ============= Validate Settings =============

/**
 * Validate business settings request (raw Zod)
 */
export const ValidateBusinessSettingsRequest = z.object({
  settings: UpdateBusinessSettingsRequest,
})

/**
 * Validate business settings request (OpenAPI documented)
 */
export const ValidateBusinessSettingsRequestSchema =
  ValidateBusinessSettingsRequest.openapi('ValidateBusinessSettingsRequest', {
    description: 'Validate business settings before saving',
  })

export type ValidateBusinessSettingsRequest = z.infer<
  typeof ValidateBusinessSettingsRequest
>

/**
 * Validate business settings response (raw Zod)
 */
export const ValidateBusinessSettingsResponse = z.object({
  valid: z.boolean().describe('Whether settings are valid'),
  errors: z.array(z.string()).optional().describe('Validation errors if any'),
})

/**
 * Validate business settings response (OpenAPI documented)
 */
export const ValidateBusinessSettingsResponseSchema =
  ValidateBusinessSettingsResponse.openapi('ValidateBusinessSettingsResponse', {
    description: 'Business settings validation result',
  })

export type ValidateBusinessSettingsResponse = z.infer<
  typeof ValidateBusinessSettingsResponse
>
