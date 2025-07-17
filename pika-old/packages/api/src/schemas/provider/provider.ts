import { PaginationMetadataSchema } from '@api/schemas/shared/pagination.js'
import { UUIDSchema } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// Simple non-validating multilingual field schema
const createMultilingualField = (maxLength: number, _unused = true) => {
  return Type.Any()
}

// Service Provider schema
export const ProviderSchema = Type.Object(
  {
    id: UUIDSchema,
    user_id: UUIDSchema,
    category_id: UUIDSchema,
    name: createMultilingualField(200),
    description: createMultilingualField(2000),
    email: Type.String({ format: 'email' }),
    phone_number: Type.String(),
    website: Type.Optional(Type.String({ format: 'uri' })),
    address: Type.String(),
    location: Type.Object({
      latitude: Type.Number(),
      longitude: Type.Number(),
    }),
    is_active: Type.Boolean(),
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' }),
  },
  { $id: '#/components/schemas/Provider' },
)

export type Provider = Static<typeof ProviderSchema>

// Provider create request schema
export const ProviderCreateSchema = Type.Object(
  {
    category_id: UUIDSchema,
    name: createMultilingualField(200),
    description: createMultilingualField(2000),
    email: Type.String({ format: 'email' }),
    phone_number: Type.String(),
    website: Type.Optional(Type.String({ format: 'uri' })),
    address: Type.String(),
    location: Type.Object({
      latitude: Type.Number(),
      longitude: Type.Number(),
    }),
  },
  { $id: '#/components/schemas/ProviderCreate' },
)

export type ProviderCreate = Static<typeof ProviderCreateSchema>

// Provider update request schema
export const ProviderUpdateSchema = Type.Object(
  {
    category_id: Type.Optional(UUIDSchema),
    name: Type.Optional(createMultilingualField(200)),
    description: Type.Optional(createMultilingualField(2000)),
    email: Type.Optional(Type.String({ format: 'email' })),
    phone_number: Type.Optional(Type.String()),
    website: Type.Optional(Type.String({ format: 'uri' })),
    address: Type.Optional(Type.String()),
    location: Type.Optional(
      Type.Object({
        latitude: Type.Number(),
        longitude: Type.Number(),
      }),
    ),
    is_active: Type.Optional(Type.Boolean()),
  },
  { $id: '#/components/schemas/ProviderUpdate' },
)

export type ProviderUpdate = Static<typeof ProviderUpdateSchema>

// Provider list response
export const ProviderListResponseSchema = Type.Object(
  {
    data: Type.Array(ProviderSchema),
    pagination: PaginationMetadataSchema,
  },
  { $id: '#/components/schemas/ProviderListResponse' },
)

export type ProviderListResponse = Static<typeof ProviderListResponseSchema>
