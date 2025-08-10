import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Path parameter schemas for voucher public routes
 */

/**
 * Voucher path parameters schema (raw Zod)
 * Used for validation in routes
 */
export const VoucherPathParamsSchema = z.object({
  id: UUID.describe('Voucher ID'),
})

export type VoucherPathParamsSchema = z.infer<typeof VoucherPathParamsSchema>

/**
 * Voucher path parameters (OpenAPI)
 * Used in: GET /vouchers/{id}, POST /vouchers/{id}/scan, etc.
 */
export const VoucherPathParams = openapi(VoucherPathParamsSchema, {
  description: 'Voucher ID path parameter',
})

export type VoucherPathParams = z.infer<typeof VoucherPathParams>
