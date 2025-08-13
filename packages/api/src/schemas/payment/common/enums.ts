import {
  AdjustmentReason as AdjustmentReasonEnum,
  AdjustmentType as AdjustmentTypeEnum,
  AdminRefundReason as AdminRefundReasonEnum,
  Currency as CurrencyEnum,
  DisputeAction as DisputeActionEnum,
  DisputeStatus as DisputeStatusEnum,
  EntityType as EntityTypeEnum,
  InternalTransactionType as InternalTransactionTypeEnum,
  MembershipAction as MembershipActionEnum,
  MembershipStatus as MembershipStatusEnum,
  PaymentMethod as PaymentMethodEnum,
  PaymentMethodType as PaymentMethodTypeEnum,
  PayoutAction as PayoutActionEnum,
  PayoutStatus as PayoutStatusEnum,
  PlanType as PlanTypeEnum,
  PriceInterval as PriceIntervalEnum,
  ProductType as ProductTypeEnum,
  PromoCodeSortBy as PromoCodeSortByEnum,
  PromoCodeStatus as PromoCodeStatusEnum,
  PromoCodeType as PromoCodeTypeEnum,
  RefundInitiator as RefundInitiatorEnum,
  RefundReason as RefundReasonEnum,
  ReportFormat as ReportFormatEnum,
  ReportGroupBy as ReportGroupByEnum,
  ReportPeriod as ReportPeriodEnum,
  ReportType as ReportTypeEnum,
  SubscriptionPlanSortBy as SubscriptionPlanSortByEnum,
  TransactionSortBy as TransactionSortByEnum,
  TransactionStatus as TransactionStatusEnum,
  TransactionType as TransactionTypeEnum,
} from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'

/**
 * Payment-specific enums
 */

// ============= Membership Enums =============

export const MembershipStatus = createZodEnum(MembershipStatusEnum)

export type MembershipStatus = z.infer<typeof MembershipStatus>

export const PlanType = createZodEnum(PlanTypeEnum)

export type PlanType = z.infer<typeof PlanType>

export const MembershipAction = createZodEnum(MembershipActionEnum)

export type MembershipAction = z.infer<typeof MembershipAction>

// ============= Product Enums =============

export const ProductType = createZodEnum(ProductTypeEnum)

export type ProductType = z.infer<typeof ProductType>

export const PriceInterval = createZodEnum(PriceIntervalEnum)

export type PriceInterval = z.infer<typeof PriceInterval>

export const Currency = createZodEnum(CurrencyEnum)

export type Currency = z.infer<typeof Currency>

// ============= Transaction Enums =============

export const TransactionType = createZodEnum(TransactionTypeEnum)

export type TransactionType = z.infer<typeof TransactionType>

export const TransactionStatus = createZodEnum(TransactionStatusEnum)

export type TransactionStatus = z.infer<typeof TransactionStatus>

export const PaymentMethod = createZodEnum(PaymentMethodEnum)

export type PaymentMethod = z.infer<typeof PaymentMethod>

export const TransactionSortBy = createZodEnum(TransactionSortByEnum)

export type TransactionSortBy = z.infer<typeof TransactionSortBy>

// ============= Internal Service Enums =============

export const InternalTransactionType = createZodEnum(
  InternalTransactionTypeEnum,
)

export type InternalTransactionType = z.infer<typeof InternalTransactionType>

export const RefundReason = createZodEnum(RefundReasonEnum)

export type RefundReason = z.infer<typeof RefundReason>

export const RefundInitiator = createZodEnum(RefundInitiatorEnum)

export type RefundInitiator = z.infer<typeof RefundInitiator>

export const PaymentMethodType = createZodEnum(PaymentMethodTypeEnum)

export type PaymentMethodType = z.infer<typeof PaymentMethodType>

export const PayoutStatus = createZodEnum(PayoutStatusEnum)

export type PayoutStatus = z.infer<typeof PayoutStatus>

export const EntityType = createZodEnum(EntityTypeEnum)

export type EntityType = z.infer<typeof EntityType>

// ============= Admin Enums =============

export const AdminRefundReason = createZodEnum(AdminRefundReasonEnum)

export type AdminRefundReason = z.infer<typeof AdminRefundReason>

export const AdjustmentType = createZodEnum(AdjustmentTypeEnum)

export type AdjustmentType = z.infer<typeof AdjustmentType>

export const AdjustmentReason = createZodEnum(AdjustmentReasonEnum)

export type AdjustmentReason = z.infer<typeof AdjustmentReason>

export const PayoutAction = createZodEnum(PayoutActionEnum)

export type PayoutAction = z.infer<typeof PayoutAction>

// ============= Promo Code Enums =============

export const PromoCodeType = createZodEnum(PromoCodeTypeEnum)

export type PromoCodeType = z.infer<typeof PromoCodeType>

export const PromoCodeStatus = createZodEnum(PromoCodeStatusEnum)

export type PromoCodeStatus = z.infer<typeof PromoCodeStatus>

// ============= Report Enums =============

export const ReportType = createZodEnum(ReportTypeEnum)

export type ReportType = z.infer<typeof ReportType>

export const ReportPeriod = createZodEnum(ReportPeriodEnum)

export type ReportPeriod = z.infer<typeof ReportPeriod>

export const ReportGroupBy = createZodEnum(ReportGroupByEnum)

export type ReportGroupBy = z.infer<typeof ReportGroupBy>

export const ReportFormat = createZodEnum(ReportFormatEnum)

export type ReportFormat = z.infer<typeof ReportFormat>

// ============= Dispute Enums =============

export const DisputeStatus = createZodEnum(DisputeStatusEnum)

export type DisputeStatus = z.infer<typeof DisputeStatus>

export const DisputeAction = createZodEnum(DisputeActionEnum)

export type DisputeAction = z.infer<typeof DisputeAction>

// ============= Sort Enums =============

export const PromoCodeSortBy = createZodEnum(PromoCodeSortByEnum)

export type PromoCodeSortBy = z.infer<typeof PromoCodeSortBy>

export const SubscriptionPlanSortBy = createZodEnum(SubscriptionPlanSortByEnum)

export type SubscriptionPlanSortBy = z.infer<typeof SubscriptionPlanSortBy>
