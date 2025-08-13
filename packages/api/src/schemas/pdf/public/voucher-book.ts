import { VoucherBookSortBy } from '@pika/types'
import { z } from 'zod'

import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  VoucherBookSortBySchema,
  VoucherBookTypeSchema,
} from '../common/enums.js'

/**
 * Public PDF voucher book schemas (read-only operations)
 */

// ============= Voucher Book Response =============

/**
 * Public voucher book response - matches original Pika implementation (raw Zod)
 */
export const VoucherBookResponse = withTimestamps({
  id: UUID,
  title: z.string().max(255).describe('Voucher book title'),
  edition: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .describe('Book edition (e.g., "January 2024")'),
  bookType: VoucherBookTypeSchema,
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe('Month for monthly books (1-12)'),
  year: z.number().int().min(2020).max(2100).describe('Year of publication'),
  status: z
    .enum(['published'])
    .describe('Only published books visible to public'),
  totalPages: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('Total number of pages'),
  publishedAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('When the book was published'),
  coverImageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('URL of the cover image'),
  backImageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('URL of the back cover image'),
  pdfUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('URL of the generated PDF'),
  // Note: No internal fields like createdBy, metadata, pdfGeneratedAt exposed to public
})

/**
 * Public voucher book response (OpenAPI documented)
 */
export const VoucherBookResponseSchema = VoucherBookResponse.openapi('VoucherBookResponse', {
  description: 'Public voucher book information (read-only)',
})

export type VoucherBookResponse = z.infer<typeof VoucherBookResponse>

// ============= Search Voucher Books =============

/**
 * Voucher book search/filter parameters - matches original Pika implementation (raw Zod)
 */
export const VoucherBookQueryParams = SearchParams.extend({
  bookType: VoucherBookTypeSchema.optional(),
  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .describe('Filter by year'),
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe('Filter by month'),
  search: z.string().optional().describe('Search in title and edition'),
  sortBy: VoucherBookSortBySchema.default(VoucherBookSortBy.PUBLISHED_AT),
  // Note: status is always PUBLISHED for public API - no status filtering needed
})

/**
 * Voucher book search/filter parameters (OpenAPI documented)
 */
export const VoucherBookQueryParamsSchema = VoucherBookQueryParams.openapi('VoucherBookQueryParams', {
  description: 'Voucher book search and filter parameters',
})

export type VoucherBookQueryParams = z.infer<typeof VoucherBookQueryParams>

/**
 * Voucher book path parameters (raw Zod)
 */
export const VoucherBookPathParams = z.object({
  id: UUID.describe('Voucher book ID'),
})

/**
 * Voucher book path parameters (OpenAPI documented)
 */
export const VoucherBookPathParamsSchema = VoucherBookPathParams.openapi('VoucherBookPathParams', {
  description: 'Voucher book path parameters',
})

export type VoucherBookPathParams = z.infer<typeof VoucherBookPathParams>

// ============= Response Types =============

/**
 * Paginated voucher book list response (raw Zod)
 */
export const VoucherBookListResponse = paginatedResponse(VoucherBookResponse)

/**
 * Paginated voucher book list response (OpenAPI documented)
 */
export const VoucherBookListResponseSchema = VoucherBookListResponse.openapi('VoucherBookListResponse', {
  description: 'Paginated list of voucher books',
})

export type VoucherBookListResponse = z.infer<typeof VoucherBookListResponse>

/**
 * Single voucher book response (raw Zod)
 */
export const VoucherBookDetailResponse = z.object({
  data: VoucherBookResponse,
})

/**
 * Single voucher book response (OpenAPI documented)
 */
export const VoucherBookDetailResponseSchema = VoucherBookDetailResponse.openapi('VoucherBookDetailResponse', {
  description: 'Single voucher book details',
})

export type VoucherBookDetailResponse = z.infer<
  typeof VoucherBookDetailResponse
>

// ============= PDF Download =============

/**
 * PDF download parameters (raw Zod)
 */
export const PdfDownloadParams = z.object({
  id: UUID.describe('Voucher book ID'),
})

/**
 * PDF download parameters (OpenAPI documented)
 */
export const PdfDownloadParamsSchema = PdfDownloadParams.openapi('PdfDownloadParams', {
  description: 'PDF download parameters',
})

export type PdfDownloadParams = z.infer<typeof PdfDownloadParams>

/**
 * PDF download response (raw Zod)
 */
export const PdfDownloadResponse = z.object({
  url: z.string().url().describe('Download URL for the PDF'),
  filename: z.string().describe('Suggested filename for download'),
  contentType: z.string().default('application/pdf').describe('MIME type'),
  size: z.number().int().positive().optional().describe('File size in bytes'),
  generatedAt: z.string().datetime().describe('When the PDF was generated'),
})

/**
 * PDF download response (OpenAPI documented)
 */
export const PdfDownloadResponseSchema = PdfDownloadResponse.openapi('PdfDownloadResponse', {
  description: 'PDF download information',
})

export type PdfDownloadResponse = z.infer<typeof PdfDownloadResponse>
