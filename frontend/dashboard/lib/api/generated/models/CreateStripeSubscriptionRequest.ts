/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create subscription from Stripe
 */
export type CreateStripeSubscriptionRequest = {
    userId: string;
    stripeSubscriptionId: string;
    /**
     * Universally Unique Identifier
     */
    planId: string;
    status: string;
    /**
     * ISO 8601 datetime with timezone
     */
    currentPeriodStart: string;
    /**
     * ISO 8601 datetime with timezone
     */
    currentPeriodEnd: string;
    metadata?: Record<string, any>;
};

