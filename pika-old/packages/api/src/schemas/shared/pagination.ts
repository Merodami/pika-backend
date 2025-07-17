import { Static, Type } from '@sinclair/typebox'

/**
 * Metadata describing pagination state.
 */
export const PaginationMetadataSchema = Type.Object(
  {
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
    pages: Type.Number(),
    has_next: Type.Boolean(),
    has_prev: Type.Boolean(),
  },
  { $id: '#/components/schemas/PaginationMetadata' },
)
export type PaginationMetadata = Static<typeof PaginationMetadataSchema>

export const PaginationMetadataRef = Type.Ref(PaginationMetadataSchema)

// Pagination query parameters
export const PaginationQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),
  },
  { $id: '#/components/schemas/PaginationQuery' },
)

export type PaginationQuery = Static<typeof PaginationQuerySchema>

// Sort query parameter
export const SortQuerySchema = Type.Object(
  {
    sort: Type.Optional(Type.String()),
  },
  { $id: '#/components/schemas/SortQuery' },
)

export type SortQuery = Static<typeof SortQuerySchema>
