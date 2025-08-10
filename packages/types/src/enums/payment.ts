/**
 * Payment and billing related enums
 */

/**
 * Supported currencies (ISO 4217 lowercase)
 * Addresses hardcoded currency strings in payment schemas
 */
export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CAD = 'cad',
  AUD = 'aud',
  JPY = 'jpy',
  CNY = 'cny',
  INR = 'inr',
}

/**
 * Payment statuses
 * Standardizes payment status strings across services
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partiallyRefunded',
}

/**
 * Payment methods
 */
export enum PaymentMethod {
  CARD = 'card',
  BANK_ACCOUNT = 'bankAccount',
  PAYPAL = 'paypal',
  APPLE_PAY = 'applePay',
  GOOGLE_PAY = 'googlePay',
  CRYPTO = 'crypto',
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

// BillingInterval is already defined in subscription.ts
// Re-export from there to avoid duplication
