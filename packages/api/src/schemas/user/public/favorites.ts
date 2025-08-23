/**
 * Favorites schemas for public API
 * Allows users to save and manage their favorite businesses and vouchers
 */

import { z } from 'zod'

import { BusinessResponse } from '../../business/public/business.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { MessageResponse, paginatedResponse } from '../../shared/responses.js'
import { VoucherResponse } from '../../voucher/public/voucher.js'

// ============= Favorite Business Schemas =============

/**
 * Favorite business item (raw Zod)
 */
const FavoriteBusinessItem = z.object({
  id: UUID.describe('Favorite record ID'),
  businessId: UUID.describe('Business ID'),
  createdAt: z.coerce.date().describe('When the business was favorited'),
  business: BusinessResponse.optional().describe(
    'Full business details when ?include=business',
  ),
})

/**
 * Favorite business item (OpenAPI documented)
 */
export const FavoriteBusinessItemSchema = FavoriteBusinessItem.openapi(
  'FavoriteBusinessItem',
  {
    description: 'A favorite business relationship',
  },
)

export type FavoriteBusinessItem = z.infer<typeof FavoriteBusinessItem>

/**
 * Get favorite businesses query parameters (raw Zod)
 */
export const GetFavoriteBusinessesQuery = SearchParams.extend({
  sortBy: z
    .enum(['createdAt', 'businessName'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  include: z
    .string()
    .optional()
    .describe('Include related data: business,category,businessDetails'),
})

/**
 * Get favorite businesses query parameters (OpenAPI documented)
 */
export const GetFavoriteBusinessesQuerySchema =
  GetFavoriteBusinessesQuery.openapi('GetFavoriteBusinessesQuery', {
    description: 'Query parameters for listing favorite businesses',
  })

export type GetFavoriteBusinessesQuery = z.infer<
  typeof GetFavoriteBusinessesQuery
>

/**
 * Add favorite business response (raw Zod)
 */
export const AddFavoriteBusinessResponse = z.object({
  message: z.string().default('Business added to favorites'),
  data: FavoriteBusinessItem,
})

/**
 * Add favorite business response (OpenAPI documented)
 */
export const AddFavoriteBusinessResponseSchema =
  AddFavoriteBusinessResponse.openapi('AddFavoriteBusinessResponse', {
    description: 'Response after adding a business to favorites',
  })

export type AddFavoriteBusinessResponse = z.infer<
  typeof AddFavoriteBusinessResponse
>

/**
 * Get favorite businesses response (raw Zod)
 */
export const GetFavoriteBusinessesResponse = paginatedResponse(
  FavoriteBusinessItem,
  {
    description: 'Paginated list of favorite businesses',
  },
)

/**
 * Get favorite businesses response (OpenAPI documented)
 */
export const GetFavoriteBusinessesResponseSchema =
  GetFavoriteBusinessesResponse.openapi('GetFavoriteBusinessesResponse', {
    description: 'Paginated list of favorite businesses',
  })

export type GetFavoriteBusinessesResponse = z.infer<
  typeof GetFavoriteBusinessesResponse
>

// ============= Favorite Voucher Schemas =============

/**
 * Favorite voucher item (raw Zod)
 */
const FavoriteVoucherItem = z.object({
  id: UUID.describe('Favorite record ID'),
  voucherId: UUID.describe('Voucher ID'),
  createdAt: z.coerce.date().describe('When the voucher was favorited'),
  voucher: VoucherResponse.optional().describe(
    'Full voucher details when ?include=voucher',
  ),
})

/**
 * Favorite voucher item (OpenAPI documented)
 */
export const FavoriteVoucherItemSchema = FavoriteVoucherItem.openapi(
  'FavoriteVoucherItem',
  {
    description: 'A favorite voucher relationship',
  },
)

export type FavoriteVoucherItem = z.infer<typeof FavoriteVoucherItem>

/**
 * Get favorite vouchers query parameters (raw Zod)
 */
export const GetFavoriteVouchersQuery = SearchParams.extend({
  sortBy: z
    .enum(['createdAt', 'voucherTitle', 'expiryDate'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  include: z
    .string()
    .optional()
    .describe('Include related data: voucher,business,category'),
})

/**
 * Get favorite vouchers query parameters (OpenAPI documented)
 */
export const GetFavoriteVouchersQuerySchema = GetFavoriteVouchersQuery.openapi(
  'GetFavoriteVouchersQuery',
  {
    description: 'Query parameters for listing favorite vouchers',
  },
)

export type GetFavoriteVouchersQuery = z.infer<typeof GetFavoriteVouchersQuery>

/**
 * Add favorite voucher response (raw Zod)
 */
export const AddFavoriteVoucherResponse = z.object({
  message: z.string().default('Voucher added to favorites'),
  data: FavoriteVoucherItem,
})

/**
 * Add favorite voucher response (OpenAPI documented)
 */
export const AddFavoriteVoucherResponseSchema =
  AddFavoriteVoucherResponse.openapi('AddFavoriteVoucherResponse', {
    description: 'Response after adding a voucher to favorites',
  })

export type AddFavoriteVoucherResponse = z.infer<
  typeof AddFavoriteVoucherResponse
>

/**
 * Get favorite vouchers response (raw Zod)
 */
export const GetFavoriteVouchersResponse = paginatedResponse(
  FavoriteVoucherItem,
  {
    description: 'Paginated list of favorite vouchers',
  },
)

/**
 * Get favorite vouchers response (OpenAPI documented)
 */
export const GetFavoriteVouchersResponseSchema =
  GetFavoriteVouchersResponse.openapi('GetFavoriteVouchersResponse', {
    description: 'Paginated list of favorite vouchers',
  })

export type GetFavoriteVouchersResponse = z.infer<
  typeof GetFavoriteVouchersResponse
>

// ============= Shared Favorite Schemas =============

/**
 * Favorite status response (raw Zod)
 */
export const FavoriteStatusResponse = z.object({
  isFavorited: z.boolean().describe('Whether the item is favorited'),
  favoritedAt: z.coerce
    .date()
    .optional()
    .describe('When the item was favorited (if favorited)'),
})

/**
 * Favorite status response (OpenAPI documented)
 */
export const FavoriteStatusResponseSchema = FavoriteStatusResponse.openapi(
  'FavoriteStatusResponse',
  {
    description: 'Favorite status for an item',
  },
)

export type FavoriteStatusResponse = z.infer<typeof FavoriteStatusResponse>

/**
 * Remove favorite response
 * Using standard MessageResponse from shared
 */
export const RemoveFavoriteResponse = MessageResponse

/**
 * Remove favorite response (OpenAPI documented)
 */
export const RemoveFavoriteResponseSchema = MessageResponse.openapi(
  'RemoveFavoriteResponse',
  {
    description: 'Response after removing an item from favorites',
  },
)

// ============= Batch Operations Schemas =============

/**
 * Batch favorite businesses operation request (raw Zod)
 */
export const BatchFavoriteBusinessesRequest = z.object({
  add: z
    .array(UUID)
    .max(50)
    .optional()
    .describe('Business IDs to add to favorites (max 50)'),
  remove: z
    .array(UUID)
    .max(50)
    .optional()
    .describe('Business IDs to remove from favorites (max 50)'),
})

/**
 * Batch favorite businesses operation request (OpenAPI documented)
 */
export const BatchFavoriteBusinessesRequestSchema =
  BatchFavoriteBusinessesRequest.openapi('BatchFavoriteBusinessesRequest', {
    description: 'Batch operations for managing favorite businesses',
  })

export type BatchFavoriteBusinessesRequest = z.infer<
  typeof BatchFavoriteBusinessesRequest
>

/**
 * Batch favorite vouchers operation request (raw Zod)
 */
export const BatchFavoriteVouchersRequest = z.object({
  add: z
    .array(UUID)
    .max(50)
    .optional()
    .describe('Voucher IDs to add to favorites (max 50)'),
  remove: z
    .array(UUID)
    .max(50)
    .optional()
    .describe('Voucher IDs to remove from favorites (max 50)'),
})

/**
 * Batch favorite vouchers operation request (OpenAPI documented)
 */
export const BatchFavoriteVouchersRequestSchema =
  BatchFavoriteVouchersRequest.openapi('BatchFavoriteVouchersRequest', {
    description: 'Batch operations for managing favorite vouchers',
  })

export type BatchFavoriteVouchersRequest = z.infer<
  typeof BatchFavoriteVouchersRequest
>

/**
 * Batch favorite operation response (raw Zod)
 */
export const BatchFavoriteOperationResponse = z.object({
  added: z.number().int().min(0).describe('Number of items added'),
  removed: z.number().int().min(0).describe('Number of items removed'),
  errors: z
    .array(
      z.object({
        itemId: UUID.describe('ID of the item that failed'),
        operation: z.enum(['add', 'remove']).describe('Operation that failed'),
        error: z.string().describe('Error message'),
      }),
    )
    .describe('List of errors if any operations failed'),
})

/**
 * Batch favorite operation response (OpenAPI documented)
 */
export const BatchFavoriteOperationResponseSchema =
  BatchFavoriteOperationResponse.openapi('BatchFavoriteOperationResponse', {
    description: 'Response for batch favorite operations',
  })

export type BatchFavoriteOperationResponse = z.infer<
  typeof BatchFavoriteOperationResponse
>
