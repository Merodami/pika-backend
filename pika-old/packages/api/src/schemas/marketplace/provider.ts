import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { NonEmptyString, UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Provider profile schema
export const ProviderProfileSchema = Type.Object(
  {
    id: UUIDSchema,
    user_id: UUIDSchema,
    business_name: Type.Object({
      es: Type.Optional(Type.String({ maxLength: 100 })),
      en: Type.Optional(Type.String({ maxLength: 100 })),
      gn: Type.Optional(Type.String({ maxLength: 100 })),
    }),
    business_description: Type.Object({
      es: NonEmptyString(2000),
      en: Type.Optional(Type.String({ maxLength: 2000 })),
      gn: Type.Optional(Type.String({ maxLength: 2000 })),
    }),
    category_id: UUIDSchema,
    verified: Type.Boolean({ default: false }),
    active: Type.Boolean({ default: true }),
    avg_rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
    user: Type.Optional(
      Type.Object({
        id: UUIDSchema,
        email: Type.String({ format: 'email' }),
        first_name: Type.String(),
        last_name: Type.String(),
        phone_number: Type.Optional(Type.String()),
        role: Type.String(),
        status: Type.String(),
        avatar_url: Type.Optional(Type.String({ format: 'uri' })),
      }),
    ),
  },
  { $id: '#/components/schemas/ProviderProfile' },
)

export type ProviderProfile = Static<typeof ProviderProfileSchema>

// Provider profile create request schema
export const ProviderProfileCreateSchema = Type.Object(
  {
    business_name: Type.Object({
      es: Type.Optional(Type.String({ maxLength: 100 })),
      en: Type.Optional(Type.String({ maxLength: 100 })),
      gn: Type.Optional(Type.String({ maxLength: 100 })),
    }),
    business_description: Type.Object({
      es: NonEmptyString(2000),
      en: Type.Optional(Type.String({ maxLength: 2000 })),
      gn: Type.Optional(Type.String({ maxLength: 2000 })),
    }),
    category_id: UUIDSchema,
  },
  { $id: '#/components/schemas/ProviderProfileCreate' },
)

export type ProviderProfileCreate = Static<typeof ProviderProfileCreateSchema>

// Provider profile update request schema
export const ProviderProfileUpdateSchema = Type.Object(
  {
    business_name: Type.Optional(
      Type.Object({
        es: Type.Optional(Type.String({ maxLength: 100 })),
        en: Type.Optional(Type.String({ maxLength: 100 })),
        gn: Type.Optional(Type.String({ maxLength: 100 })),
      }),
    ),
    business_description: Type.Optional(
      Type.Object({
        es: NonEmptyString(2000),
        en: Type.Optional(Type.String({ maxLength: 2000 })),
        gn: Type.Optional(Type.String({ maxLength: 2000 })),
      }),
    ),
    category_id: Type.Optional(UUIDSchema),
    active: Type.Optional(Type.Boolean()),
    verified: Type.Optional(Type.Boolean()),
    avg_rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
  },
  { $id: '#/components/schemas/ProviderProfileUpdate' },
)

export type ProviderProfileUpdate = Static<typeof ProviderProfileUpdateSchema>

// Provider profile list response schema
export const ProviderProfileListResponseSchema = Type.Object(
  {
    data: Type.Array(ProviderProfileSchema),
    pagination: PaginationMetadataSchema,
  },
  { $id: '#/components/schemas/ProviderProfileListResponse' },
)

export type ProviderProfileListResponse = Static<
  typeof ProviderProfileListResponseSchema
>

// Provider search query schema
export const ProviderSearchQuerySchema = Type.Object(
  {
    category_id: Type.Optional(UUIDSchema),
    user_id: Type.Optional(UUIDSchema),
    verified: Type.Optional(Type.Boolean()),
    active: Type.Optional(Type.Boolean()),
    business_name: Type.Optional(Type.String({ maxLength: 100 })),
    min_rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
    max_rating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 10 }),
    ),
    sort: Type.Optional(Type.String()),
    sort_order: Type.Optional(Type.Enum({ asc: 'asc', desc: 'desc' })),
  },
  { $id: '#/components/schemas/ProviderSearchQuery' },
)

export type ProviderSearchQuery = Static<typeof ProviderSearchQuerySchema>

// Provider get query schema
export const ProviderGetQuerySchema = Type.Object(
  {
    include_user: Type.Optional(Type.Boolean()),
  },
  { $id: '#/components/schemas/ProviderGetQuery' },
)

export type ProviderGetQuery = Static<typeof ProviderGetQuerySchema>

// Provider ID parameter schema
export const ProviderIdSchema = Type.Object(
  {
    provider_id: UUIDSchema,
  },
  { $id: '#/components/schemas/ProviderId' },
)

export type ProviderId = Static<typeof ProviderIdSchema>
