import { z } from 'zod'

import { SearchParams } from '../../shared/pagination.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public voucher query parameters
 */

/**
 * Get user's vouchers query parameters
 * Extends SearchParams with user voucher specific filters
 */
export const UserVouchersQueryParams = SearchParams.extend({
  status: z
    .enum(['claimed', 'redeemed', 'expired', 'all'])
    .default('all')
    .describe('Filter by voucher status'),
  sortBy: z.enum(['claimedAt', 'redeemedAt', 'expiresAt']).default('claimedAt'),
})

export type UserVouchersQueryParams = z.infer<typeof UserVouchersQueryParams>

/**
 * Get voucher by ID query parameters
 * For including related data when fetching a single voucher
 */
export const GetVoucherByIdQuery = openapi(
  z.object({
    include: z.string().optional().describe('Comma-separated relations: codes'),
  }),
  {
    description: 'Query parameters for retrieving voucher details',
  },
)

export type GetVoucherByIdQuery = z.infer<typeof GetVoucherByIdQuery>
