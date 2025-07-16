// Subscription-specific enums
// Note: SubscriptionStatus and BillingInterval are now in @pika/types

// Re-export shared enums for convenience
export {
    BillingInterval as SubscriptionInterval,
    SubscriptionStatus
} from '@pika/types';

export enum MembershipType {
  FULL_ACCESS = 'FULL_ACCESS',
  OFF_PEAK = 'OFF_PEAK',
}

export enum MembershipPackage {
  LIMITED = 'LIMITED',
  STANDARD = 'STANDARD',
  UNLIMITED = 'UNLIMITED',
}

export enum StripeWebhookEvent {
  CUSTOMER_SUBSCRIPTION_CREATED = 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
}

