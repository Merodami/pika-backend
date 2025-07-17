import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Base schema for entities with common fields
const BaseSchema = Type.Object({
  id: UUIDSchema,
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
})

// Enums
export const VoucherBookTypeSchema = Type.Union([
  Type.Literal('MONTHLY'),
  Type.Literal('SPECIAL'),
  Type.Literal('SEASONAL'),
  Type.Literal('REGIONAL'),
])

export const VoucherBookStatusSchema = Type.Union([
  Type.Literal('DRAFT'),
  Type.Literal('READY_FOR_PRINT'),
  Type.Literal('PUBLISHED'),
  Type.Literal('ARCHIVED'),
])

export const PageLayoutTypeSchema = Type.Union([
  Type.Literal('STANDARD'),
  Type.Literal('CUSTOM'),
])

export const ContentTypeSchema = Type.Union([
  Type.Literal('VOUCHER'),
  Type.Literal('IMAGE'),
  Type.Literal('AD'),
  Type.Literal('SPONSORED'),
])

export const AdSizeSchema = Type.Union([
  Type.Literal('SINGLE'),
  Type.Literal('QUARTER'),
  Type.Literal('HALF'),
  Type.Literal('FULL'),
])

// DTOs
export const VoucherBookCreateSchema = Type.Object({
  title: Type.String(),
  year: Type.Number(),
  edition: Type.Optional(Type.String()),
  book_type: Type.Optional(VoucherBookTypeSchema),
  month: Type.Optional(Type.Number()),
  total_pages: Type.Optional(Type.Number()),
  cover_image_url: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({})),
})

export const VoucherBookUpdateSchema = Type.Object({
  title: Type.Optional(Type.String()),
  edition: Type.Optional(Type.String()),
  book_type: Type.Optional(VoucherBookTypeSchema),
  month: Type.Optional(Type.Number()),
  year: Type.Optional(Type.Number()),
  total_pages: Type.Optional(Type.Number()),
  cover_image_url: Type.Optional(Type.String()),
  back_image_url: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({})),
})

export const VoucherBookStatusUpdateSchema = Type.Object({
  status: VoucherBookStatusSchema,
  pdf_url: Type.Optional(Type.String()),
})

export const VoucherBookPageCreateSchema = Type.Object({
  page_number: Type.Number(),
  layout_type: Type.Optional(PageLayoutTypeSchema),
  metadata: Type.Optional(Type.Object({})),
})

export const VoucherBookPageUpdateSchema = Type.Object({
  layout_type: Type.Optional(PageLayoutTypeSchema),
  metadata: Type.Optional(Type.Object({})),
})

export const AdPlacementCreateSchema = Type.Object({
  position: Type.Number(),
  size: AdSizeSchema,
  content_type: ContentTypeSchema,
  voucher_id: Type.Optional(Type.String()),
  provider_id: Type.Optional(Type.String()),
  image_url: Type.Optional(Type.String()),
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  short_code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({})),
})

export const AdPlacementUpdateSchema = Type.Object({
  position: Type.Optional(Type.Number()),
  size: Type.Optional(AdSizeSchema),
  content_type: Type.Optional(ContentTypeSchema),
  voucher_id: Type.Optional(Type.String()),
  provider_id: Type.Optional(Type.String()),
  image_url: Type.Optional(Type.String()),
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  short_code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Object({})),
})

// Response schemas
export const VoucherBookSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    title: Type.String(),
    book_type: VoucherBookTypeSchema,
    year: Type.Number(),
    status: VoucherBookStatusSchema,
    total_pages: Type.Number(),
    edition: Type.Optional(Type.String()),
    month: Type.Optional(Type.Number()),
    published_at: Type.Optional(Type.String({ format: 'date-time' })),
    cover_image_url: Type.Optional(Type.String()),
    back_image_url: Type.Optional(Type.String()),
    pdf_url: Type.Optional(Type.String()),
    pdf_generated_at: Type.Optional(Type.String({ format: 'date-time' })),
    metadata: Type.Optional(Type.Object({})),
  }),
])

export const VoucherBookPageSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    book_id: Type.String(),
    page_number: Type.Number(),
    layout_type: PageLayoutTypeSchema,
    metadata: Type.Optional(Type.Object({})),
    ad_placements: Type.Optional(Type.Array(Type.Any())), // Will be AdPlacementSchema
  }),
])

export const AdPlacementSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    page_id: Type.String(),
    content_type: ContentTypeSchema,
    position: Type.Number(),
    size: AdSizeSchema,
    spaces_used: Type.Number(),
    voucher_id: Type.Optional(Type.String()),
    provider_id: Type.Optional(Type.String()),
    image_url: Type.Optional(Type.String()),
    qr_code_payload: Type.Optional(Type.String()),
    short_code: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    metadata: Type.Optional(Type.Object({})),
  }),
])

// List response schemas
export const VoucherBookListResponseSchema = Type.Object({
  data: Type.Array(VoucherBookSchema),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    total_pages: Type.Number(),
  }),
})

export const VoucherBookPageListResponseSchema = Type.Object({
  data: Type.Array(VoucherBookPageSchema),
  pagination: Type.Object({
    page: Type.Number(),
    limit: Type.Number(),
    total: Type.Number(),
    total_pages: Type.Number(),
  }),
})

export const AdPlacementListResponseSchema = Type.Object({
  data: Type.Array(AdPlacementSchema),
  total: Type.Number(),
})

// Query schemas
export const VoucherBookSearchQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  status: Type.Optional(VoucherBookStatusSchema),
  book_type: Type.Optional(VoucherBookTypeSchema),
  year: Type.Optional(Type.Number()),
  month: Type.Optional(Type.Number()),
  search: Type.Optional(Type.String()),
  sort: Type.Optional(Type.String()),
  sort_by: Type.Optional(Type.String()),
  sort_order: Type.Optional(
    Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
  ),
  edition: Type.Optional(Type.String()),
})

// Path parameter schemas
export const VoucherBookIdSchema = Type.Object({
  book_id: UUIDSchema,
})

export const VoucherBookPageIdSchema = Type.Object({
  book_id: UUIDSchema,
  page_id: UUIDSchema,
})

export const AdPlacementIdSchema = Type.Object({
  book_id: UUIDSchema,
  page_id: UUIDSchema,
  placement_id: UUIDSchema,
})

// PDF generation response
export const GeneratePDFResponseSchema = Type.Object({
  success: Type.Boolean(),
  pdf_url: Type.Optional(Type.String()),
  generated_at: Type.Optional(Type.String({ format: 'date-time' })),
  error: Type.Optional(Type.String()),
})

// Rate limit status response
export const RateLimitStatusSchema = Type.Object({
  allowed: Type.Boolean(),
  remaining: Type.Number(),
  reset_time: Type.String({ format: 'date-time' }),
  retry_after: Type.Optional(Type.Number()),
})

// Export type aliases
export type VoucherBookCreate = Static<typeof VoucherBookCreateSchema>
export type VoucherBookUpdate = Static<typeof VoucherBookUpdateSchema>
export type VoucherBookStatusUpdate = Static<
  typeof VoucherBookStatusUpdateSchema
>
export type VoucherBook = Static<typeof VoucherBookSchema>
export type VoucherBookId = Static<typeof VoucherBookIdSchema>
export type VoucherBookSearchQuery = Static<typeof VoucherBookSearchQuerySchema>

export type VoucherBookPageCreate = Static<typeof VoucherBookPageCreateSchema>
export type VoucherBookPageUpdate = Static<typeof VoucherBookPageUpdateSchema>
export type VoucherBookPage = Static<typeof VoucherBookPageSchema>
export type VoucherBookPageId = Static<typeof VoucherBookPageIdSchema>

export type AdPlacementCreate = Static<typeof AdPlacementCreateSchema>
export type AdPlacementUpdate = Static<typeof AdPlacementUpdateSchema>
export type AdPlacement = Static<typeof AdPlacementSchema>
export type AdPlacementId = Static<typeof AdPlacementIdSchema>

export type GeneratePDFResponse = Static<typeof GeneratePDFResponseSchema>
export type RateLimitStatus = Static<typeof RateLimitStatusSchema>
