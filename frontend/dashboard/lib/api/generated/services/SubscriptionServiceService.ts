/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SubscriptionServiceService {
    /**
     * Update user membership status
     * @returns MessageResponse Membership updated
     * @throws ApiError
     */
    public static postSubscriptionsUserMembership({
        requestBody,
    }: {
        requestBody?: {
            stripeSubscriptionId: string;
            status: 'active' | 'canceled' | 'incomplete' | 'incompleteExpired' | 'pastDue' | 'trialing' | 'unpaid';
            /**
             * ISO 8601 datetime with timezone
             */
            currentPeriodStart?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            currentPeriodEnd?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            canceledAt?: string;
            cancelAtPeriodEnd?: boolean;
            metadata?: Record<string, any>;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/subscriptions/user-membership',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create subscription from Stripe
     * @returns any Subscription created
     * @throws ApiError
     */
    public static postSubscriptionsFromStripe({
        requestBody,
    }: {
        requestBody?: {
            stripeSubscriptionId: string;
        },
    }): CancelablePromise<{
        id: string;
        status: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/subscriptions/from-stripe',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update subscription status
     * @returns MessageResponse Status updated
     * @throws ApiError
     */
    public static putSubscriptionsStatus({
        requestBody,
    }: {
        requestBody?: {
            event: {
                type: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted' | 'customer.subscription.trial_will_end' | 'invoice.payment_failed' | 'invoice.payment_succeeded' | 'created' | 'cancelled' | 'paymentFailed' | 'creditsAllocated' | 'renewalReminder' | 'trialEnding';
                data: {
                    object?: any;
                };
                created: number;
            };
            stripeSignature?: string;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/subscriptions/status',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
