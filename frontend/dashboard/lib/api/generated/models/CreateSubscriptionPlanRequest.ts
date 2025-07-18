/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create a new subscription plan
 */
export type CreateSubscriptionPlanRequest = {
  name: string
  description?: string
  price: number
  currency?: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount?: number
  trialPeriodDays?: number
  features: Array<string>
  metadata?: Record<string, any>
  stripeProductId?: string
  stripePriceId?: string
}
