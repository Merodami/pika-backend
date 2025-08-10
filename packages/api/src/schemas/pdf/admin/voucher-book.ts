import { VoucherBookSortBy } from '@pika/types'
import { FIELD_LENGTH } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  VoucherBookStatusSchema,
  VoucherBookTypeSchema,
} from '../common/enums.js'
import { VoucherBookSortBySchema } from '../common/enums.js'

/**
 * Admin PDF voucher book schemas - full management capabilities
 */

// ============= Admin Voucher Book Response =============

/**
 * Admin voucher book response - complete information for management
 */
export const AdminVoucherBookResponse = openapi(
  withTimestamps({
    id: UUID,
    title: z.string().max(FIELD_LENGTH.SLUG_MAX).describe('Voucher book title'),
    edition: z
      .string()
      .max(FIELD_LENGTH.NAME_MAX)
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
    status: VoucherBookStatusSchema,
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(FIELD_LENGTH.NAME_MAX)
      .describe('Total number of pages'),
    publishedAt: z
      .string()
      .datetime()
      .optional()
      .describe('When the book was published'),
    coverImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the cover image'),
    backImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the back cover image'),
    pdfUrl: z.string().url().optional().describe('URL of the generated PDF'),
    pdfGeneratedAt: z
      .string()
      .datetime()
      .optional()
      .describe('When the PDF was generated'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Additional book metadata'),
    createdBy: UserId.describe('User who created the book'),
    updatedBy: UserId.optional().describe('User who last updated the book'),
    // Admin-specific fields
    pageCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Actual number of pages with content'),
    totalPlacements: z
      .number()
      .int()
      .nonnegative()
      .describe('Total number of ad placements'),
    distributionCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of distribution records'),
  }),
  {
    description: 'Admin voucher book information with full management details',
  },
)

export type AdminVoucherBookResponse = z.infer<typeof AdminVoucherBookResponse>

// ============= Admin CRUD Operations =============

/**
 * Create voucher book request
 */
export const AdminCreateVoucherBookRequest = openapi(
  z.object({
    title: z
      .string()
      .min(FIELD_LENGTH.NAME_MIN)
      .max(FIELD_LENGTH.SLUG_MAX)
      .describe('Voucher book title'),
    edition: z
      .string()
      .max(FIELD_LENGTH.NAME_MAX)
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
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(FIELD_LENGTH.NAME_MAX)
      .default(24)
      .describe('Total number of pages'),
    coverImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the cover image'),
    backImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the back cover image'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Additional book metadata'),
  }),
  {
    description: 'Create a new voucher book',
  },
)

export type AdminCreateVoucherBookRequest = z.infer<
  typeof AdminCreateVoucherBookRequest
>

/**
 * Update voucher book request
 */
export const AdminUpdateVoucherBookRequest = openapi(
  z.object({
    title: z.string().min(1).max(255).optional().describe('Voucher book title'),
    edition: z
      .string()
      .max(FIELD_LENGTH.NAME_MAX)
      .optional()
      .describe('Book edition (e.g., "January 2024")'),
    bookType: VoucherBookTypeSchema.optional(),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Month for monthly books (1-12)'),
    year: z
      .number()
      .int()
      .min(2020)
      .max(2100)
      .optional()
      .describe('Year of publication'),
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(FIELD_LENGTH.NAME_MAX)
      .optional()
      .describe('Total number of pages'),
    coverImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the cover image'),
    backImageUrl: z
      .string()
      .url()
      .optional()
      .describe('URL of the back cover image'),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Additional book metadata'),
  }),
  {
    description: 'Update voucher book information',
  },
)

export type AdminUpdateVoucherBookRequest = z.infer<
  typeof AdminUpdateVoucherBookRequest
>

// ============= Admin Search =============

/**
 * Admin voucher book search parameters - comprehensive filtering
 */
export const AdminVoucherBookQueryParams = SearchParams.extend({
  bookType: VoucherBookTypeSchema.optional(),
  status: VoucherBookStatusSchema.optional(),
  year: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .describe('Filter by year'),
  month: z.number().int().min(1).max(12).optional().describe('Filter by month'),
  createdBy: UserId.optional().describe('Filter by creator'),
  updatedBy: UserId.optional().describe('Filter by last updater'),
  hasContent: z
    .boolean()
    .optional()
    .describe('Filter books with/without content'),
  hasPdf: z
    .boolean()
    .optional()
    .describe('Filter books with/without generated PDF'),
  sortBy: VoucherBookSortBySchema.default(VoucherBookSortBy.CREATED_AT),
})

export type AdminVoucherBookQueryParams = z.infer<
  typeof AdminVoucherBookQueryParams
>

// ============= Admin Response Types =============

/**
 * Admin paginated voucher book list response
 */
export const AdminVoucherBookListResponse = paginatedResponse(
  AdminVoucherBookResponse,
)

export type AdminVoucherBookListResponse = z.infer<
  typeof AdminVoucherBookListResponse
>

/**
 * Admin single voucher book response
 */
export const AdminVoucherBookDetailResponse = openapi(
  z.object({
    data: AdminVoucherBookResponse,
  }),
  {
    description: 'Single voucher book details with full admin information',
  },
)

export type AdminVoucherBookDetailResponse = z.infer<
  typeof AdminVoucherBookDetailResponse
>

// ============= Admin Management Actions =============

/**
 * Publish voucher book request
 */
export const AdminPublishVoucherBookRequest = openapi(
  z.object({
    publishedAt: z
      .string()
      .datetime()
      .optional()
      .describe('Publication date (defaults to now)'),
    generatePdf: z
      .boolean()
      .default(true)
      .describe('Generate PDF during publication'),
  }),
  {
    description: 'Publish a voucher book',
  },
)

export type AdminPublishVoucherBookRequest = z.infer<
  typeof AdminPublishVoucherBookRequest
>

/**
 * Archive voucher book request
 */
export const AdminArchiveVoucherBookRequest = openapi(
  z.object({
    reason: z
      .string()
      .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
      .optional()
      .describe('Reason for archiving'),
  }),
  {
    description: 'Archive a voucher book',
  },
)

export type AdminArchiveVoucherBookRequest = z.infer<
  typeof AdminArchiveVoucherBookRequest
>

/**
 * Generate PDF request
 */
export const AdminGeneratePdfRequest = openapi(
  z.object({
    force: z
      .boolean()
      .default(false)
      .describe('Force regeneration even if PDF already exists'),
    priority: z
      .enum(['low', 'normal', 'high'])
      .default('normal')
      .describe('Generation priority'),
  }),
  {
    description: 'Generate PDF for voucher book',
  },
)

export type AdminGeneratePdfRequest = z.infer<typeof AdminGeneratePdfRequest>

/**
 * Generate PDF response
 */
export const AdminGeneratePdfResponse = openapi(
  z.object({
    jobId: z.string().describe('PDF generation job ID'),
    status: z
      .enum(['queued', 'processing', 'completed', 'failed'])
      .describe('Generation status'),
    message: z.string().describe('Status message'),
    estimatedCompletion: z
      .string()
      .datetime()
      .optional()
      .describe('Estimated completion time'),
    pdfUrl: z
      .string()
      .url()
      .optional()
      .describe('PDF URL if already completed'),
  }),
  {
    description: 'PDF generation job status',
  },
)

export type AdminGeneratePdfResponse = z.infer<typeof AdminGeneratePdfResponse>

// ============= Bulk Operations =============

/**
 * Bulk voucher book operation request
 */
export const AdminBulkVoucherBookOperationRequest = openapi(
  z.object({
    bookIds: z
      .array(UUID)
      .min(1)
      .max(FIELD_LENGTH.NAME_MAX)
      .describe('Voucher book IDs to operate on'),
    operation: z
      .enum(['publish', 'archive', 'generate_pdf', 'delete'])
      .describe('Operation to perform'),
    options: z
      .record(z.string(), z.any())
      .optional()
      .describe('Operation-specific options'),
  }),
  {
    description: 'Bulk operation on multiple voucher books',
  },
)

export type AdminBulkVoucherBookOperationRequest = z.infer<
  typeof AdminBulkVoucherBookOperationRequest
>

/**
 * Bulk operation response
 */
export const AdminBulkVoucherBookOperationResponse = openapi(
  z.object({
    successful: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of successful operations'),
    failed: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of failed operations'),
    results: z
      .array(
        z.object({
          bookId: UUID.describe('Voucher book ID'),
          success: z.boolean().describe('Whether operation succeeded'),
          error: z.string().optional().describe('Error message if failed'),
        }),
      )
      .describe('Detailed results for each book'),
  }),
  {
    description: 'Bulk operation results',
  },
)

export type AdminBulkVoucherBookOperationResponse = z.infer<
  typeof AdminBulkVoucherBookOperationResponse
>

// ============= Status Management =============

/**
 * Update voucher book status request
 */
export const AdminUpdateVoucherBookStatusRequest = openapi(
  z.object({
    status: VoucherBookStatusSchema,
  }),
  {
    description: 'Update voucher book status',
  },
)

export type AdminUpdateVoucherBookStatusRequest = z.infer<
  typeof AdminUpdateVoucherBookStatusRequest
>

/**
 * Bulk archive voucher books request
 */
export const BulkArchiveVoucherBooksRequest = openapi(
  z.object({
    voucherBookIds: z
      .array(UUID)
      .min(1)
      .max(FIELD_LENGTH.NAME_MAX)
      .describe('Voucher book IDs to archive'),
  }),
  {
    description: 'Bulk archive multiple voucher books',
  },
)

export type BulkArchiveVoucherBooksRequest = z.infer<
  typeof BulkArchiveVoucherBooksRequest
>

// ============= Statistics =============

/**
 * Voucher book statistics query parameters
 */
export const VoucherBookStatsQueryParams = openapi(
  z.object({
    year: z.coerce
      .number()
      .int()
      .min(2020)
      .max(2100)
      .optional()
      .describe('Filter statistics by year'),
    month: z.coerce
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Filter statistics by month'),
  }),
  {
    description: 'Query parameters for voucher book statistics',
  },
)

export type VoucherBookStatsQueryParams = z.infer<
  typeof VoucherBookStatsQueryParams
>

/**
 * Voucher book statistics response
 */
export const VoucherBookStatsResponse = openapi(
  z.object({
    total: z.number().int().nonnegative().describe('Total voucher books'),
    byStatus: z
      .object({
        draft: z.number().int().nonnegative(),
        readyForPrint: z.number().int().nonnegative(),
        published: z.number().int().nonnegative(),
        archived: z.number().int().nonnegative(),
      })
      .describe('Count by status'),
    byType: z
      .object({
        monthly: z.number().int().nonnegative(),
        specialEdition: z.number().int().nonnegative(),
        regional: z.number().int().nonnegative(),
      })
      .describe('Count by type'),
    distributions: z
      .object({
        total: z.number().int().nonnegative(),
        pending: z.number().int().nonnegative(),
        shipped: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
      })
      .describe('Distribution statistics'),
    recentActivity: z
      .array(
        z.object({
          date: z.string().datetime(),
          action: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .describe('Recent activity data'),
  }),
  {
    description: 'Voucher book statistics',
  },
)

export type VoucherBookStatsResponse = z.infer<typeof VoucherBookStatsResponse>
