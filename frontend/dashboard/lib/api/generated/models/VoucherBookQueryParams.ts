/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VoucherBookQueryParams = {
    /**
     * Page number
     */
    page?: number;
    /**
     * Items per page
     */
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'year' | 'month' | 'status' | 'publishedAt';
    /**
     * Sort order
     */
    sortOrder?: 'asc' | 'desc';
    /**
     * Search in title and edition
     */
    search?: string;
    /**
     * Filter by book type
     */
    bookType?: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
    /**
     * Filter by year
     */
    year?: number;
    /**
     * Filter by month
     */
    month?: number;
};

