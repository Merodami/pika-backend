import { z } from 'zod'

/**
 * PDF service specific enums
 */

// ============= Voucher Book Enums =============

/**
 * Voucher book specific sort fields
 */
export const VoucherBookSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'title',
  'year',
  'month',
  'status',
  'publishedAt',
])

export type VoucherBookSortBy = z.infer<typeof VoucherBookSortBy>

// ============= PDF Generation Enums =============

/**
 * PDF generation priority levels
 */
export const PDFGenerationPriority = z.enum(['low', 'normal', 'high'])

export type PDFGenerationPriority = z.infer<typeof PDFGenerationPriority>

/**
 * PDF generation status
 */
export const PDFGenerationStatus = z.enum([
  'queued',
  'processing',
  'completed',
  'failed',
])

export type PDFGenerationStatus = z.infer<typeof PDFGenerationStatus>

// ============= Bulk Operation Enums =============

/**
 * Bulk voucher book operations
 */
export const BulkVoucherBookOperation = z.enum([
  'publish',
  'archive',
  'generate_pdf',
  'delete',
])

export type BulkVoucherBookOperation = z.infer<typeof BulkVoucherBookOperation>
