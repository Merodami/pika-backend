/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransactionManagementService {
    /**
     * List all transactions
     * @returns any List of transactions
     * @throws ApiError
     */
    public static getTransactions({
        page = 1,
        limit = 20,
        sortBy,
        sortOrder = 'desc',
        search,
        fromDate,
        toDate,
        type,
        status,
        paymentMethod,
        userId,
        businessId,
        stripePaymentIntentId,
        minAmount,
        maxAmount,
        currency,
        hasDispute,
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
        /**
         * Start date (ISO 8601)
         */
        fromDate?: string,
        /**
         * End date (ISO 8601)
         */
        toDate?: string,
        type?: 'payment' | 'refund' | 'transfer' | 'payout' | 'adjustment',
        status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
        paymentMethod?: 'card' | 'bankTransfer' | 'wallet' | 'cash',
        userId?: string,
        /**
         * Universally Unique Identifier
         */
        businessId?: string,
        stripePaymentIntentId?: string,
        minAmount?: number,
        maxAmount?: number,
        currency?: string,
        hasDispute?: boolean,
    }): CancelablePromise<{
        data: Array<{
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
            url: '/transactions',
            query: {
                'page': page,
                'limit': limit,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
                'search': search,
                'fromDate': fromDate,
                'toDate': toDate,
                'type': type,
                'status': status,
                'paymentMethod': paymentMethod,
                'userId': userId,
                'businessId': businessId,
                'stripePaymentIntentId': stripePaymentIntentId,
                'minAmount': minAmount,
                'maxAmount': maxAmount,
                'currency': currency,
                'hasDispute': hasDispute,
            },
        });
    }
    /**
     * Get transaction details
     * @returns any Transaction details
     * @throws ApiError
     */
    public static getTransactions1({
        id,
    }: {
        id: string,
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
            method: 'GET',
            url: '/transactions/{id}',
            path: {
                'id': id,
            },
        });
    }
}
