/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminVoucherBookQueryParams = {
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
     * Search query
     */
    search?: string;
    /**
     * Filter by book type
     */
    bookType?: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
    /**
     * Filter by book status
     */
    status?: 'draft' | 'ready_for_print' | 'published' | 'archived';
    /**
     * Filter by year
     */
    year?: number;
    /**
     * Filter by month
     */
    month?: number;
    /**
     * Filter by creator
     */
    createdBy?: string;
    /**
     * Filter by last updater
     */
    updatedBy?: string;
    /**
     * Filter books with/without content
     */
    hasContent?: boolean;
    /**
     * Filter books with/without generated PDF
     */
    hasPdf?: boolean;
};

