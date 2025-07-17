import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { createSortSchema } from '@api/schemas/utils/helper.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Simple non-validating multilingual field schema
const createMultilingualField = (maxLength: number, _unused = true) => {
  return Type.Any()
}

// Redemption schema
export const RedemptionSchema = Type.Object(
  {
    id: UUIDSchema,
    voucher_id: UUIDSchema,
    customer_id: UUIDSchema,
    provider_id: UUIDSchema,
    code: Type.String({ description: 'QR token or short code used' }),
    redeemed_at: Type.String({ format: 'date-time' }),
    location: Type.Optional(
      Type.Object({
        lat: Type.Number({ minimum: -90, maximum: 90 }),
        lng: Type.Number({ minimum: -180, maximum: 180 }),
      }),
    ),
    offline_redemption: Type.Boolean({ default: false }),
    synced_at: Type.Optional(Type.String({ format: 'date-time' })),
    metadata: Type.Optional(Type.Any()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
  },
  { $id: '#/components/schemas/Redemption' },
)

export type Redemption = Static<typeof RedemptionSchema>

// Redemption view schema (includes voucher and retailer info)
export const RedemptionViewSchema = Type.Object(
  {
    id: UUIDSchema,
    voucher_id: UUIDSchema,
    voucher_title: createMultilingualField(100),
    voucher_discount: Type.String(),
    customer_id: UUIDSchema,
    customer_name: Type.Optional(Type.String()),
    provider_id: UUIDSchema,
    provider_name: Type.String(),
    redeemed_at: Type.String({ format: 'date-time' }),
    location: Type.Optional(
      Type.Object({
        lat: Type.Number(),
        lng: Type.Number(),
      }),
    ),
  },
  { $id: '#/components/schemas/RedemptionView' },
)

export type RedemptionView = Static<typeof RedemptionViewSchema>

// Redeem voucher request schema
export const RedeemVoucherDTOSchema = Type.Object(
  {
    code: Type.String({
      description: 'JWT token from QR code or short alphanumeric code',
      minLength: 1,
    }),
    customer_id: Type.Optional(UUIDSchema), // Optional, can come from JWT
    location: Type.Optional(
      Type.Object({
        lat: Type.Number({ minimum: -90, maximum: 90 }),
        lng: Type.Number({ minimum: -180, maximum: 180 }),
      }),
    ),
    offline_redemption: Type.Optional(Type.Boolean({ default: false })),
  },
  { $id: '#/components/schemas/RedeemVoucherDTO' },
)

export type RedeemVoucherDTO = Static<typeof RedeemVoucherDTOSchema>

// Redemption result schema
export const RedemptionResultDTOSchema = Type.Object(
  {
    success: Type.Boolean(),
    redemption_id: Type.Optional(UUIDSchema),
    voucher_details: Type.Optional(
      Type.Object({
        title: Type.String(),
        discount: Type.String(),
        provider_name: Type.String(),
        instructions: Type.Optional(Type.String()),
      }),
    ),
    error: Type.Optional(Type.String()),
    error_code: Type.Optional(
      Type.String({
        enum: [
          'INVALID_CODE',
          'EXPIRED',
          'ALREADY_REDEEMED',
          'VOUCHER_NOT_FOUND',
          'INVALID_PROVIDER',
        ],
      }),
    ),
  },
  { $id: '#/components/schemas/RedemptionResultDTO' },
)

export type RedemptionResultDTO = Static<typeof RedemptionResultDTOSchema>

// Offline validation request schema
export const ValidateOfflineDTOSchema = Type.Object(
  {
    token: Type.String({ description: 'JWT token to validate offline' }),
  },
  { $id: '#/components/schemas/ValidateOfflineDTO' },
)

export type ValidateOfflineDTO = Static<typeof ValidateOfflineDTOSchema>

// Offline validation result schema
export const OfflineValidationResultSchema = Type.Object(
  {
    valid: Type.Boolean(),
    voucher_id: Type.Optional(UUIDSchema),
    customer_id: Type.Optional(UUIDSchema),
    expiry: Type.Optional(Type.String({ format: 'date-time' })),
    error: Type.Optional(Type.String()),
  },
  { $id: '#/components/schemas/OfflineValidationResult' },
)

export type OfflineValidationResult = Static<
  typeof OfflineValidationResultSchema
>

// Sync offline redemptions request schema
export const SyncOfflineRedemptionsDTOSchema = Type.Object(
  {
    redemptions: Type.Array(
      Type.Object({
        code: Type.String(),
        redeemed_at: Type.String({ format: 'date-time' }),
        location: Type.Optional(
          Type.Object({
            lat: Type.Number(),
            lng: Type.Number(),
          }),
        ),
        device_id: Type.Optional(Type.String()),
      }),
    ),
  },
  { $id: '#/components/schemas/SyncOfflineRedemptionsDTO' },
)

export type SyncOfflineRedemptionsDTO = Static<
  typeof SyncOfflineRedemptionsDTOSchema
>

// Redemption sort fields
const RedemptionSortFields = Type.Union(
  [
    Type.Literal('redeemed_at'),
    Type.Literal('created_at'),
    Type.Literal('synced_at'),
  ],
  { default: 'redeemed_at' },
)

// Redemption search query parameters schema
export const RedemptionSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    voucher_id: Type.Optional(UUIDSchema),
    customer_id: Type.Optional(UUIDSchema),
    provider_id: Type.Optional(UUIDSchema),
    offline_redemption: Type.Optional(Type.Boolean()),

    // Date range filters
    from_date: Type.Optional(Type.String({ format: 'date-time' })),
    to_date: Type.Optional(Type.String({ format: 'date-time' })),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters
    ...createSortSchema(RedemptionSortFields, 'redeemed_at', 'desc'),
  },
  { $id: '#/components/schemas/RedemptionSearchQuery' },
)

export type RedemptionSearchQuery = Static<typeof RedemptionSearchQuerySchema>

// Redemption list response schema
export const RedemptionListResponseSchema = Type.Object(
  {
    data: Type.Array(RedemptionViewSchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/RedemptionListResponse' },
)

export type RedemptionListResponse = Static<typeof RedemptionListResponseSchema>

// Redemption ID parameter schema
export const RedemptionIdSchema = Type.Object(
  {
    redemption_id: UUIDSchema,
  },
  { $id: '#/components/schemas/RedemptionId' },
)

export type RedemptionId = Static<typeof RedemptionIdSchema>

// Generate QR code request schema
export const GenerateQRCodeDTOSchema = Type.Object(
  {
    token: Type.String({ description: 'JWT token to encode in QR' }),
    format: Type.Optional(
      Type.String({ enum: ['png', 'svg'], default: 'png' }),
    ),
  },
  { $id: '#/components/schemas/GenerateQRCodeDTO' },
)

export type GenerateQRCodeDTO = Static<typeof GenerateQRCodeDTOSchema>

// QR code response schema
export const QRCodeResponseDTOSchema = Type.Object(
  {
    qr_code: Type.String({ description: 'Base64 encoded QR code or SVG' }),
    format: Type.String({ enum: ['png', 'svg'] }),
  },
  { $id: '#/components/schemas/QRCodeResponseDTO' },
)

export type QRCodeResponseDTO = Static<typeof QRCodeResponseDTOSchema>

// Sync result schema
export const SyncResultDTOSchema = Type.Object(
  {
    success: Type.Boolean(),
    synced_count: Type.Integer({ minimum: 0 }),
    failed_count: Type.Integer({ minimum: 0 }),
    errors: Type.Optional(
      Type.Array(
        Type.Object({
          code: Type.String(),
          error: Type.String(),
        }),
      ),
    ),
  },
  { $id: '#/components/schemas/SyncResultDTO' },
)

export type SyncResultDTO = Static<typeof SyncResultDTOSchema>

// Redemption search params for query string
export const RedemptionSearchParamsSchema = Type.Object(
  {
    voucher_id: Type.Optional(UUIDSchema),
    customer_id: Type.Optional(UUIDSchema),
    provider_id: Type.Optional(UUIDSchema),
    offline_only: Type.Optional(Type.Boolean()),
    from_date: Type.Optional(Type.String({ format: 'date' })),
    to_date: Type.Optional(Type.String({ format: 'date' })),
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),
  },
  { $id: '#/components/schemas/RedemptionSearchParams' },
)

export type RedemptionSearchParams = Static<typeof RedemptionSearchParamsSchema>

// Paginated redemption response
export const PaginatedRedemptionResponseSchema = Type.Object(
  {
    items: Type.Array(RedemptionViewSchema),
    total: Type.Integer({ minimum: 0 }),
    page: Type.Integer({ minimum: 1 }),
    limit: Type.Integer({ minimum: 1 }),
    total_pages: Type.Integer({ minimum: 0 }),
  },
  { $id: '#/components/schemas/PaginatedRedemptionResponse' },
)

export type PaginatedRedemptionResponse = Static<
  typeof PaginatedRedemptionResponseSchema
>

// Offline validation result DTO schema
export const OfflineValidationResultDTOSchema = OfflineValidationResultSchema

export type OfflineValidationResultDTO = OfflineValidationResult
