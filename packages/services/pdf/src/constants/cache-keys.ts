/**
 * Cache key constants for pdf service
 * Pattern: service:entity[-modifier]:identifier
 */
export const CACHE_KEYS = {
  VOUCHER_BOOK: {
    LIST: 'service:voucher-books',
    SINGLE: 'service:voucher-book',
    BY_STATUS: 'service:voucher-books:status',
    BY_CITY: 'service:voucher-books:city',
    BY_USER: 'service:voucher-books:user',
    METADATA: 'service:voucher-book:metadata',
  },
  ADMIN: {
    VOUCHER_BOOKS: 'service:admin:voucher-books',
    VOUCHER_BOOK: 'service:admin:voucher-book',
    VOUCHER_BOOK_STATS: 'service:admin:voucher-book:stats',
  },
  DISTRIBUTION: {
    BY_BOOK: 'service:distribution:book',
    BY_STATUS: 'service:distribution:status',
    BY_CITY: 'service:distribution:city',
    STATS: 'service:distribution:stats',
  },
  AD_PLACEMENT: {
    BY_BOOK: 'service:ads:book',
    BY_TYPE: 'service:ads:type',
    AVAILABLE_SLOTS: 'service:ads:slots',
    PRICING: 'service:ads:pricing',
  },
  INTERNAL: {
    VOUCHER_BOOKS: 'service:internal:voucher-books',
    DISTRIBUTION: 'service:internal:distribution',
    AD_PLACEMENTS: 'service:internal:ad-placements',
  },
} as const

export const generateCacheKey = {
  voucherBookById: (id: string) => `${CACHE_KEYS.VOUCHER_BOOK.SINGLE}:${id}`,
  voucherBooksByCity: (city: string) =>
    `${CACHE_KEYS.VOUCHER_BOOK.BY_CITY}:${city}`,
  voucherBooksByUser: (userId: string) =>
    `${CACHE_KEYS.VOUCHER_BOOK.BY_USER}:${userId}`,
  distributionByBook: (bookId: string) =>
    `${CACHE_KEYS.DISTRIBUTION.BY_BOOK}:${bookId}`,
  adPlacementsByBook: (bookId: string) =>
    `${CACHE_KEYS.AD_PLACEMENT.BY_BOOK}:${bookId}`,
}
