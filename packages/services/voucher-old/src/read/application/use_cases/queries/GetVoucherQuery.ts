/**
 * Interface for fetching a specific voucher
 */
export interface GetVoucherQuery {
  id: string
  includeRetailer?: boolean
  includeCategory?: boolean
  includeClaims?: boolean
  includeCodes?: boolean
}
