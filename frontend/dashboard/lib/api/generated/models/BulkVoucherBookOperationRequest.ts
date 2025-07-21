/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Bulk operation on multiple voucher books
 */
export type BulkVoucherBookOperationRequest = {
  /**
   * Voucher book IDs to operate on
   */
  bookIds: Array<string>
  /**
   * Operation to perform
   */
  operation: 'publish' | 'archive' | 'generate_pdf' | 'delete'
  /**
   * Operation-specific options
   */
  options?: Record<string, any>
}
