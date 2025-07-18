/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StripeWebhookEvent =
  | {
      id: string
      object: 'event'
      type: 'payment_intent.succeeded'
      data: {
        object: {
          id: string
          object: 'payment_intent'
          amount: number
          currency: string
          customer: string | null
          metadata?: Record<string, string>
          status:
            | 'requires_payment_method'
            | 'requires_confirmation'
            | 'requires_action'
            | 'processing'
            | 'requires_capture'
            | 'canceled'
            | 'succeeded'
          created: number
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'payment_intent.payment_failed'
      data: {
        object: {
          id: string
          object: 'payment_intent'
          amount: number
          currency: string
          customer: string | null
          metadata?: Record<string, string>
          status:
            | 'requires_payment_method'
            | 'requires_confirmation'
            | 'requires_action'
            | 'processing'
            | 'requires_capture'
            | 'canceled'
            | 'succeeded'
          created: number
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'payment_intent.canceled'
      data: {
        object: {
          id: string
          object: 'payment_intent'
          amount: number
          currency: string
          customer: string | null
          metadata?: Record<string, string>
          status:
            | 'requires_payment_method'
            | 'requires_confirmation'
            | 'requires_action'
            | 'processing'
            | 'requires_capture'
            | 'canceled'
            | 'succeeded'
          created: number
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'customer.subscription.created'
      data: {
        object: {
          id: string
          object: 'subscription'
          customer: string
          status:
            | 'active'
            | 'past_due'
            | 'unpaid'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
          current_period_start: number
          current_period_end: number
          metadata?: Record<string, string>
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'customer.subscription.updated'
      data: {
        object: {
          id: string
          object: 'subscription'
          customer: string
          status:
            | 'active'
            | 'past_due'
            | 'unpaid'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
          current_period_start: number
          current_period_end: number
          metadata?: Record<string, string>
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'customer.subscription.deleted'
      data: {
        object: {
          id: string
          object: 'subscription'
          customer: string
          status:
            | 'active'
            | 'past_due'
            | 'unpaid'
            | 'canceled'
            | 'incomplete'
            | 'incomplete_expired'
            | 'trialing'
          current_period_start: number
          current_period_end: number
          metadata?: Record<string, string>
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'invoice.payment_succeeded'
      data: {
        object: {
          id: string
          object: 'invoice'
          customer: string
          subscription: string | null
          amount_paid: number
          amount_due: number
          currency: string
          status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
          metadata?: Record<string, string>
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'invoice.payment_failed'
      data: {
        object: {
          id: string
          object: 'invoice'
          customer: string
          subscription: string | null
          amount_paid: number
          amount_due: number
          currency: string
          status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
          metadata?: Record<string, string>
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'checkout.session.completed'
      data: {
        object: {
          id: string
          object: 'checkout.session'
          customer: string | null
          payment_intent: string | null
          subscription: string | null
          amount_total: number | null
          currency: string | null
          metadata?: Record<string, string>
          payment_status: 'paid' | 'unpaid' | 'no_payment_required'
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
  | {
      id: string
      object: 'event'
      type: 'checkout.session.expired'
      data: {
        object: {
          id: string
          object: 'checkout.session'
          customer: string | null
          payment_intent: string | null
          subscription: string | null
          amount_total: number | null
          currency: string | null
          metadata?: Record<string, string>
          payment_status: 'paid' | 'unpaid' | 'no_payment_required'
        }
      }
      created: number
      livemode: boolean
      pending_webhooks: number
      request: any | null
    }
