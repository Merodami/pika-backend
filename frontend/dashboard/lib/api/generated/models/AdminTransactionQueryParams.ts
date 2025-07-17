/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminTransactionQueryParams = {
    /**
     * Page number
     */
    page?: number;
    /**
     * Items per page
     */
    limit?: number;
    /**
     * Field to sort by
     */
    sortBy?: string;
    /**
     * Sort order
     */
    sortOrder?: 'asc' | 'desc';
    /**
     * Search query
     */
    search?: string;
    /**
     * Start date (ISO 8601)
     */
    fromDate?: string;
    /**
     * End date (ISO 8601)
     */
    toDate?: string;
    type?: 'payment' | 'refund' | 'transfer' | 'payout' | 'adjustment';
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    paymentMethod?: 'card' | 'bankTransfer' | 'wallet' | 'cash';
    userId?: string;
    /**
     * Universally Unique Identifier
     */
    businessId?: string;
    stripePaymentIntentId?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    hasDispute?: boolean;
};

