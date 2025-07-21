/**
 * PDF service enums - Service-specific enumerations
 */

/**
 * Voucher book sort fields
 */
export enum VoucherBookSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  YEAR = 'year',
  MONTH = 'month',
  STATUS = 'status',
  PUBLISHED_AT = 'publishedAt',
}

/**
 * PDF generation priority levels
 */
export enum PDFGenerationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * PDF generation status
 */
export enum PDFGenerationStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Bulk operation types
 */
export enum BulkOperationType {
  PUBLISH = 'publish',
  ARCHIVE = 'archive',
  GENERATE_PDF = 'generate_pdf',
  DELETE = 'delete',
}
