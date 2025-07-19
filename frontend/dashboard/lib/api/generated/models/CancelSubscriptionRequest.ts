/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Cancel a subscription
 */
export type CancelSubscriptionRequest = {
    /**
     * Whether to cancel at period end
     */
    cancelAtPeriodEnd?: boolean;
    /**
     * Cancellation reason
     */
    reason?: string;
    /**
     * User feedback
     */
    feedback?: string;
};

