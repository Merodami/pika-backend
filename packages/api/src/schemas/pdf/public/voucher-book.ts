import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { VoucherBookStatus, VoucherBookType, VoucherBookSortBy, SortOrder } from '../../../common/schemas/enums.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { SearchParams } from '../../../common/schemas/pagination.js'
import { UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public PDF voucher book schemas (read-only operations)
 */

// ============= Voucher Book Response =============

/**
 * Public voucher book response - matches original Pika implementation
 */
export const VoucherBookResponse = openapi(
  withTimestamps({
    id: UUID,
    title: z.string().max(255).describe('Voucher book title'),
    edition: z.string().max(100).optional().describe('Book edition (e.g., "January 2024")'),
    bookType: VoucherBookType.describe('Type of voucher book'),
    month: z.number().int().min(1).max(12).optional().describe('Month for monthly books (1-12)'),
    year: z.number().int().min(2020).max(2100).describe('Year of publication'),
    status: z.enum(['PUBLISHED']).describe('Only published books visible to public'),
    totalPages: z.number().int().min(1).max(100).describe('Total number of pages'),
    publishedAt: z.string().datetime().describe('When the book was published'),
    coverImageUrl: z.string().url().optional().describe('URL of the cover image'),
    backImageUrl: z.string().url().optional().describe('URL of the back cover image'),
    pdfUrl: z.string().url().optional().describe('URL of the generated PDF'),
    // Note: No internal fields like createdBy, metadata, pdfGeneratedAt exposed to public
  }),
  {
    description: 'Public voucher book information (read-only)',
  },
)

export type VoucherBookResponse = z.infer<typeof VoucherBookResponse>

// ============= Search Voucher Books =============

/**
 * Voucher book search/filter parameters - matches original Pika implementation
 */
export const VoucherBookQueryParams = SearchParams.extend({
  bookType: VoucherBookType.optional().describe('Filter by book type'),
  year: z.number().int().min(2020).max(2100).optional().describe('Filter by year'),
  month: z.number().int().min(1).max(12).optional().describe('Filter by month'),
  search: z.string().optional().describe('Search in title and edition'),
  sortBy: VoucherBookSortBy.default('publishedAt'),
  // Note: status is always PUBLISHED for public API - no status filtering needed
})

export type VoucherBookQueryParams = z.infer<typeof VoucherBookQueryParams>

/**
 * Voucher book path parameters
 */
export const VoucherBookPathParams = z.object({
  id: UUID.describe('Voucher book ID'),
})

export type VoucherBookPathParams = z.infer<typeof VoucherBookPathParams>

// ============= Response Types =============

/**
 * Paginated voucher book list response
 */
export const VoucherBookListResponse = paginatedResponse(VoucherBookResponse)

export type VoucherBookListResponse = z.infer<typeof VoucherBookListResponse>

/**
 * Single voucher book response
 */
export const VoucherBookDetailResponse = openapi(
  z.object({
    data: VoucherBookResponse,
  }),
  {
    description: 'Single voucher book details',
  },
)

export type VoucherBookDetailResponse = z.infer<typeof VoucherBookDetailResponse>

// ============= PDF Download =============

/**
 * PDF download parameters
 */
export const PdfDownloadParams = z.object({
  id: UUID.describe('Voucher book ID'),
})

export type PdfDownloadParams = z.infer<typeof PdfDownloadParams>

/**
 * PDF download response
 */
export const PdfDownloadResponse = openapi(
  z.object({
    url: z.string().url().describe('Download URL for the PDF'),
    filename: z.string().describe('Suggested filename for download'),
    contentType: z.string().default('application/pdf').describe('MIME type'),
    size: z.number().int().positive().optional().describe('File size in bytes'),
    generatedAt: z.string().datetime().describe('When the PDF was generated'),
  }),
  {
    description: 'PDF download information',
  },
)

export type PdfDownloadResponse = z.infer<typeof PdfDownloadResponse>