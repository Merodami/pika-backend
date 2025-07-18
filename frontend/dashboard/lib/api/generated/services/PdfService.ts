/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class PdfService {
  /**
   * List all published voucher books
   * @returns any List of voucher books
   * @throws ApiError
   */
  public static getVoucherBooks({
    page = 1,
    limit = 20,
    sortBy = 'publishedAt',
    sortOrder = 'desc',
    search,
    bookType,
    year,
    month,
  }: {
    /**
     * Page number
     */
    page?: number
    /**
     * Items per page
     */
    limit?: number
    sortBy?:
      | 'createdAt'
      | 'updatedAt'
      | 'title'
      | 'year'
      | 'month'
      | 'status'
      | 'publishedAt'
    /**
     * Sort order
     */
    sortOrder?: 'asc' | 'desc'
    /**
     * Search in title and edition
     */
    search?: string
    /**
     * Filter by book type
     */
    bookType?:
      | 'MONTHLY'
      | 'SPECIAL_EDITION'
      | 'REGIONAL'
      | 'SEASONAL'
      | 'PROMOTIONAL'
    /**
     * Filter by year
     */
    year?: number
    /**
     * Filter by month
     */
    month?: number
  }): CancelablePromise<{
    /**
     * Page items
     */
    data: Array<{
      /**
       * Universally Unique Identifier
       */
      id: string
      /**
       * Voucher book title
       */
      title: string
      /**
       * Book edition (e.g., "January 2024")
       */
      edition?: string
      /**
       * Type of voucher book
       */
      bookType:
        | 'MONTHLY'
        | 'SPECIAL_EDITION'
        | 'REGIONAL'
        | 'SEASONAL'
        | 'PROMOTIONAL'
      /**
       * Month for monthly books (1-12)
       */
      month?: number
      /**
       * Year of publication
       */
      year: number
      /**
       * Only published books visible to public
       */
      status: 'PUBLISHED'
      /**
       * Total number of pages
       */
      totalPages: number
      /**
       * When the book was published
       */
      publishedAt: string
      /**
       * URL of the cover image
       */
      coverImageUrl?: string
      /**
       * URL of the back cover image
       */
      backImageUrl?: string
      /**
       * URL of the generated PDF
       */
      pdfUrl?: string
      /**
       * When the record was created
       */
      createdAt: string
      /**
       * When the record was last updated
       */
      updatedAt: string
    }>
    /**
     * Pagination information
     */
    pagination: {
      /**
       * Current page number
       */
      page: number
      /**
       * Items per page
       */
      limit: number
      /**
       * Total number of items
       */
      total: number
      /**
       * Total number of pages
       */
      totalPages: number
      /**
       * Whether there is a next page
       */
      hasNext: boolean
      /**
       * Whether there is a previous page
       */
      hasPrev: boolean
    }
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/voucher-books',
      query: {
        page: page,
        limit: limit,
        sortBy: sortBy,
        sortOrder: sortOrder,
        search: search,
        bookType: bookType,
        year: year,
        month: month,
      },
    })
  }
  /**
   * Get voucher book details
   * @returns any Voucher book details
   * @throws ApiError
   */
  public static getVoucherBooks1({
    id,
  }: {
    /**
     * Voucher book ID
     */
    id: string
  }): CancelablePromise<{
    /**
     * Public voucher book information (read-only)
     */
    data: {
      /**
       * Universally Unique Identifier
       */
      id: string
      /**
       * Voucher book title
       */
      title: string
      /**
       * Book edition (e.g., "January 2024")
       */
      edition?: string
      /**
       * Type of voucher book
       */
      bookType:
        | 'MONTHLY'
        | 'SPECIAL_EDITION'
        | 'REGIONAL'
        | 'SEASONAL'
        | 'PROMOTIONAL'
      /**
       * Month for monthly books (1-12)
       */
      month?: number
      /**
       * Year of publication
       */
      year: number
      /**
       * Only published books visible to public
       */
      status: 'PUBLISHED'
      /**
       * Total number of pages
       */
      totalPages: number
      /**
       * When the book was published
       */
      publishedAt: string
      /**
       * URL of the cover image
       */
      coverImageUrl?: string
      /**
       * URL of the back cover image
       */
      backImageUrl?: string
      /**
       * URL of the generated PDF
       */
      pdfUrl?: string
      /**
       * When the record was created
       */
      createdAt: string
      /**
       * When the record was last updated
       */
      updatedAt: string
    }
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/voucher-books/{id}',
      path: {
        id: id,
      },
      errors: {
        404: `Voucher book not found`,
      },
    })
  }
  /**
   * Download voucher book PDF
   * @returns any PDF download information
   * @throws ApiError
   */
  public static getVoucherBooksDownload({
    id,
  }: {
    /**
     * Voucher book ID
     */
    id: string
  }): CancelablePromise<{
    /**
     * Download URL for the PDF
     */
    url: string
    /**
     * Suggested filename for download
     */
    filename: string
    /**
     * MIME type
     */
    contentType?: string
    /**
     * File size in bytes
     */
    size?: number
    /**
     * When the PDF was generated
     */
    generatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/voucher-books/{id}/download',
      path: {
        id: id,
      },
      errors: {
        404: `Voucher book not found or PDF not available`,
      },
    })
  }
}
