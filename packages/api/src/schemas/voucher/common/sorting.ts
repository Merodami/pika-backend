import { createSortFieldMapper } from '@api/common/utils/sorting.js'

import { AdminVoucherSortBy,VoucherSortBy } from './enums.js'

/**
 * Maps public API sort fields to database column names
 */
export const voucherSortFieldMapper = createSortFieldMapper(VoucherSortBy, {
  title: 'titleKey', // Maps 'title' to titleKey for sorting
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  expiresAt: 'validUntil',
  discountValue: 'discount',
})

/**
 * Maps admin API sort fields to database column names
 */
export const adminVoucherSortFieldMapper = createSortFieldMapper(
  AdminVoucherSortBy,
  {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    state: 'state',
    discountValue: 'discount',
    currentRedemptions: 'redemptionsCount',
    expiresAt: 'validUntil',
    businessId: 'businessId',
  },
)
