/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Add a payment method
 */
export type AddPaymentMethodRequest = {
  stripePaymentMethodId: string
  makeDefault?: boolean
  billingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}
