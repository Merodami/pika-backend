/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Paginated response
 */
export type SubscriptionPlanListResponse = {
  /**
   * Page items
   */
  data: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * Name of the subscription plan
     */
    name: string
    /**
     * Description of the subscription plan
     */
    description?: string
    /**
     * Price per billing period
     */
    price: number
    /**
     * Currency code (e.g., usd, gbp)
     */
    currency?: string
    interval: 'day' | 'week' | 'month' | 'year'
    /**
     * Number of intervals between billings
     */
    intervalCount?: number
    /**
     * Number of trial days
     */
    trialPeriodDays?: number
    /**
     * Array of feature descriptions
     */
    features: Array<string>
    /**
     * Additional configuration
     */
    metadata?: Record<string, any>
    /**
     * Stripe product ID
     */
    stripeProductId?: string
    /**
     * Stripe price ID
     */
    stripePriceId?: string
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
    /**
     * Whether the record is active
     */
    isActive?: boolean
  }>
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Current page number
     */
    page: number
    /**
     * Items per page
     */
    limit: number
    /**
     * Total number of items
     */
    total: number
    /**
     * Total number of pages
     */
    totalPages: number
    /**
     * Whether there is a next page
     */
    hasNext: boolean
    /**
     * Whether there is a previous page
     */
    hasPrev: boolean
  }
}
