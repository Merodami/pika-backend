import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { createSortSchema } from '@api/schemas/utils/helper.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Review schema
export const ReviewSchema = Type.Object(
  {
    id: UUIDSchema,
    provider_id: UUIDSchema,
    customer_id: UUIDSchema,
    rating: Type.Integer({ minimum: 1, maximum: 5 }),
    review: Type.Optional(Type.String({ maxLength: 1000 })),
    response: Type.Optional(Type.String({ maxLength: 1000 })),
    response_at: Type.Optional(Type.String({ format: 'date-time' })),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
  },
  { $id: '#/components/schemas/Review' },
)

export type Review = Static<typeof ReviewSchema>

// Review create request schema
export const ReviewCreateSchema = Type.Object(
  {
    provider_id: UUIDSchema,
    rating: Type.Integer({ minimum: 1, maximum: 5 }),
    review: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  { $id: '#/components/schemas/ReviewCreate' },
)

export type ReviewCreate = Static<typeof ReviewCreateSchema>

// Review update request schema
export const ReviewUpdateSchema = Type.Object(
  {
    rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),
    review: Type.Optional(Type.String({ maxLength: 1000 })),
  },
  { $id: '#/components/schemas/ReviewUpdate' },
)

export type ReviewUpdate = Static<typeof ReviewUpdateSchema>

// Review response create request schema
export const ReviewResponseCreateSchema = Type.Object(
  {
    response: Type.String({ minLength: 1, maxLength: 1000 }),
  },
  { $id: '#/components/schemas/ReviewResponseCreate' },
)

export type ReviewResponseCreate = Static<typeof ReviewResponseCreateSchema>

// Review list response schema
export const ReviewListResponseSchema = Type.Object(
  {
    data: Type.Array(ReviewSchema),
    pagination: PaginationMetadataSchema,
  },
  { $id: '#/components/schemas/ReviewListResponse' },
)

export type ReviewListResponse = Static<typeof ReviewListResponseSchema>

// Define allowed sort fields for reviews
const ReviewSortFields = Type.Union(
  [
    Type.Literal('rating'),
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
  ],
  { default: 'created_at' },
)

// Review search query parameters schema
export const ReviewSearchQuerySchema = Type.Object(
  {
    // Filter parameters
    provider_id: Type.Optional(UUIDSchema),
    customer_id: Type.Optional(UUIDSchema),
    rating: Type.Optional(Type.Integer({ minimum: 1, maximum: 5 })),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach
    ...createSortSchema(
      ReviewSortFields,
      'created_at', // Default sort field
      'desc', // Default sort direction (newest first)
    ),
  },
  { $id: '#/components/schemas/ReviewSearchQuery' },
)

export type ReviewSearchQuery = Static<typeof ReviewSearchQuerySchema>

// Review ID parameter schema
export const ReviewIdSchema = Type.Object(
  {
    review_id: UUIDSchema,
  },
  { $id: '#/components/schemas/ReviewId' },
)

export type ReviewId = Static<typeof ReviewIdSchema>

// Review provider response schema (alias for ReviewResponseCreateSchema)
export const ReviewResponseSchema = ReviewResponseCreateSchema

// Review statistics schema
export const ReviewStatsSchema = Type.Object(
  {
    total_reviews: Type.Integer({ minimum: 0 }),
    average_rating: Type.Number({ minimum: 0, maximum: 5 }),
    rating_distribution: Type.Object({
      '1': Type.Integer({ minimum: 0 }),
      '2': Type.Integer({ minimum: 0 }),
      '3': Type.Integer({ minimum: 0 }),
      '4': Type.Integer({ minimum: 0 }),
      '5': Type.Integer({ minimum: 0 }),
    }),
    recent_reviews: Type.Optional(Type.Array(ReviewSchema)),
  },
  { $id: '#/components/schemas/ReviewStats' },
)

export type ReviewStats = Static<typeof ReviewStatsSchema>
