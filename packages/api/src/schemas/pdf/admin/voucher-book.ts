import {
  BulkVoucherBookOperation as BulkVoucherBookOperationEnum,
  FIELD_LENGTH,
  PDFGenerationPriority as PDFGenerationPriorityEnum,
  PDFGenerationStatus as PDFGenerationStatusEnum,
  VoucherBookSortBy,
} from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
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
 * Admin voucher book response - complete information for management (raw Zod)
 */
export const AdminVoucherBookResponse = withTimestamps({
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
  coverImageUrl: z.string().url().optional().describe('URL of the cover image'),
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
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
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
})

/**
 * Admin voucher book response (OpenAPI documented)
 */
export const AdminVoucherBookResponseSchema = AdminVoucherBookResponse.openapi(
  'AdminVoucherBookResponse',
  {
    description: 'Admin voucher book information with full management details',
  },
)

export type AdminVoucherBookResponse = z.infer<typeof AdminVoucherBookResponse>

// ============= Admin CRUD Operations =============

/**
 * Create voucher book request (raw Zod)
 */
export const AdminCreateVoucherBookRequest = z.object({
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
  coverImageUrl: z.string().url().optional().describe('URL of the cover image'),
  backImageUrl: z
    .string()
    .url()
    .optional()
    .describe('URL of the back cover image'),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional()
    .describe('Additional book metadata'),
})

/**
 * Create voucher book request (OpenAPI documented)
 */
export const AdminCreateVoucherBookRequestSchema =
  AdminCreateVoucherBookRequest.openapi('AdminCreateVoucherBookRequest', {
    description: 'Create a new voucher book',
  })

export type AdminCreateVoucherBookRequest = z.infer<
  typeof AdminCreateVoucherBookRequest
>

/**
 * Update voucher book request (raw Zod)
 */
export const AdminUpdateVoucherBookRequest = z.object({
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
  coverImageUrl: z.string().url().optional().describe('URL of the cover image'),
  backImageUrl: z
    .string()
    .url()
    .optional()
    .describe('URL of the back cover image'),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional()
    .describe('Additional book metadata'),
})

/**
 * Update voucher book request (OpenAPI documented)
 */
export const AdminUpdateVoucherBookRequestSchema =
  AdminUpdateVoucherBookRequest.openapi('AdminUpdateVoucherBookRequest', {
    description: 'Update voucher book information',
  })

export type AdminUpdateVoucherBookRequest = z.infer<
  typeof AdminUpdateVoucherBookRequest
>

// ============= Admin Search =============

/**
 * Admin voucher book search parameters - comprehensive filtering (raw Zod)
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

/**
 * Admin voucher book search parameters (OpenAPI documented)
 */
export const AdminVoucherBookQueryParamsSchema =
  AdminVoucherBookQueryParams.openapi('AdminVoucherBookQueryParams', {
    description: 'Admin voucher book search and filter parameters',
  })

export type AdminVoucherBookQueryParams = z.infer<
  typeof AdminVoucherBookQueryParams
>

// ============= Admin Response Types =============

/**
 * Admin paginated voucher book list response (raw Zod)
 */
export const AdminVoucherBookListResponse = paginatedResponse(
  AdminVoucherBookResponse,
)

/**
 * Admin paginated voucher book list response (OpenAPI documented)
 */
export const AdminVoucherBookListResponseSchema =
  AdminVoucherBookListResponse.openapi('AdminVoucherBookListResponse', {
    description: 'Paginated list of voucher books for admin management',
  })

export type AdminVoucherBookListResponse = z.infer<
  typeof AdminVoucherBookListResponse
>

/**
 * Admin single voucher book response (raw Zod)
 */
export const AdminVoucherBookDetailResponse = z.object({
  data: AdminVoucherBookResponse,
})

/**
 * Admin single voucher book response (OpenAPI documented)
 */
export const AdminVoucherBookDetailResponseSchema =
  AdminVoucherBookDetailResponse.openapi('AdminVoucherBookDetailResponse', {
    description: 'Single voucher book details with full admin information',
  })

export type AdminVoucherBookDetailResponse = z.infer<
  typeof AdminVoucherBookDetailResponse
>

// ============= Admin Management Actions =============

/**
 * Publish voucher book request (raw Zod)
 */
export const AdminPublishVoucherBookRequest = z.object({
  publishedAt: z
    .string()
    .datetime()
    .optional()
    .describe('Publication date (defaults to now)'),
  generatePdf: z
    .boolean()
    .default(true)
    .describe('Generate PDF during publication'),
})

/**
 * Publish voucher book request (OpenAPI documented)
 */
export const AdminPublishVoucherBookRequestSchema =
  AdminPublishVoucherBookRequest.openapi('AdminPublishVoucherBookRequest', {
    description: 'Publish a voucher book',
  })

export type AdminPublishVoucherBookRequest = z.infer<
  typeof AdminPublishVoucherBookRequest
>

/**
 * Archive voucher book request (raw Zod)
 */
export const AdminArchiveVoucherBookRequest = z.object({
  reason: z
    .string()
    .max(FIELD_LENGTH.DESCRIPTION_MEDIUM_MAX)
    .optional()
    .describe('Reason for archiving'),
})

/**
 * Archive voucher book request (OpenAPI documented)
 */
export const AdminArchiveVoucherBookRequestSchema =
  AdminArchiveVoucherBookRequest.openapi('AdminArchiveVoucherBookRequest', {
    description: 'Archive a voucher book',
  })

export type AdminArchiveVoucherBookRequest = z.infer<
  typeof AdminArchiveVoucherBookRequest
>

/**
 * Generate PDF request (raw Zod)
 */
export const AdminGeneratePdfRequest = z.object({
  force: z
    .boolean()
    .default(false)
    .describe('Force regeneration even if PDF already exists'),
  priority: createZodEnum(PDFGenerationPriorityEnum)
    .default(PDFGenerationPriorityEnum.NORMAL)
    .describe('Generation priority'),
})

/**
 * Generate PDF request (OpenAPI documented)
 */
export const AdminGeneratePdfRequestSchema = AdminGeneratePdfRequest.openapi(
  'AdminGeneratePdfRequest',
  {
    description: 'Generate PDF for voucher book',
  },
)

export type AdminGeneratePdfRequest = z.infer<typeof AdminGeneratePdfRequest>

/**
 * Generate PDF response (raw Zod)
 */
export const AdminGeneratePdfResponse = z.object({
  jobId: z.string().describe('PDF generation job ID'),
  status: createZodEnum(PDFGenerationStatusEnum).describe('Generation status'),
  message: z.string().describe('Status message'),
  estimatedCompletion: z
    .string()
    .datetime()
    .optional()
    .describe('Estimated completion time'),
  pdfUrl: z.string().url().optional().describe('PDF URL if already completed'),
})

/**
 * Generate PDF response (OpenAPI documented)
 */
export const AdminGeneratePdfResponseSchema = AdminGeneratePdfResponse.openapi(
  'AdminGeneratePdfResponse',
  {
    description: 'PDF generation job status',
  },
)

export type AdminGeneratePdfResponse = z.infer<typeof AdminGeneratePdfResponse>

// ============= Bulk Operations =============

/**
 * Bulk voucher book operation request (raw Zod)
 */
export const AdminBulkVoucherBookOperationRequest = z.object({
  bookIds: z
    .array(UUID)
    .min(1)
    .max(FIELD_LENGTH.NAME_MAX)
    .describe('Voucher book IDs to operate on'),
  operation: createZodEnum(BulkVoucherBookOperationEnum).describe(
    'Operation to perform',
  ),
  options: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()]),
    )
    .optional()
    .describe('Operation-specific options'),
})

/**
 * Bulk voucher book operation request (OpenAPI documented)
 */
export const AdminBulkVoucherBookOperationRequestSchema =
  AdminBulkVoucherBookOperationRequest.openapi(
    'AdminBulkVoucherBookOperationRequest',
    {
      description: 'Bulk operation on multiple voucher books',
    },
  )

export type AdminBulkVoucherBookOperationRequest = z.infer<
  typeof AdminBulkVoucherBookOperationRequest
>

/**
 * Bulk operation response (raw Zod)
 */
export const AdminBulkVoucherBookOperationResponse = z.object({
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
})

/**
 * Bulk operation response (OpenAPI documented)
 */
export const AdminBulkVoucherBookOperationResponseSchema =
  AdminBulkVoucherBookOperationResponse.openapi(
    'AdminBulkVoucherBookOperationResponse',
    {
      description: 'Bulk operation results',
    },
  )

export type AdminBulkVoucherBookOperationResponse = z.infer<
  typeof AdminBulkVoucherBookOperationResponse
>

// ============= Status Management =============

/**
 * Update voucher book status request (raw Zod)
 */
export const AdminUpdateVoucherBookStatusRequest = z.object({
  status: VoucherBookStatusSchema,
})

/**
 * Update voucher book status request (OpenAPI documented)
 */
export const AdminUpdateVoucherBookStatusRequestSchema =
  AdminUpdateVoucherBookStatusRequest.openapi(
    'AdminUpdateVoucherBookStatusRequest',
    {
      description: 'Update voucher book status',
    },
  )

export type AdminUpdateVoucherBookStatusRequest = z.infer<
  typeof AdminUpdateVoucherBookStatusRequest
>

/**
 * Bulk archive voucher books request (raw Zod)
 */
export const BulkArchiveVoucherBooksRequest = z.object({
  voucherBookIds: z
    .array(UUID)
    .min(1)
    .max(FIELD_LENGTH.NAME_MAX)
    .describe('Voucher book IDs to archive'),
})

/**
 * Bulk archive voucher books request (OpenAPI documented)
 */
export const BulkArchiveVoucherBooksRequestSchema =
  BulkArchiveVoucherBooksRequest.openapi('BulkArchiveVoucherBooksRequest', {
    description: 'Bulk archive multiple voucher books',
  })

export type BulkArchiveVoucherBooksRequest = z.infer<
  typeof BulkArchiveVoucherBooksRequest
>

// ============= Statistics =============

/**
 * Voucher book statistics query parameters (raw Zod)
 */
export const VoucherBookStatsQueryParams = z.object({
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
})

/**
 * Voucher book statistics query parameters (OpenAPI documented)
 */
export const VoucherBookStatsQueryParamsSchema =
  VoucherBookStatsQueryParams.openapi('VoucherBookStatsQueryParams', {
    description: 'Query parameters for voucher book statistics',
  })

export type VoucherBookStatsQueryParams = z.infer<
  typeof VoucherBookStatsQueryParams
>

/**
 * Voucher book statistics response (raw Zod)
 */
export const VoucherBookStatsResponse = z.object({
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
})

/**
 * Voucher book statistics response (OpenAPI documented)
 */
export const VoucherBookStatsResponseSchema = VoucherBookStatsResponse.openapi(
  'VoucherBookStatsResponse',
  {
    description: 'Voucher book statistics',
  },
)

export type VoucherBookStatsResponse = z.infer<typeof VoucherBookStatsResponse>
