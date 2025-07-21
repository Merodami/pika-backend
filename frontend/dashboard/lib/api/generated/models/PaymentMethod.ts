/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * User payment method
 */
export type PaymentMethod = {
  /**
   * Universally Unique Identifier
   */
  id: string
  userId: string
  stripePaymentMethodId: string
  type:
    | 'CARD'
    | 'BANK_ACCOUNT'
    | 'PAYPAL'
    | 'APPLE_PAY'
    | 'GOOGLE_PAY'
    | 'WALLET'
  isDefault?: boolean
  card?: {
    brand:
      | 'VISA'
      | 'MASTERCARD'
      | 'AMEX'
      | 'DISCOVER'
      | 'DINERS'
      | 'JCB'
      | 'UNIONPAY'
      | 'UNKNOWN'
    last4: string
    expMonth: number
    expYear: number
    holderName?: string
    country?: string
    funding?: 'CREDIT' | 'DEBIT' | 'PREPAID' | 'UNKNOWN'
  }
  bankAccount?: {
    bankName?: string
    last4: string
    accountHolderName: string
    accountHolderType: 'INDIVIDUAL' | 'COMPANY'
    country: string
    currency: string
  }
  wallet?: {
    type: 'APPLE_PAY' | 'GOOGLE_PAY' | 'SAMSUNG_PAY'
    dynamicLast4?: string
  }
  billingAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  metadata?: Record<string, any>
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}
