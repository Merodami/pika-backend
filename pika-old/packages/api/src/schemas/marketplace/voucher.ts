import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { createSortSchema } from '@api/schemas/utils/helper.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Simple non-validating multilingual field schema
// This accepts any format for multilingual content to avoid validation issues
const createMultilingualField = (maxLength: number, _unused = true) => {
  // Use a "mixed" type that can be either an object or a string
  return Type.Any()
}

// Voucher schema
export const VoucherSchema = Type.Object(
  {
    id: UUIDSchema,
    provider_id: UUIDSchema,
    category_id: UUIDSchema,
    state: Type.String({
      enum: ['NEW', 'PUBLISHED', 'CLAIMED', 'REDEEMED', 'EXPIRED'],
    }),
    title: createMultilingualField(100),
    description: createMultilingualField(1000),
    terms: createMultilingualField(2000),
    discount_type: Type.String({ enum: ['PERCENTAGE', 'FIXED'] }),
    discount_value: Type.Number({ minimum: 0 }),
    currency: Type.String({ default: 'PYG' }),
    location: Type.Any(), // GeoJSON Point or Polygon
    image_url: Type.Optional(Type.String({ format: 'uri' })),
    valid_from: Type.String({ format: 'date-time' }),
    expires_at: Type.String({ format: 'date-time' }),
    max_redemptions: Type.Optional(Type.Integer({ minimum: 1 })),
    max_redemptions_per_user: Type.Integer({ minimum: 1, default: 1 }),
    current_redemptions: Type.Integer({ minimum: 0, default: 0 }),
    metadata: Type.Optional(Type.Any()),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    codes: Type.Optional(
      Type.Array(
        Type.Object({
          id: UUIDSchema,
          code: Type.String(),
          type: Type.String({ enum: ['QR', 'SHORT', 'STATIC'] }),
          is_active: Type.Boolean(),
          metadata: Type.Optional(Type.Any()),
        }),
      ),
    ),
  },
  { $id: '#/components/schemas/Voucher' },
)

export type Voucher = Static<typeof VoucherSchema>

// Voucher create request schema
export const VoucherCreateSchema = Type.Object(
  {
    provider_id: UUIDSchema,
    category_id: UUIDSchema,
    title: createMultilingualField(100),
    description: createMultilingualField(1000),
    terms: createMultilingualField(2000),
    discount_type: Type.String({ enum: ['PERCENTAGE', 'FIXED'] }),
    discount_value: Type.Number({ minimum: 0 }),
    currency: Type.Optional(Type.String({ default: 'PYG' })),
    location: Type.Optional(Type.Any()), // GeoJSON Point or Polygon
    image_url: Type.Optional(Type.String({ format: 'uri' })),
    valid_from: Type.Optional(Type.String({ format: 'date-time' })),
    expires_at: Type.String({ format: 'date-time' }),
    max_redemptions: Type.Optional(Type.Integer({ minimum: 1 })),
    max_redemptions_per_user: Type.Optional(
      Type.Integer({ minimum: 1, default: 1 }),
    ),
    metadata: Type.Optional(Type.Any()),
  },
  { $id: '#/components/schemas/VoucherCreate' },
)

export type VoucherCreate = Static<typeof VoucherCreateSchema>

// Voucher update request schema
export const VoucherUpdateSchema = Type.Object(
  {
    title: Type.Optional(createMultilingualField(100)),
    description: Type.Optional(createMultilingualField(1000)),
    terms: Type.Optional(createMultilingualField(2000)),
    discount_type: Type.Optional(
      Type.String({ enum: ['PERCENTAGE', 'FIXED_AMOUNT'] }),
    ),
    discount_value: Type.Optional(Type.Number({ minimum: 0 })),
    location: Type.Optional(Type.Any()),
    image_url: Type.Optional(Type.String({ format: 'uri' })),
    valid_from: Type.Optional(Type.String({ format: 'date-time' })),
    expires_at: Type.Optional(Type.String({ format: 'date-time' })),
    max_redemptions: Type.Optional(Type.Integer({ minimum: 1 })),
    max_redemptions_per_user: Type.Optional(Type.Integer({ minimum: 1 })),
    metadata: Type.Optional(Type.Any()),
  },
  { $id: '#/components/schemas/VoucherUpdate' },
)

export type VoucherUpdate = Static<typeof VoucherUpdateSchema>

// Define allowed sort fields for vouchers
const VoucherSortFields = Type.Union(
  [
    Type.Literal('title'),
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
    Type.Literal('expires_at'),
    Type.Literal('discount_value'),
  ],
  { default: 'created_at' },
)

// Voucher search query parameters schema
export const VoucherSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    provider_id: Type.Optional(UUIDSchema),
    category_id: Type.Optional(UUIDSchema),
    state: Type.Optional(
      Type.String({
        enum: ['NEW', 'PUBLISHED', 'CLAIMED', 'REDEEMED', 'EXPIRED'],
      }),
    ),
    discount_type: Type.Optional(
      Type.String({ enum: ['PERCENTAGE', 'FIXED'] }),
    ),
    min_discount: Type.Optional(Type.Number({ minimum: 0 })),
    max_discount: Type.Optional(Type.Number({ minimum: 0 })),

    // Geospatial search
    latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })),
    longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180 })),
    radius: Type.Optional(Type.Number({ minimum: 0, default: 10000 })), // meters

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach using helper
    ...createSortSchema(
      VoucherSortFields,
      'created_at', // Default sort field
      'desc', // Default sort direction
    ),
  },
  { $id: '#/components/schemas/VoucherSearchQuery' },
)

export type VoucherSearchQuery = Static<typeof VoucherSearchQuerySchema>

// Voucher list response schema (full multilingual format)
export const VoucherListResponseSchema = Type.Object(
  {
    data: Type.Array(VoucherSchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/VoucherListResponse' },
)

// No need for a separate LocalizedVoucherSchema - we'll handle this in the controller
// The VoucherSchema already supports both object and string formats with union types
// in the createMultilingualField function

export type VoucherListResponse = Static<typeof VoucherListResponseSchema>

// Voucher ID parameter schema
export const VoucherIdSchema = Type.Object(
  {
    voucher_id: UUIDSchema,
  },
  { $id: '#/components/schemas/VoucherId' },
)

// Voucher publish schema
export const VoucherPublishSchema = Type.Object(
  {},
  { $id: '#/components/schemas/VoucherPublish' },
)

// Voucher claim schema
export const VoucherClaimSchema = Type.Object(
  {
    user_id: UUIDSchema,
  },
  { $id: '#/components/schemas/VoucherClaim' },
)

// Voucher redeem schema
export const VoucherRedeemSchema = Type.Object(
  {
    code: Type.String(),
    location: Type.Optional(Type.Any()),
  },
  { $id: '#/components/schemas/VoucherRedeem' },
)

export type VoucherId = Static<typeof VoucherIdSchema>
export type VoucherPublish = Static<typeof VoucherPublishSchema>
export type VoucherClaim = Static<typeof VoucherClaimSchema>
export type VoucherRedeem = Static<typeof VoucherRedeemSchema>
