/**
 * Cache key constants for voucher service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Voucher entity cache keys
  VOUCHER: {
    LIST: 'service:vouchers',
    SINGLE: 'service:voucher',
    BY_CODE: 'service:voucher:code',
    BY_BUSINESS: 'service:vouchers:business',
    USER_VOUCHERS: 'service:vouchers:user',
    AVAILABLE: 'service:vouchers:available',
    FEATURED: 'service:vouchers:featured',
    POPULAR: 'service:vouchers:popular',
    VALIDATED: 'service:voucher:validated',
  },

  // Redemption cache keys
  REDEMPTION: {
    LIST: 'service:redemptions',
    SINGLE: 'service:redemption',
    USER: 'service:redemptions:user',
    VOUCHER: 'service:redemptions:voucher',
    BUSINESS: 'service:redemptions:business',
  },

  // Admin cache keys
  ADMIN: {
    VOUCHERS: 'service:admin:vouchers',
    SINGLE: 'service:admin:voucher',
    STATS: 'service:admin:voucher:stats',
    ANALYTICS: 'service:admin:voucher:analytics',
  },

  // Internal service cache keys
  INTERNAL: {
    VOUCHERS: 'service:internal:vouchers',
    SINGLE: 'service:internal:voucher',
    BULK: 'service:internal:vouchers:bulk',
    ACTIVE: 'service:internal:vouchers:active',
    VALIDATION: 'service:internal:voucher:validation',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  voucherById: (id: string) => `${CACHE_KEYS.VOUCHER.SINGLE}:${id}`,
  voucherByCode: (code: string) => `${CACHE_KEYS.VOUCHER.BY_CODE}:${code}`,
  vouchersByBusiness: (businessId: string) =>
    `${CACHE_KEYS.VOUCHER.BY_BUSINESS}:${businessId}`,
  userVouchers: (userId: string) =>
    `${CACHE_KEYS.VOUCHER.USER_VOUCHERS}:${userId}`,
  voucherList: (params: any) =>
    `${CACHE_KEYS.VOUCHER.LIST}:${JSON.stringify(params)}`,
  redemptionsByUser: (userId: string) =>
    `${CACHE_KEYS.REDEMPTION.USER}:${userId}`,
  redemptionsByVoucher: (voucherId: string) =>
    `${CACHE_KEYS.REDEMPTION.VOUCHER}:${voucherId}`,
}
