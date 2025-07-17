/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User subscription status
 */
export type UserSubscriptionStatusResponse = {
    userId: string;
    hasActiveSubscription: boolean;
    subscriptionType?: string;
    /**
     * ISO 8601 datetime with timezone
     */
    expiresAt?: string;
    creditsRemaining: number;
    canBookSessions: boolean;
};

