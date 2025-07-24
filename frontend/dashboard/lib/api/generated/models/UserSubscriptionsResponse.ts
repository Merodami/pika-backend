/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Paginated response
 */
export type UserSubscriptionsResponse = {
    /**
     * Page items
     */
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
        planName: string;
        status: string;
        /**
         * ISO 8601 datetime with timezone
         */
        currentPeriodStart?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        currentPeriodEnd?: string;
        cancelAtPeriodEnd: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        createdAt: string;
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
};

