/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Process subscription webhook event
 */
export type SubscriptionWebhookEvent = {
  event: {
    type:
      | 'customer.subscription.created'
      | 'customer.subscription.updated'
      | 'customer.subscription.deleted'
      | 'customer.subscription.trial_will_end'
      | 'invoice.payment_failed'
      | 'invoice.payment_succeeded'
      | 'created'
      | 'cancelled'
      | 'paymentFailed'
      | 'creditsAllocated'
      | 'renewalReminder'
      | 'trialEnding'
    data: {
      object?: any
    }
    created: number
  }
  stripeSignature?: string
}
