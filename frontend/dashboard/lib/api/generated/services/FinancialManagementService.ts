/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinancialManagementService {
    /**
     * Generate financial reports
     * @returns any Financial report data
     * @throws ApiError
     */
    public static getPaymentsReports({
        reportType,
        period,
        startDate,
        endDate,
        groupBy,
        includeDetails = false,
        format = 'json',
    }: {
        reportType: 'revenue' | 'transactions' | 'payouts' | 'disputes' | 'summary',
        period: '7d' | '30d' | '90d' | '1y' | 'custom',
        /**
         * ISO 8601 datetime with timezone
         */
        startDate?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        endDate?: string,
        groupBy?: 'day' | 'week' | 'month',
        includeDetails?: boolean,
        format?: 'json' | 'csv' | 'pdf',
    }): CancelablePromise<{
        reportType: 'revenue' | 'transactions' | 'payouts' | 'disputes' | 'summary';
        period: {
            /**
             * ISO 8601 datetime with timezone
             */
            start: string;
            /**
             * ISO 8601 datetime with timezone
             */
            end: string;
        };
        /**
         * ISO 8601 datetime with timezone
         */
        generatedAt: string;
        /**
         * Financial summary for a period
         */
        summary: {
            period: {
                /**
                 * ISO 8601 datetime with timezone
                 */
                start: string;
                /**
                 * ISO 8601 datetime with timezone
                 */
                end: string;
            };
            totalRevenue: number;
            totalRefunds: number;
            totalFees: number;
            netRevenue: number;
            /**
             * Revenue by transaction type (all keys optional)
             */
            revenueByType: {
                payment?: number;
                refund?: number;
                transfer?: number;
                payout?: number;
                adjustment?: number;
            };
            /**
             * Revenue by payment method (all keys optional)
             */
            revenueByPaymentMethod: {
                card?: number;
                bankTransfer?: number;
                wallet?: number;
                cash?: number;
            };
            transactionCount: number;
            successfulCount: number;
            failedCount: number;
            disputeCount: number;
            averageTransactionAmount: number;
            topBusinesses?: Array<{
                /**
                 * Universally Unique Identifier
                 */
                businessId: string;
                businessName: string;
                revenue: number;
                transactionCount: number;
            }>;
            topUsers?: Array<{
                userId: string;
                userName: string;
                spent: number;
                transactionCount: number;
            }>;
        };
        timeSeries?: Array<{
            date: string;
            revenue: number;
            transactions: number;
            refunds: number;
            disputes: number;
        }>;
        downloadUrl?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/payments/reports',
            query: {
                'reportType': reportType,
                'period': period,
                'startDate': startDate,
                'endDate': endDate,
                'groupBy': groupBy,
                'includeDetails': includeDetails,
                'format': format,
            },
        });
    }
    /**
     * Refund a transaction
     * @returns any Refund processed
     * @throws ApiError
     */
    public static postTransactionsRefund({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            /**
             * Partial refund amount
             */
            amount?: number;
            reason: 'duplicate' | 'fraudulent' | 'customerRequest' | 'other';
            description: string;
            notifyUser?: boolean;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        type: 'payment' | 'refund' | 'transfer' | 'payout' | 'adjustment';
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
        amount: number;
        currency: string;
        fee?: number;
        tax?: number;
        netAmount: number;
        userId?: string;
        userName?: string;
        /**
         * Universally Unique Identifier
         */
        businessId?: string;
        businessName?: string;
        paymentMethod: 'card' | 'bankTransfer' | 'wallet' | 'cash';
        stripePaymentIntentId?: string;
        stripeChargeId?: string;
        stripeRefundId?: string;
        /**
         * Type of related entity
         */
        referenceType?: string;
        /**
         * ID of related entity
         */
        referenceId?: string;
        description?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        processedAt?: string;
        failureReason?: string;
        failureCode?: string;
        disputeStatus?: 'warning' | 'needsResponse' | 'underReview' | 'won' | 'lost';
        disputeReason?: string;
        refundReason?: string;
        refundedAmount?: number;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transactions/{id}/refund',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Transaction not found`,
            },
        });
    }
    /**
     * Create promo code
     * @returns any Promo code created
     * @throws ApiError
     */
    public static postPromoCodes({
        requestBody,
    }: {
        requestBody?: {
            code: string;
            type: 'percentage' | 'fixedAmount';
            value: number;
            description?: string;
            maxUses?: number;
            maxUsesPerUser?: number;
            /**
             * ISO 8601 datetime with timezone
             */
            validFrom: string;
            /**
             * ISO 8601 datetime with timezone
             */
            validUntil?: string;
            minPurchaseAmount?: number;
            applicableToBusinesses?: Array<string>;
            applicableToUserTiers?: Array<string>;
            firstTimeOnly?: boolean;
            adminNotes?: string;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        code: string;
        type: 'percentage' | 'fixedAmount';
        value: number;
        description?: string;
        maxUses?: number;
        usedCount?: number;
        maxUsesPerUser?: number;
        /**
         * ISO 8601 datetime with timezone
         */
        validFrom: string;
        /**
         * ISO 8601 datetime with timezone
         */
        validUntil?: string;
        minPurchaseAmount?: number;
        applicableToBusinesses?: Array<string>;
        applicableToUserTiers?: Array<string>;
        firstTimeOnly?: boolean;
        isActive?: boolean;
        totalDiscountGiven?: number;
        createdBy: string;
        adminNotes?: string;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/promo-codes',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid promo code data`,
            },
        });
    }
    /**
     * List promo codes
     * @returns any List of promo codes
     * @throws ApiError
     */
    public static getPromoCodes({
        page = 1,
        limit = 20,
        sortBy,
        sortOrder = 'desc',
        search,
        type,
        isActive,
        status,
        createdBy,
        createdFrom,
        createdTo,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        limit?: number,
        /**
         * Field to sort by
         */
        sortBy?: string,
        /**
         * Sort order
         */
        sortOrder?: 'asc' | 'desc',
        /**
         * Search query
         */
        search?: string,
        type?: 'percentage' | 'fixedAmount',
        isActive?: boolean,
        status?: 'active' | 'expired' | 'depleted' | 'disabled',
        createdBy?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        createdFrom?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        createdTo?: string,
    }): CancelablePromise<{
        /**
         * Page items
         */
        data: Array<{
            /**
             * Universally Unique Identifier
             */
            id: string;
            code: string;
            type: 'percentage' | 'fixedAmount';
            value: number;
            description?: string;
            maxUses?: number;
            usedCount?: number;
            maxUsesPerUser?: number;
            /**
             * ISO 8601 datetime with timezone
             */
            validFrom: string;
            /**
             * ISO 8601 datetime with timezone
             */
            validUntil?: string;
            minPurchaseAmount?: number;
            applicableToBusinesses?: Array<string>;
            applicableToUserTiers?: Array<string>;
            firstTimeOnly?: boolean;
            isActive?: boolean;
            totalDiscountGiven?: number;
            createdBy: string;
            adminNotes?: string;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        }>;
        /**
         * Pagination information
         */
        pagination: {
            /**
             * Current page number
             */
            page: number;
            /**
             * Items per page
             */
            limit: number;
            /**
             * Total number of items
             */
            total: number;
            /**
             * Total number of pages
             */
            totalPages: number;
            /**
             * Whether there is a next page
             */
            hasNext: boolean;
            /**
             * Whether there is a previous page
             */
            hasPrev: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/promo-codes',
            query: {
                'page': page,
                'limit': limit,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
                'search': search,
                'type': type,
                'isActive': isActive,
                'status': status,
                'createdBy': createdBy,
                'createdFrom': createdFrom,
                'createdTo': createdTo,
            },
        });
    }
    /**
     * Update promo code
     * @returns any Promo code updated
     * @throws ApiError
     */
    public static patchPromoCodes({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            description?: string;
            maxUses?: number;
            maxUsesPerUser?: number;
            /**
             * ISO 8601 datetime with timezone
             */
            validFrom?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            validUntil?: string;
            minPurchaseAmount?: number;
            applicableToBusinesses?: Array<string>;
            applicableToUserTiers?: Array<string>;
            firstTimeOnly?: boolean;
            isActive?: boolean;
            adminNotes?: string;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        code: string;
        type: 'percentage' | 'fixedAmount';
        value: number;
        description?: string;
        maxUses?: number;
        usedCount?: number;
        maxUsesPerUser?: number;
        /**
         * ISO 8601 datetime with timezone
         */
        validFrom: string;
        /**
         * ISO 8601 datetime with timezone
         */
        validUntil?: string;
        minPurchaseAmount?: number;
        applicableToBusinesses?: Array<string>;
        applicableToUserTiers?: Array<string>;
        firstTimeOnly?: boolean;
        isActive?: boolean;
        totalDiscountGiven?: number;
        createdBy: string;
        adminNotes?: string;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/promo-codes/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Promo code not found`,
            },
        });
    }
    /**
     * List all subscriptions
     * @returns any List of subscriptions
     * @throws ApiError
     */
    public static getSubscriptions({
        status,
        planId,
        userId,
        page = 1,
        limit = 20,
    }: {
        status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED',
        planId?: string,
        userId?: string,
        page?: number,
        limit?: number,
    }): CancelablePromise<{
        data: Array<{
            /**
             * Universally Unique Identifier
             */
            id: string;
            userId: string;
            /**
             * Universally Unique Identifier
             */
            planId: string;
            status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
            /**
             * ISO 8601 datetime with timezone
             */
            startDate: string;
            /**
             * ISO 8601 datetime with timezone
             */
            endDate?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            nextBillingDate?: string;
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/subscriptions',
            query: {
                'status': status,
                'planId': planId,
                'userId': userId,
                'page': page,
                'limit': limit,
            },
        });
    }
    /**
     * Create subscription plan
     * @returns any Subscription plan created
     * @throws ApiError
     */
    public static postSubscriptionsPlans({
        requestBody,
    }: {
        requestBody?: {
            name: string;
            description: string;
            price: number;
            currency?: 'usd' | 'eur' | 'gbp';
            billingInterval: 'day' | 'week' | 'month' | 'year';
            trialPeriodDays?: number;
            maxUsagePerMonth?: number;
            isActive?: boolean;
            isPublic?: boolean;
            adminNotes?: string;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        name: string;
        description: string;
        price: number;
        currency?: 'usd' | 'eur' | 'gbp';
        billingInterval: 'day' | 'week' | 'month' | 'year';
        trialPeriodDays?: number;
        maxUsagePerMonth?: number;
        isActive?: boolean;
        isPublic?: boolean;
        stripePriceId?: string;
        stripeProductId?: string;
        activeSubscriptions?: number;
        totalSubscriptions?: number;
        monthlyRevenue?: number;
        createdBy: string;
        adminNotes?: string;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/subscriptions/plans',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid plan data`,
            },
        });
    }
    /**
     * List subscription plans
     * @returns any List of subscription plans
     * @throws ApiError
     */
    public static getSubscriptionsPlans({
        page = 1,
        limit = 20,
        sortBy,
        sortOrder = 'desc',
        search,
        billingInterval,
        isActive,
        isPublic,
        minPrice,
        maxPrice,
        createdBy,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        limit?: number,
        /**
         * Field to sort by
         */
        sortBy?: string,
        /**
         * Sort order
         */
        sortOrder?: 'asc' | 'desc',
        /**
         * Search query
         */
        search?: string,
        billingInterval?: 'day' | 'week' | 'month' | 'year',
        isActive?: boolean,
        isPublic?: boolean,
        minPrice?: number,
        maxPrice?: number,
        createdBy?: string,
    }): CancelablePromise<{
        /**
         * Page items
         */
        data: Array<{
            /**
             * Universally Unique Identifier
             */
            id: string;
            name: string;
            description: string;
            price: number;
            currency?: 'usd' | 'eur' | 'gbp';
            billingInterval: 'day' | 'week' | 'month' | 'year';
            trialPeriodDays?: number;
            maxUsagePerMonth?: number;
            isActive?: boolean;
            isPublic?: boolean;
            stripePriceId?: string;
            stripeProductId?: string;
            activeSubscriptions?: number;
            totalSubscriptions?: number;
            monthlyRevenue?: number;
            createdBy: string;
            adminNotes?: string;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        }>;
        /**
         * Pagination information
         */
        pagination: {
            /**
             * Current page number
             */
            page: number;
            /**
             * Items per page
             */
            limit: number;
            /**
             * Total number of items
             */
            total: number;
            /**
             * Total number of pages
             */
            totalPages: number;
            /**
             * Whether there is a next page
             */
            hasNext: boolean;
            /**
             * Whether there is a previous page
             */
            hasPrev: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/subscriptions/plans',
            query: {
                'page': page,
                'limit': limit,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
                'search': search,
                'billingInterval': billingInterval,
                'isActive': isActive,
                'isPublic': isPublic,
                'minPrice': minPrice,
                'maxPrice': maxPrice,
                'createdBy': createdBy,
            },
        });
    }
    /**
     * Update subscription plan
     * @returns any Subscription plan updated
     * @throws ApiError
     */
    public static patchSubscriptionsPlans({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            name?: string;
            description?: string;
            maxUsagePerMonth?: number;
            isActive?: boolean;
            isPublic?: boolean;
            adminNotes?: string;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        name: string;
        description: string;
        price: number;
        currency?: 'usd' | 'eur' | 'gbp';
        billingInterval: 'day' | 'week' | 'month' | 'year';
        trialPeriodDays?: number;
        maxUsagePerMonth?: number;
        isActive?: boolean;
        isPublic?: boolean;
        stripePriceId?: string;
        stripeProductId?: string;
        activeSubscriptions?: number;
        totalSubscriptions?: number;
        monthlyRevenue?: number;
        createdBy: string;
        adminNotes?: string;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/subscriptions/plans/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Plan not found`,
            },
        });
    }
}
