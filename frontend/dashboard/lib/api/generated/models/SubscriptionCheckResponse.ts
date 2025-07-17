/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Subscription access check result
 */
export type SubscriptionCheckResponse = {
    hasAccess: boolean;
    subscription?: {
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * Universally Unique Identifier
         */
        planId: string;
        planName: string;
        status: string;
        features: Array<string>;
    };
    reason?: string;
};

