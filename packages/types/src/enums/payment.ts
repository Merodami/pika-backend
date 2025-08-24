/**
 * Payment and billing related enums
 */

/**
 * Supported currencies (ISO 4217 standard - uppercase)
 * Following international currency code standards
 */
export enum Currency {
  PYG = 'PYG', // Paraguayan Guaraní
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
  CAD = 'CAD', // Canadian Dollar
  AUD = 'AUD', // Australian Dollar
  JPY = 'JPY', // Japanese Yen
  CNY = 'CNY', // Chinese Yuan
  INR = 'INR', // Indian Rupee
}

/**
 * Payment methods
 */
export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bankTransfer',
  WALLET = 'wallet',
  CASH = 'cash',
}

/**
 * Type definition for currency
 */
export type CurrencyType = `${Currency}`

/**
 * Promo code types
 */
export enum PromoCodeType {
  FIXED_AMOUNT = 'fixedAmount',
  PERCENTAGE = 'percentage',
}

/**
 * Type definition for promo code type
 */
export type PromoCodeTypeType = `${PromoCodeType}`

/**
 * Membership statuses
 */
export enum MembershipStatus {
  ACTIVE = 'active',
  PAST_DUE = 'pastDue',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incompleteExpired',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

/**
 * Membership action types
 */
export enum MembershipAction {
  CREATED = 'created',
  UPGRADED = 'upgraded',
  DOWNGRADED = 'downgraded',
  CANCELLED = 'cancelled',
  REACTIVATED = 'reactivated',
  EXPIRED = 'expired',
  PAYMENT_FAILED = 'paymentFailed',
  RENEWED = 'renewed',
}

/**
 * Product types
 */
export enum ProductType {
  MEMBERSHIP = 'membership',
  MERCHANDISE = 'merchandise',
  SERVICE = 'service',
  OTHER = 'other',
}

/**
 * Price intervals for subscriptions
 */
export enum PriceInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * Transaction types
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
}

/**
 * Transaction statuses
 */
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Transaction sort fields
 */
export enum TransactionSortBy {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amount',
  PROCESSED_AT = 'processedAt',
}

/**
 * Internal transaction types for service communication
 */
export enum InternalTransactionType {
  SUBSCRIPTION = 'subscription',
  REFUND = 'refund',
  TRANSFER = 'transfer',
}

/**
 * Refund reasons
 */
export enum RefundReason {
  CANCELLATION = 'cancellation',
  SERVICE_ISSUE = 'serviceIssue',
  DUPLICATE = 'duplicate',
  OTHER = 'other',
}

/**
 * Refund initiators
 */
export enum RefundInitiator {
  USER = 'user',
  SYSTEM = 'system',
  ADMIN = 'admin',
}

/**
 * Payment method types (simplified)
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK = 'bank',
  WALLET = 'wallet',
}

/**
 * UI payment method types (expanded for user selection)
 * Combines base payment methods with specific wallet types
 */
export enum UIPaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bankAccount',
  APPLE_PAY = 'applePay',
  GOOGLE_PAY = 'googlePay',
  WALLET = 'wallet',
}

/**
 * Payout statuses
 */
export enum PayoutStatus {
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Entity types for payment operations
 */
export enum EntityType {
  USER = 'user',
  BUSINESS = 'business',
}

/**
 * Admin-specific refund reasons
 */
export enum AdminRefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  CUSTOMER_REQUEST = 'customerRequest',
  OTHER = 'other',
}

/**
 * Adjustment types for balance operations
 */
export enum AdjustmentType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

/**
 * Adjustment reasons
 */
export enum AdjustmentReason {
  COMPENSATION = 'compensation',
  CORRECTION = 'correction',
  PROMOTIONAL = 'promotional',
  OTHER = 'other',
}

/**
 * Payout actions for admin operations
 */
export enum PayoutAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  DELAY = 'delay',
}

/**
 * Promo code statuses
 */
export enum PromoCodeStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  DISABLED = 'disabled',
}

/**
 * Report types for analytics
 */
export enum ReportType {
  REVENUE = 'revenue',
  TRANSACTIONS = 'transactions',
  PAYOUTS = 'payouts',
  DISPUTES = 'disputes',
  SUMMARY = 'summary',
}

/**
 * Report periods
 */
export enum ReportPeriod {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  ONE_YEAR = '1y',
  CUSTOM = 'custom',
}

/**
 * Report grouping options
 */
export enum ReportGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Report formats
 */
export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

/**
 * Dispute statuses
 */
export enum DisputeStatus {
  WARNING = 'warning',
  NEEDS_RESPONSE = 'needsResponse',
  UNDER_REVIEW = 'underReview',
  WON = 'won',
  LOST = 'lost',
}

/**
 * Dispute actions
 */
export enum DisputeAction {
  ACCEPT = 'accept',
  CHALLENGE = 'challenge',
}

/**
 * Promo code sort fields
 */
export enum PromoCodeSortBy {
  CODE = 'code',
  CREATED_AT = 'createdAt',
  USED_COUNT = 'usedCount',
  VALID_UNTIL = 'validUntil',
}

/**
 * Promo code sort fields (extended for public API)
 */
export enum PromoCodeSortField {
  CODE = 'code',
  DISCOUNT = 'discount',
  EXPIRATION_DATE = 'expirationDate',
  CREATED_AT = 'createdAt',
}

/**
 * Payment purpose types
 */
export enum PaymentPurpose {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'oneTime',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

/**
 * Webhook metadata purpose (Stripe-specific)
 */
export enum WebhookPaymentPurpose {
  CREDITS = 'credits',
  SUBSCRIPTION = 'subscription',
  SESSION_PAYMENT = 'sessionPayment',
}

/**
 * Subscription plan sort fields
 */
export enum SubscriptionPlanSortBy {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  ACTIVE_SUBSCRIPTIONS = 'activeSubscriptions',
}

// ============= Stripe-Specific Enums (Keep exact values) =============

/**
 * Stripe webhook event types
 * IMPORTANT: These must match Stripe's exact event names
 */
export enum StripeEventType {
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED = 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED = 'payment_intent.canceled',
  PAYMENT_METHOD_ATTACHED = 'payment_method.attached',
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED = 'checkout.session.expired',
}

/**
 * Stripe payment intent status values
 * IMPORTANT: These must match Stripe's exact status values
 */
export enum StripePaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  REQUIRES_CAPTURE = 'requires_capture',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
}

/**
 * Stripe subscription status values
 * IMPORTANT: These must match Stripe's exact status values
 */
export enum StripeSubscriptionStatus {
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
}

/**
 * Stripe checkout session payment status
 * IMPORTANT: These must match Stripe's exact values
 */
export enum StripeCheckoutPaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  NO_PAYMENT_REQUIRED = 'no_payment_required',
}

/**
 * Stripe invoice status values
 * IMPORTANT: These must match Stripe's exact status values
 */
export enum StripeInvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void',
}

/**
 * Stripe payment decline codes
 * IMPORTANT: These must match Stripe's exact decline codes
 */
export enum StripeDeclineCode {
  GENERIC_DECLINE = 'generic_decline',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  LOST_CARD = 'lost_card',
  STOLEN_CARD = 'stolen_card',
  EXPIRED_CARD = 'expired_card',
  INCORRECT_CVC = 'incorrect_cvc',
  PROCESSING_ERROR = 'processing_error',
  CARD_NOT_SUPPORTED = 'card_not_supported',
}

/**
 * Payment usage for setup intents (Stripe-specific)
 * IMPORTANT: These must match Stripe's exact usage values
 */
export enum PaymentUsage {
  ON_SESSION = 'on_session',
  OFF_SESSION = 'off_session',
}

/**
 * Webhook processing error codes
 */
export enum WebhookErrorCode {
  INVALID_SIGNATURE = 'invalidSignature',
  PROCESSING_ERROR = 'processingError',
  UNKNOWN_EVENT_TYPE = 'unknownEventType',
}

/**
 * Account holder types for bank accounts
 */
export enum AccountHolderType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}
