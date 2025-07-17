/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Update a subscription plan
 */
export type UpdateSubscriptionPlanRequest = {
    name?: string;
    description?: string;
    price?: number;
    trialPeriodDays?: number;
    features?: Array<string>;
    isActive?: boolean;
    metadata?: Record<string, any>;
    stripePriceId?: string;
};

