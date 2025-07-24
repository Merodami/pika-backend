/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PdfManagementService {
    /**
     * List all voucher books with admin details
     * @returns any List of voucher books
     * @throws ApiError
     */
    public static getAdminVoucherBooks({
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        bookType,
        status,
        year,
        month,
        createdBy,
        updatedBy,
        hasContent,
        hasPdf,
    }: {
        /**
         * Page number
         */
        page?: number,
        /**
         * Items per page
         */
        limit?: number,
        sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'year' | 'month' | 'status' | 'publishedAt',
        /**
         * Sort order
         */
        sortOrder?: 'asc' | 'desc',
        /**
         * Search query
         */
        search?: string,
        /**
         * Filter by book type
         */
        bookType?: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional',
        /**
         * Filter by book status
         */
        status?: 'draft' | 'ready_for_print' | 'published' | 'archived',
        /**
         * Filter by year
         */
        year?: number,
        /**
         * Filter by month
         */
        month?: number,
        /**
         * Filter by creator
         */
        createdBy?: string,
        /**
         * Filter by last updater
         */
        updatedBy?: string,
        /**
         * Filter books with/without content
         */
        hasContent?: boolean,
        /**
         * Filter books with/without generated PDF
         */
        hasPdf?: boolean,
    }): CancelablePromise<{
        /**
         * Page items
         */
        data: Array<{
            /**
             * Universally Unique Identifier
             */
            id: string;
            /**
             * Voucher book title
             */
            title: string;
            /**
             * Book edition (e.g., "January 2024")
             */
            edition?: string;
            /**
             * Type of voucher book
             */
            bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
            /**
             * Month for monthly books (1-12)
             */
            month?: number;
            /**
             * Year of publication
             */
            year: number;
            /**
             * Current status of the book
             */
            status: 'draft' | 'ready_for_print' | 'published' | 'archived';
            /**
             * Total number of pages
             */
            totalPages: number;
            /**
             * When the book was published
             */
            publishedAt?: string;
            /**
             * URL of the cover image
             */
            coverImageUrl?: string;
            /**
             * URL of the back cover image
             */
            backImageUrl?: string;
            /**
             * URL of the generated PDF
             */
            pdfUrl?: string;
            /**
             * When the PDF was generated
             */
            pdfGeneratedAt?: string;
            /**
             * Additional book metadata
             */
            metadata?: Record<string, any>;
            /**
             * User who created the book
             */
            createdBy: string;
            /**
             * User who last updated the book
             */
            updatedBy?: string;
            /**
             * Actual number of pages with content
             */
            pageCount: number;
            /**
             * Total number of ad placements
             */
            totalPlacements: number;
            /**
             * Number of distribution records
             */
            distributionCount: number;
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
            url: '/admin/voucher-books',
            query: {
                'page': page,
                'limit': limit,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
                'search': search,
                'bookType': bookType,
                'status': status,
                'year': year,
                'month': month,
                'createdBy': createdBy,
                'updatedBy': updatedBy,
                'hasContent': hasContent,
                'hasPdf': hasPdf,
            },
        });
    }
    /**
     * Create a new voucher book
     * @returns any Voucher book created successfully
     * @throws ApiError
     */
    public static postAdminVoucherBooks({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Voucher book title
             */
            title: string;
            /**
             * Book edition (e.g., "January 2024")
             */
            edition?: string;
            /**
             * Type of voucher book
             */
            bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
            /**
             * Month for monthly books (1-12)
             */
            month?: number;
            /**
             * Year of publication
             */
            year: number;
            /**
             * Total number of pages
             */
            totalPages?: number;
            /**
             * URL of the cover image
             */
            coverImageUrl?: string;
            /**
             * URL of the back cover image
             */
            backImageUrl?: string;
            /**
             * Additional book metadata
             */
            metadata?: Record<string, any>;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * Voucher book title
         */
        title: string;
        /**
         * Book edition (e.g., "January 2024")
         */
        edition?: string;
        /**
         * Type of voucher book
         */
        bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
        /**
         * Month for monthly books (1-12)
         */
        month?: number;
        /**
         * Year of publication
         */
        year: number;
        /**
         * Current status of the book
         */
        status: 'draft' | 'ready_for_print' | 'published' | 'archived';
        /**
         * Total number of pages
         */
        totalPages: number;
        /**
         * When the book was published
         */
        publishedAt?: string;
        /**
         * URL of the cover image
         */
        coverImageUrl?: string;
        /**
         * URL of the back cover image
         */
        backImageUrl?: string;
        /**
         * URL of the generated PDF
         */
        pdfUrl?: string;
        /**
         * When the PDF was generated
         */
        pdfGeneratedAt?: string;
        /**
         * Additional book metadata
         */
        metadata?: Record<string, any>;
        /**
         * User who created the book
         */
        createdBy: string;
        /**
         * User who last updated the book
         */
        updatedBy?: string;
        /**
         * Actual number of pages with content
         */
        pageCount: number;
        /**
         * Total number of ad placements
         */
        totalPlacements: number;
        /**
         * Number of distribution records
         */
        distributionCount: number;
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
            url: '/admin/voucher-books',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid voucher book data`,
            },
        });
    }
    /**
     * Get voucher book details
     * @returns any Voucher book details
     * @throws ApiError
     */
    public static getAdminVoucherBooks1({
        id,
    }: {
        /**
         * Voucher book ID
         */
        id: string,
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * Voucher book title
         */
        title: string;
        /**
         * Book edition (e.g., "January 2024")
         */
        edition?: string;
        /**
         * Type of voucher book
         */
        bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
        /**
         * Month for monthly books (1-12)
         */
        month?: number;
        /**
         * Year of publication
         */
        year: number;
        /**
         * Current status of the book
         */
        status: 'draft' | 'ready_for_print' | 'published' | 'archived';
        /**
         * Total number of pages
         */
        totalPages: number;
        /**
         * When the book was published
         */
        publishedAt?: string;
        /**
         * URL of the cover image
         */
        coverImageUrl?: string;
        /**
         * URL of the back cover image
         */
        backImageUrl?: string;
        /**
         * URL of the generated PDF
         */
        pdfUrl?: string;
        /**
         * When the PDF was generated
         */
        pdfGeneratedAt?: string;
        /**
         * Additional book metadata
         */
        metadata?: Record<string, any>;
        /**
         * User who created the book
         */
        createdBy: string;
        /**
         * User who last updated the book
         */
        updatedBy?: string;
        /**
         * Actual number of pages with content
         */
        pageCount: number;
        /**
         * Total number of ad placements
         */
        totalPlacements: number;
        /**
         * Number of distribution records
         */
        distributionCount: number;
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
            url: '/admin/voucher-books/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Voucher book not found`,
            },
        });
    }
    /**
     * Update voucher book information
     * @returns any Voucher book updated successfully
     * @throws ApiError
     */
    public static putAdminVoucherBooks({
        id,
        requestBody,
    }: {
        /**
         * Voucher book ID
         */
        id: string,
        requestBody?: {
            /**
             * Voucher book title
             */
            title?: string;
            /**
             * Book edition (e.g., "January 2024")
             */
            edition?: string;
            /**
             * Type of voucher book
             */
            bookType?: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
            /**
             * Month for monthly books (1-12)
             */
            month?: number;
            /**
             * Year of publication
             */
            year?: number;
            /**
             * Total number of pages
             */
            totalPages?: number;
            /**
             * URL of the cover image
             */
            coverImageUrl?: string;
            /**
             * URL of the back cover image
             */
            backImageUrl?: string;
            /**
             * Additional book metadata
             */
            metadata?: Record<string, any>;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * Voucher book title
         */
        title: string;
        /**
         * Book edition (e.g., "January 2024")
         */
        edition?: string;
        /**
         * Type of voucher book
         */
        bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
        /**
         * Month for monthly books (1-12)
         */
        month?: number;
        /**
         * Year of publication
         */
        year: number;
        /**
         * Current status of the book
         */
        status: 'draft' | 'ready_for_print' | 'published' | 'archived';
        /**
         * Total number of pages
         */
        totalPages: number;
        /**
         * When the book was published
         */
        publishedAt?: string;
        /**
         * URL of the cover image
         */
        coverImageUrl?: string;
        /**
         * URL of the back cover image
         */
        backImageUrl?: string;
        /**
         * URL of the generated PDF
         */
        pdfUrl?: string;
        /**
         * When the PDF was generated
         */
        pdfGeneratedAt?: string;
        /**
         * Additional book metadata
         */
        metadata?: Record<string, any>;
        /**
         * User who created the book
         */
        createdBy: string;
        /**
         * User who last updated the book
         */
        updatedBy?: string;
        /**
         * Actual number of pages with content
         */
        pageCount: number;
        /**
         * Total number of ad placements
         */
        totalPlacements: number;
        /**
         * Number of distribution records
         */
        distributionCount: number;
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
            method: 'PUT',
            url: '/admin/voucher-books/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Voucher book not found`,
            },
        });
    }
    /**
     * Delete a voucher book
     * @returns void
     * @throws ApiError
     */
    public static deleteAdminVoucherBooks({
        id,
    }: {
        /**
         * Voucher book ID
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin/voucher-books/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Voucher book not found`,
            },
        });
    }
    /**
     * Update voucher book status
     * @returns any Voucher book status updated successfully
     * @throws ApiError
     */
    public static patchAdminVoucherBooksStatus({
        id,
        requestBody,
    }: {
        /**
         * Voucher book ID
         */
        id: string,
        requestBody?: {
            /**
             * Publication date (defaults to now)
             */
            publishedAt?: string;
            /**
             * Generate PDF during publication
             */
            generatePdf?: boolean;
        },
    }): CancelablePromise<{
        /**
         * Universally Unique Identifier
         */
        id: string;
        /**
         * Voucher book title
         */
        title: string;
        /**
         * Book edition (e.g., "January 2024")
         */
        edition?: string;
        /**
         * Type of voucher book
         */
        bookType: 'monthly' | 'special_edition' | 'regional' | 'seasonal' | 'promotional';
        /**
         * Month for monthly books (1-12)
         */
        month?: number;
        /**
         * Year of publication
         */
        year: number;
        /**
         * Current status of the book
         */
        status: 'draft' | 'ready_for_print' | 'published' | 'archived';
        /**
         * Total number of pages
         */
        totalPages: number;
        /**
         * When the book was published
         */
        publishedAt?: string;
        /**
         * URL of the cover image
         */
        coverImageUrl?: string;
        /**
         * URL of the back cover image
         */
        backImageUrl?: string;
        /**
         * URL of the generated PDF
         */
        pdfUrl?: string;
        /**
         * When the PDF was generated
         */
        pdfGeneratedAt?: string;
        /**
         * Additional book metadata
         */
        metadata?: Record<string, any>;
        /**
         * User who created the book
         */
        createdBy: string;
        /**
         * User who last updated the book
         */
        updatedBy?: string;
        /**
         * Actual number of pages with content
         */
        pageCount: number;
        /**
         * Total number of ad placements
         */
        totalPlacements: number;
        /**
         * Number of distribution records
         */
        distributionCount: number;
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
            url: '/admin/voucher-books/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Voucher book not found`,
            },
        });
    }
    /**
     * Generate PDF for voucher book
     * @returns any PDF generated successfully
     * @throws ApiError
     */
    public static postAdminVoucherBooksGeneratePdf({
        id,
        requestBody,
    }: {
        /**
         * Voucher book ID
         */
        id: string,
        requestBody?: {
            /**
             * Force regeneration even if PDF already exists
             */
            force?: boolean;
            /**
             * Generation priority
             */
            priority?: 'low' | 'normal' | 'high';
        },
    }): CancelablePromise<{
        /**
         * PDF generation job ID
         */
        jobId: string;
        /**
         * Generation status
         */
        status: 'queued' | 'processing' | 'completed' | 'failed';
        /**
         * Status message
         */
        message: string;
        /**
         * Estimated completion time
         */
        estimatedCompletion?: string;
        /**
         * PDF URL if already completed
         */
        pdfUrl?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/voucher-books/{id}/generate-pdf',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Voucher book not found`,
            },
        });
    }
    /**
     * Archive multiple voucher books
     * @returns any Voucher books archived successfully
     * @throws ApiError
     */
    public static postAdminVoucherBooksBulkArchive({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Voucher book IDs to operate on
             */
            bookIds: Array<string>;
            /**
             * Operation to perform
             */
            operation: 'publish' | 'archive' | 'generate_pdf' | 'delete';
            /**
             * Operation-specific options
             */
            options?: Record<string, any>;
        },
    }): CancelablePromise<{
        /**
         * Number of books archived
         */
        archived: number;
        /**
         * Number of books that failed to archive
         */
        failed: number;
        /**
         * Error messages for failed operations
         */
        errors: Array<string>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/voucher-books/bulk-archive',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
            },
        });
    }
    /**
     * Get voucher book statistics
     * @returns any Voucher book statistics
     * @throws ApiError
     */
    public static getAdminVoucherBooksStatistics(): CancelablePromise<{
        /**
         * Number of successful operations
         */
        successful: number;
        /**
         * Number of failed operations
         */
        failed: number;
        /**
         * Detailed results for each book
         */
        results: Array<{
            /**
             * Voucher book ID
             */
            bookId: string;
            /**
             * Whether operation succeeded
             */
            success: boolean;
            /**
             * Error message if failed
             */
            error?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/voucher-books/statistics',
        });
    }
}
