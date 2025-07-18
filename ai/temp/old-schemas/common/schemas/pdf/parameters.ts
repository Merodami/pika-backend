import { z } from 'zod'
import { UUID } from '../primitives.js'
import { openapi } from '../../utils/openapi.js'

/**
 * PDF service parameter schemas
 */

/**
 * Voucher book ID path parameter
 */
export const VoucherBookIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Voucher book ID path parameter',
  },
)

export type VoucherBookIdParam = z.infer<typeof VoucherBookIdParam>

/**
 * Ad placement ID path parameter
 */
export const AdPlacementIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Ad placement ID path parameter',
  },
)

export type AdPlacementIdParam = z.infer<typeof AdPlacementIdParam>

/**
 * Book distribution ID path parameter
 */
export const BookDistributionIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Book distribution ID path parameter',
  },
)

export type BookDistributionIdParam = z.infer<typeof BookDistributionIdParam>

/**
 * Voucher book page ID path parameter
 */
export const VoucherBookPageIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Voucher book page ID path parameter',
  },
)

export type VoucherBookPageIdParam = z.infer<typeof VoucherBookPageIdParam>

/**
 * Voucher book and page combined parameters
 */
export const VoucherBookPageParams = openapi(
  z.object({
    bookId: UUID.describe('Voucher book ID'),
    pageId: UUID.describe('Page ID'),
  }),
  {
    description: 'Voucher book and page path parameters',
  },
)

export type VoucherBookPageParams = z.infer<typeof VoucherBookPageParams>

/**
 * Voucher book and placement combined parameters
 */
export const VoucherBookPlacementParams = openapi(
  z.object({
    bookId: UUID.describe('Voucher book ID'),
    placementId: UUID.describe('Ad placement ID'),
  }),
  {
    description: 'Voucher book and placement path parameters',
  },
)

export type VoucherBookPlacementParams = z.infer<typeof VoucherBookPlacementParams>