/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Bulk operation results
 */
export type BulkVoucherBookOperationResponse = {
  /**
   * Number of successful operations
   */
  successful: number
  /**
   * Number of failed operations
   */
  failed: number
  /**
   * Detailed results for each book
   */
  results: Array<{
    /**
     * Voucher book ID
     */
    bookId: string
    /**
     * Whether operation succeeded
     */
    success: boolean
    /**
     * Error message if failed
     */
    error?: string
  }>
}
