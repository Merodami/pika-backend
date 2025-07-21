/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Publish a voucher book
 */
export type PublishVoucherBookRequest = {
  /**
   * Publication date (defaults to now)
   */
  publishedAt?: string
  /**
   * Generate PDF during publication
   */
  generatePdf?: boolean
}
