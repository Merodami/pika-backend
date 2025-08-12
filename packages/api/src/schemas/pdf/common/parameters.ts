import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * PDF service parameters - shared across all API tiers
 */

/**
 * Voucher book ID parameter schema (raw Zod)
 */
export const VoucherBookIdParamSchema = z.object({
  id: UUID.describe('Voucher book ID'),
})

export type VoucherBookIdParamSchema = z.infer<typeof VoucherBookIdParamSchema>

/**
 * Voucher book ID parameter (OpenAPI)
 * Used in: GET /admin/voucher-books/{id}, etc.
 */
export const VoucherBookIdParam = openapi(VoucherBookIdParamSchema, {
  description: 'Voucher book ID path parameter',
})

export type VoucherBookIdParam = z.infer<typeof VoucherBookIdParam>

/**
 * Page ID parameter schema (raw Zod)
 */
export const PageIdParamSchema = z.object({
  pageId: UUID.describe('Page ID'),
})

export type PageIdParamSchema = z.infer<typeof PageIdParamSchema>

/**
 * Page ID parameter (OpenAPI)
 */
export const PageIdParam = openapi(PageIdParamSchema, {
  description: 'Page ID path parameter',
})

export type PageIdParam = z.infer<typeof PageIdParam>

/**
 * Placement ID parameter schema (raw Zod)
 */
export const PlacementIdParamSchema = z.object({
  placementId: UUID.describe('Placement ID'),
})

export type PlacementIdParamSchema = z.infer<typeof PlacementIdParamSchema>

/**
 * Placement ID parameter (OpenAPI)
 */
export const PlacementIdParam = openapi(PlacementIdParamSchema, {
  description: 'Placement ID path parameter',
})

export type PlacementIdParam = z.infer<typeof PlacementIdParam>

/**
 * Distribution ID parameter schema (raw Zod)
 */
export const DistributionIdParamSchema = z.object({
  distributionId: UUID.describe('Distribution ID'),
})

export type DistributionIdParamSchema = z.infer<
  typeof DistributionIdParamSchema
>

/**
 * Distribution ID parameter (OpenAPI)
 */
export const DistributionIdParam = openapi(DistributionIdParamSchema, {
  description: 'Distribution ID path parameter',
})

export type DistributionIdParam = z.infer<typeof DistributionIdParam>
