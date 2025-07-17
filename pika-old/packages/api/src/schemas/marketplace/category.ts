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

// Category schema
export const CategorySchema = Type.Object(
  {
    id: UUIDSchema,
    name: createMultilingualField(100),
    description: createMultilingualField(1000),
    icon_url: Type.Optional(Type.String({ format: 'uri' })),
    slug: Type.String({
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      maxLength: 100,
    }),
    parent_id: Type.Optional(UUIDSchema),
    level: Type.Integer({ minimum: 1 }),
    path: Type.String(),
    active: Type.Boolean({ default: true }),
    sort_order: Type.Integer({ default: 0 }),
    created_at: Type.Optional(Type.String({ format: 'date-time' })),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    children: Type.Optional(
      Type.Array(Type.Ref('#/components/schemas/Category')),
    ),
  },
  { $id: '#/components/schemas/Category' },
)

export type Category = Static<typeof CategorySchema>

// Category create request schema
export const CategoryCreateSchema = Type.Object(
  {
    name: createMultilingualField(100),
    description: createMultilingualField(1000),
    icon_url: Type.Optional(Type.String({ format: 'uri' })),
    slug: Type.String({
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      maxLength: 100,
    }),
    parent_id: Type.Optional(UUIDSchema),
    active: Type.Optional(Type.Boolean({ default: true })),
    sort_order: Type.Optional(Type.Integer({ default: 0 })),
  },
  { $id: '#/components/schemas/CategoryCreate' },
)

export type CategoryCreate = Static<typeof CategoryCreateSchema>

// Category update request schema
export const CategoryUpdateSchema = Type.Object(
  {
    name: Type.Optional(createMultilingualField(100)),
    description: Type.Optional(createMultilingualField(1000)),
    icon_url: Type.Optional(Type.String({ format: 'uri' })),
    slug: Type.Optional(
      Type.String({ pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 100 }),
    ),
    parent_id: Type.Optional(UUIDSchema),
    active: Type.Optional(Type.Boolean({ default: true })),
    sort_order: Type.Optional(Type.Integer({ default: 0 })),
  },
  { $id: '#/components/schemas/CategoryUpdate' },
)

export type CategoryUpdate = Static<typeof CategoryUpdateSchema>

// Define allowed sort fields for categories
const CategorySortFields = Type.Union(
  [
    Type.Literal('name'),
    Type.Literal('created_at'),
    Type.Literal('updated_at'),
    Type.Literal('sort_order'),
  ],
  { default: 'sort_order' },
)

// Category search query parameters schema
export const CategorySearchQuerySchema = Type.Object(
  {
    // Filter parameters
    parent_id: Type.Optional(UUIDSchema),
    level: Type.Optional(Type.Integer({ minimum: 1 })),
    active: Type.Optional(Type.Boolean()),
    include_children: Type.Optional(Type.Boolean({ default: false })),

    // Pagination parameters
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
    ),

    // Sorting parameters - standardized approach using helper
    ...createSortSchema(
      CategorySortFields,
      'sort_order', // Default sort field
      'asc', // Default sort direction
    ),
  },
  { $id: '#/components/schemas/CategorySearchQuery' },
)

export type CategorySearchQuery = Static<typeof CategorySearchQuerySchema>

// Category list response schema (full multilingual format)
export const CategoryListResponseSchema = Type.Object(
  {
    data: Type.Array(CategorySchema),
    pagination: Type.Optional(PaginationMetadataSchema),
  },
  { $id: '#/components/schemas/CategoryListResponse' },
)

// No need for a separate LocalizedCategorySchema - we'll handle this in the controller
// The CategorySchema already supports both object and string formats with union types
// in the createMultilingualField function

export type CategoryListResponse = Static<typeof CategoryListResponseSchema>

// Category ID parameter schema
export const CategoryIdSchema = Type.Object(
  {
    category_id: UUIDSchema,
  },
  { $id: '#/components/schemas/CategoryId' },
)

export type CategoryId = Static<typeof CategoryIdSchema>
