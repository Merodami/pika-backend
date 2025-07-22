import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import {
  VoucherBookStatus,
  VoucherBookType,
  VoucherBookSortBy,
  SortOrder,
} from '../../../common/schemas/enums.js'
import { withTimestamps, withAudit } from '../../../common/schemas/metadata.js'
import { SearchParams } from '../../../common/schemas/pagination.js'
import { UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Admin voucher book management schemas
 */

// ============= Admin Voucher Book Response =============

/**
 * Admin voucher book response with full management details
 */
export const AdminVoucherBookResponse = openapi(
  withAudit({
    id: UUID,
    title: z.string().max(255).describe('Voucher book title'),
    edition: z
      .string()
      .max(100)
      .optional()
      .describe('Book edition (e.g., "January 2024")'),
    bookType: VoucherBookType.describe('Type of voucher book'),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Month for monthly books (1-12)'),
    year: z.number().int().min(2020).max(2100).describe('Year of publication'),
    status: VoucherBookStatus.describe('Current status of the book'),
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(24)
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
    metadata: z.record(z.any()).optional().describe('Additional book metadata'),
    deletedAt: z
      .string()
      .datetime()
      .optional()
      .describe('Soft delete timestamp'),
    // Computed fields
    computed: z
      .object({
        displayName: z.string().describe('Title with edition if available'),
        displayPeriod: z.string().describe('Formatted month/year display'),
        ageInDays: z.number().describe('Days since creation'),
        isRecent: z.boolean().describe('Created within last 7 days'),
        canBeEdited: z.boolean().describe('Whether book can be edited'),
        canBePublished: z.boolean().describe('Whether book can be published'),
        hasPDF: z.boolean().describe('Whether PDF has been generated'),
      })
      .optional(),
    // Statistics
    statistics: z
      .object({
        totalPages: z.number().describe('Total pages in book'),
        pagesWithPlacements: z.number().describe('Pages with content'),
        completionPercentage: z
          .number()
          .describe('Content completion percentage'),
        totalDistributions: z.number().describe('Total distributions'),
        pendingDistributions: z.number().describe('Pending distributions'),
        shippedDistributions: z.number().describe('Shipped distributions'),
        deliveredDistributions: z.number().describe('Delivered distributions'),
      })
      .optional(),
  }),
  {
    description: 'Voucher book information for admin management',
  },
)

export type AdminVoucherBookResponse = z.infer<typeof AdminVoucherBookResponse>

// ============= Create Voucher Book =============

/**
 * Create voucher book request
 */
export const CreateVoucherBookRequest = openapi(
  z.object({
    title: z.string().min(1).max(255).describe('Voucher book title'),
    edition: z.string().max(100).optional().describe('Book edition'),
    bookType: VoucherBookType.default('MONTHLY').describe(
      'Type of voucher book',
    ),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Month for monthly books'),
    year: z.number().int().min(2020).max(2100).describe('Year of publication'),
    totalPages: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(24)
      .describe('Total pages'),
    coverImageUrl: z.string().url().optional().describe('Cover image URL'),
    backImageUrl: z.string().url().optional().describe('Back cover image URL'),
    metadata: z.record(z.any()).optional().describe('Additional metadata'),
  }),
  {
    description: 'Create new voucher book',
    example: {
      title: 'Premium Voucher Book',
      edition: 'January 2024',
      bookType: 'MONTHLY',
      month: 1,
      year: 2024,
      totalPages: 24,
    },
  },
)

export type CreateVoucherBookRequest = z.infer<typeof CreateVoucherBookRequest>

// ============= Update Voucher Book =============

/**
 * Update voucher book request
 */
export const UpdateVoucherBookRequest = openapi(
  z.object({
    title: z.string().min(1).max(255).optional().describe('Voucher book title'),
    edition: z.string().max(100).optional().describe('Book edition'),
    bookType: VoucherBookType.optional().describe('Type of voucher book'),
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .describe('Month for monthly books'),
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
      .max(100)
      .optional()
      .describe('Total pages'),
    coverImageUrl: z.string().url().optional().describe('Cover image URL'),
    backImageUrl: z.string().url().optional().describe('Back cover image URL'),
    metadata: z.record(z.any()).optional().describe('Additional metadata'),
  }),
  {
    description: 'Update voucher book details',
  },
)

export type UpdateVoucherBookRequest = z.infer<typeof UpdateVoucherBookRequest>

// ============= Update Status =============

/**
 * Update voucher book status request
 */
export const UpdateVoucherBookStatusRequest = openapi(
  z.object({
    status: VoucherBookStatus.describe('New status for the voucher book'),
  }),
  {
    description: 'Update voucher book status',
    example: {
      status: 'READY_FOR_PRINT',
    },
  },
)

export type UpdateVoucherBookStatusRequest = z.infer<
  typeof UpdateVoucherBookStatusRequest
>

// ============= Generate PDF =============

/**
 * Generate PDF request
 */
export const GeneratePDFRequest = openapi(
  z.object({
    regenerate: z
      .boolean()
      .default(false)
      .describe('Force regeneration of existing PDF'),
  }),
  {
    description: 'Generate PDF for voucher book',
  },
)

export type GeneratePDFRequest = z.infer<typeof GeneratePDFRequest>

/**
 * Generate PDF response
 */
export const GeneratePDFResponse = openapi(
  z.object({
    id: UUID.describe('Voucher book ID'),
    pdfUrl: z.string().url().describe('URL of generated PDF'),
    generatedAt: z.string().datetime().describe('When PDF was generated'),
    pageCount: z.number().int().describe('Number of pages in PDF'),
    message: z.string().describe('Success message'),
  }),
  {
    description: 'PDF generation result',
  },
)

export type GeneratePDFResponse = z.infer<typeof GeneratePDFResponse>

// ============= Bulk Operations =============

/**
 * Bulk archive voucher books request
 */
export const BulkArchiveVoucherBooksRequest = openapi(
  z.object({
    voucherBookIds: z
      .array(UUID)
      .min(1)
      .max(100)
      .describe('List of voucher book IDs to archive'),
  }),
  {
    description: 'Archive multiple voucher books',
  },
)

export type BulkArchiveVoucherBooksRequest = z.infer<
  typeof BulkArchiveVoucherBooksRequest
>

// ============= Search/Filter =============

/**
 * Admin voucher book search parameters
 */
export const AdminVoucherBookQueryParams = SearchParams.extend({
  bookType: VoucherBookType.optional().describe('Filter by book type'),
  status: VoucherBookStatus.optional().describe('Filter by book status'),
  year: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .describe('Filter by year'),
  month: z.number().int().min(1).max(12).optional().describe('Filter by month'),
  createdBy: UserId.optional().describe('Filter by creator'),
  sortBy: VoucherBookSortBy.default('createdAt'),
})

export type AdminVoucherBookQueryParams = z.infer<
  typeof AdminVoucherBookQueryParams
>

// ============= Statistics =============

/**
 * Voucher book statistics query params
 */
export const VoucherBookStatsQueryParams = z.object({
  year: z
    .number()
    .int()
    .min(2020)
    .max(2100)
    .optional()
    .describe('Filter stats by year'),
  month: z
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .describe('Filter stats by month'),
})

export type VoucherBookStatsQueryParams = z.infer<
  typeof VoucherBookStatsQueryParams
>

/**
 * Voucher book statistics response
 */
export const VoucherBookStatisticsResponse = openapi(
  z.object({
    total: z.number().describe('Total voucher books'),
    byStatus: z.object({
      draft: z.number().describe('Books in draft status'),
      readyForPrint: z.number().describe('Books ready for print'),
      published: z.number().describe('Published books'),
      archived: z.number().describe('Archived books'),
    }),
    byType: z.object({
      monthly: z.number().describe('Monthly books'),
      specialEdition: z.number().describe('Special edition books'),
      regional: z.number().describe('Regional books'),
    }),
    distributions: z.object({
      total: z.number().describe('Total distributions'),
      pending: z.number().describe('Pending distributions'),
      shipped: z.number().describe('Shipped distributions'),
      delivered: z.number().describe('Delivered distributions'),
    }),
    recentActivity: z.object({
      booksCreatedThisMonth: z.number().describe('Books created this month'),
      pdfsGeneratedThisMonth: z.number().describe('PDFs generated this month'),
      distributionsThisMonth: z.number().describe('Distributions this month'),
    }),
  }),
  {
    description: 'Voucher book statistics and metrics',
  },
)

export type VoucherBookStatisticsResponse = z.infer<
  typeof VoucherBookStatisticsResponse
>

// ============= Response Types =============

/**
 * Paginated admin voucher book list
 */
export const AdminVoucherBookListResponse = paginatedResponse(
  AdminVoucherBookResponse,
)

export type AdminVoucherBookListResponse = z.infer<
  typeof AdminVoucherBookListResponse
>
