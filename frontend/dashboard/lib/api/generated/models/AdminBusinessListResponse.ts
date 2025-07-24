/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponse } from './CategoryResponse';
/**
 * Paginated response
 */
export type AdminBusinessListResponse = {
    /**
     * Page items
     */
    data: Array<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * User who owns this business
         */
        userId: string;
        /**
         * Translation key for business name
         */
        businessNameKey: string;
        /**
         * Translation key for business description
         */
        businessDescriptionKey?: string;
        /**
         * Category this business belongs to
         */
        categoryId: string;
        /**
         * Whether business is verified
         */
        verified?: boolean;
        /**
         * Whether business is active
         */
        active?: boolean;
        /**
         * Average rating of the business
         */
        avgRating?: number;
        /**
         * Soft deletion timestamp
         */
        deletedAt: string | null;
        /**
         * Business owner details when ?include=user
         */
        user?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            avatarUrl?: string;
            status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
            emailVerified: boolean;
            phoneVerified: boolean;
            /**
             * ISO 8601 datetime with timezone
             */
            lastLoginAt?: string;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        };
        category?: CategoryResponse;
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
};

